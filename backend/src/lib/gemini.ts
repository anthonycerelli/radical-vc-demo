import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error('Missing required environment variable: GEMINI_API_KEY must be set');
}

export const genAI = new GoogleGenerativeAI(geminiApiKey);

// Embedding model configuration
// Note: Gemini uses text-embedding-004 for embeddings via the REST API
// We'll use the embedding model through the Generative AI SDK
export const EMBEDDING_MODEL = 'text-embedding-004';
export const EMBEDDING_DIMENSIONS = 768; // Gemini embeddings are 768 dimensions

// Chat model configuration
export const CHAT_MODEL = 'gemini-pro';

/**
 * Generate embedding for text using Gemini
 * Note: Gemini embeddings are 768 dimensions, not 1536 like OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Gemini doesn't have a direct embeddings API in the SDK
  // We need to use the REST API for embeddings
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: {
          parts: [{ text }],
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini embedding API error: ${error}`);
  }

  const data = await response.json();
  
  // Handle the response structure
  if (data.embedding && data.embedding.values) {
    return data.embedding.values;
  }
  
  // Fallback: sometimes the response structure is different
  if (Array.isArray(data.embedding)) {
    return data.embedding;
  }
  
  throw new Error('Unexpected response format from Gemini embedding API');
}

/**
 * Generate chat completion using Gemini
 */
export async function generateChatCompletion(
  systemPrompt: string,
  userMessage: string,
  context?: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: CHAT_MODEL });

  // Combine system prompt and context into a single prompt
  let fullPrompt = systemPrompt;
  
  if (context) {
    fullPrompt += `\n\nContext:\n${context}`;
  }
  
  fullPrompt += `\n\nUser: ${userMessage}`;

  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  
  return response.text();
}

