import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error('Missing required environment variable: OPENAI_API_KEY must be set');
}

export const openai = new OpenAI({
  apiKey: openaiApiKey,
});

// Embedding model configuration
export const EMBEDDING_MODEL = 'text-embedding-3-large';
export const EMBEDDING_DIMENSIONS = 1536;

// Chat model configuration
export const CHAT_MODEL = 'gpt-4-turbo-preview';

/**
 * Generate embedding for text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data[0].embedding;
}

/**
 * Generate chat completion using OpenAI
 */
export async function generateChatCompletion(
  systemPrompt: string,
  userMessage: string,
  context?: string
): Promise<string> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
  ];

  if (context) {
    messages.push({
      role: 'system',
      content: `Context:\n${context}`,
    });
  }

  messages.push({
    role: 'user',
    content: userMessage,
  });

  const response = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 1000,
  });

  return response.choices[0]?.message?.content || '';
}

