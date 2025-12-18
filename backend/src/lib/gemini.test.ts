import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dotenv
vi.mock('dotenv', () => ({
  default: {
    config: vi.fn(),
  },
}));

// Import after mocking
import {
  generateEmbedding,
  generateChatCompletion,
  genAI,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
  CHAT_MODEL,
} from './gemini.js';

describe('Gemini library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Constants', () => {
    it('should have correct embedding model name', () => {
      expect(EMBEDDING_MODEL).toBe('text-embedding-004');
    });

    it('should have correct embedding dimensions', () => {
      expect(EMBEDDING_DIMENSIONS).toBe(768);
    });

    it('should have correct chat model name', () => {
      expect(CHAT_MODEL).toBe('gemini-2.5-flash');
    });
  });

  describe('generateEmbedding', () => {
    it('should generate embedding using SDK method if available', async () => {
      const mockEmbedding = new Array(768).fill(0.1);

      // Mock the SDK embedContent method
      const mockEmbedContent = vi.fn().mockResolvedValue({
        embeddings: [{ values: mockEmbedding }],
      });

      // @ts-expect-error - Mocking embedContent
      genAI.embedContent = mockEmbedContent;

      const result = await generateEmbedding('test text');

      expect(result).toEqual(mockEmbedding);
      expect(result.length).toBe(768);
      expect(mockEmbedContent).toHaveBeenCalled();
    });

    it('should fallback to REST API if SDK method fails', async () => {
      const mockEmbedding = new Array(768).fill(0.1);
      const mockResponse = {
        embedding: {
          values: mockEmbedding,
        },
      };

      // Mock SDK method to throw error
      // @ts-expect-error - embedContent may not exist in types but we're mocking it for testing
      genAI.embedContent = vi.fn().mockRejectedValue(new Error('SDK error'));

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await generateEmbedding('test text');

      expect(result).toEqual(mockEmbedding);
      expect(result.length).toBe(768);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should generate embedding using REST API', async () => {
      const mockEmbedding = new Array(768).fill(0.1);
      const mockResponse = {
        embedding: {
          values: mockEmbedding,
        },
      };

      // Ensure SDK method doesn't exist
      // @ts-expect-error - embedContent may not exist in types but we're deleting it for testing
      delete genAI.embedContent;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await generateEmbedding('test text');

      expect(result).toEqual(mockEmbedding);
      expect(result.length).toBe(768);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        text: async () => 'API Error',
      } as Response);

      await expect(generateEmbedding('test text')).rejects.toThrow();
    });

    it('should validate embedding dimensions', async () => {
      const mockEmbedding = new Array(500).fill(0.1); // Wrong dimension
      const mockResponse = {
        embedding: {
          values: mockEmbedding,
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await expect(generateEmbedding('test text')).rejects.toThrow();
    });

    it('should handle invalid embedding response format', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}), // Missing embedding
      } as Response);

      await expect(generateEmbedding('test text')).rejects.toThrow();
    });
  });

  describe('generateChatCompletion', () => {
    it('should generate chat completion with system prompt and user message', async () => {
      const mockResponse = {
        response: {
          text: vi.fn().mockResolvedValue('Test response'),
        },
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue(mockResponse),
      };

      vi.spyOn(genAI, 'getGenerativeModel').mockReturnValue(mockModel as any);

      const result = await generateChatCompletion('You are a helpful assistant', 'What is AI?');

      expect(result).toBe('Test response');
      expect(mockModel.generateContent).toHaveBeenCalled();
    });

    it('should include context when provided', async () => {
      const mockResponse = {
        response: {
          text: vi.fn().mockResolvedValue('Test response'),
        },
      };

      const mockModel = {
        generateContent: vi.fn().mockResolvedValue(mockResponse),
      };

      vi.spyOn(genAI, 'getGenerativeModel').mockReturnValue(mockModel as any);

      await generateChatCompletion(
        'You are a helpful assistant',
        'What is AI?',
        'Context information'
      );

      const callArgs = mockModel.generateContent.mock.calls[0][0];
      expect(callArgs.contents[0].parts[0].text).toContain('Context:');
      expect(callArgs.contents[0].parts[0].text).toContain('Context information');
    });

    it('should handle errors', async () => {
      const mockModel = {
        generateContent: vi.fn().mockRejectedValue(new Error('API error')),
      };

      vi.spyOn(genAI, 'getGenerativeModel').mockReturnValue(mockModel as any);

      await expect(generateChatCompletion('System prompt', 'User message')).rejects.toThrow();
    });
  });
});
