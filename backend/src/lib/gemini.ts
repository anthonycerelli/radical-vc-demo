import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error('Missing required environment variable: GEMINI_API_KEY must be set');
}

export const genAI = new GoogleGenerativeAI(geminiApiKey);

// Embedding model configuration
// Using text-embedding-004 - dedicated embedding model for semantic search
export const EMBEDDING_MODEL = 'text-embedding-004';
export const EMBEDDING_DIMENSIONS = 768; // Default dimension for text-embedding-004

// Chat model configuration
// Using gemini-2.5-flash for chat/completions (free tier: 5 RPM / 250k TPM)
export const CHAT_MODEL = 'gemini-2.5-flash';

/**
 * Generate embedding for text using Gemini text-embedding-004
 * Returns 768-dimensional vector for semantic search
 * Uses the dedicated embedding model via the Gemini API
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Try using the SDK's embedContent method if available
    // Otherwise fallback to REST API
    let embedding: number[] | undefined;

    // Try SDK method first (if the method exists on the client)
    try {
      // @ts-expect-error - embedContent might not be in types but could exist at runtime
      if (typeof genAI.embedContent === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (genAI as any).embedContent({
          model: EMBEDDING_MODEL,
          contents: [text],
        });
        
        // Response structure: { embeddings: [{ values: [...] }] }
        if (result.embeddings && result.embeddings[0]?.values) {
          embedding = result.embeddings[0].values;
        }
      }
    } catch {
      // Fall through to REST API
    }

    // Fallback to REST API if SDK method didn't work
    if (!embedding) {
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

      const data = (await response.json()) as { embedding?: { values?: number[] } };
      embedding = data.embedding?.values;
    }
    
    if (!embedding || !Array.isArray(embedding)) {
      throw new Error('Invalid embedding response format');
    }
    
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Expected embedding of length ${EMBEDDING_DIMENSIONS}, got ${embedding.length}`);
    }

    return embedding;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate embedding: ${message}`);
  }
}

/**
 * Generate chat completion using Gemini gemini-2.5-flash
 * Combines system prompt, context, and user message into a structured conversation
 */
export async function generateChatCompletion(
  systemPrompt: string,
  userMessage: string,
  context?: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ 
    model: CHAT_MODEL,
    // @ts-expect-error - systemInstruction may not be in types but is supported
    systemInstruction: systemPrompt,
  });

  // Build the user message with context if provided
  let userContent = userMessage;
  if (context) {
    userContent = `Context:\n${context}\n\nUser Question: ${userMessage}`;
  }

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userContent }] }],
    });

    const response = await result.response;
    return response.text();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate chat completion: ${message}`);
  }
}

