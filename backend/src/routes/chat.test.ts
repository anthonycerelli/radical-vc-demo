import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import chatRouter from './chat.js';
import * as supabaseClient from '../lib/supabaseClient.js';
import * as geminiLib from '../lib/gemini.js';

// Mock dependencies
vi.mock('../lib/supabaseClient.js', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock('../lib/gemini.js', () => ({
  generateEmbedding: vi.fn(),
  generateChatCompletion: vi.fn(),
}));

describe('Chat route', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/chat', chatRouter);
    vi.clearAllMocks();
  });

  describe('POST /api/chat', () => {
    it('should validate request body', async () => {
      const response = await request(app).post('/api/chat').send({});

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('Invalid request body');
    });

    it('should process chat message with RPC search', async () => {
      const mockEmbedding = new Array(768).fill(0.1);
      const mockCompanies = [
        {
          company: {
            id: '1',
            name: 'Company A',
            slug: 'company-a',
            radical_primary_category: 'AI',
          },
          distance: 0.2,
        },
      ];
      const mockAnswer = 'This is a test answer';

      // Mock embedding count check (returns count > 0)
      const embeddingCountQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          count: 10,
          error: null,
        }),
      };

      vi.mocked(geminiLib.generateEmbedding).mockResolvedValue(mockEmbedding);
      vi.mocked(supabaseClient.supabase.from).mockReturnValueOnce(embeddingCountQuery as any);
      vi.mocked(supabaseClient.supabase.rpc).mockResolvedValue({
        data: mockCompanies,
        error: null,
      } as any);
      vi.mocked(geminiLib.generateChatCompletion).mockResolvedValue(mockAnswer);

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'test message', topK: 5 });

      expect(response.status).toBe(200);
      expect(response.body.answer).toBe(mockAnswer);
      expect(response.body.sources).toHaveLength(1);
    });

    it('should handle fallback search when RPC fails', async () => {
      const mockEmbedding = new Array(768).fill(0.1);
      const mockCompany = {
        id: '1',
        name: 'Company A',
        slug: 'company-a',
        radical_primary_category: 'AI',
      };
      const mockAnswer = 'This is a test answer';

      vi.mocked(geminiLib.generateEmbedding).mockResolvedValue(mockEmbedding);
      vi.mocked(supabaseClient.supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'RPC not found' },
      } as any);

      // Mock embedding count check (returns 0, triggering fallback)
      const embeddingCountQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          count: 0,
          error: null,
        }),
      };

      // Mock keyword search query with .or() method
      const keywordSearchQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [mockCompany],
          error: null,
        }),
      };

      vi.mocked(supabaseClient.supabase.from)
        .mockReturnValueOnce(embeddingCountQuery as any)
        .mockReturnValueOnce(keywordSearchQuery as any);

      vi.mocked(geminiLib.generateChatCompletion).mockResolvedValue(mockAnswer);

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'test message', topK: 5 });

      expect(response.status).toBe(200);
      expect(response.body.answer).toBe(mockAnswer);
    });

    it('should include selected company in context', async () => {
      const mockEmbedding = new Array(768).fill(0.1);
      const mockSelectedCompany = {
        id: '1',
        name: 'Selected Company',
        slug: 'selected-company',
        radical_primary_category: 'AI',
        description: 'Test description',
        radical_investment_year: 2023,
      };
      const mockAnswer = 'This is a test answer';

      vi.mocked(geminiLib.generateEmbedding).mockResolvedValue(mockEmbedding);
      vi.mocked(supabaseClient.supabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      // Mock embedding count check (returns 0, triggering fallback)
      const embeddingCountQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          count: 0,
          error: null,
        }),
      };

      // Mock keyword search query with .or() method
      const keywordSearchQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      // Mock selected company query - needs to be called before embedding count
      const selectedCompanyQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockSelectedCompany,
          error: null,
        }),
      };

      vi.mocked(supabaseClient.supabase.from)
        .mockReturnValueOnce(selectedCompanyQuery as any) // For selected company lookup (happens first)
        .mockReturnValueOnce(embeddingCountQuery as any) // For embedding count check
        .mockReturnValueOnce(keywordSearchQuery as any); // For keyword search

      vi.mocked(geminiLib.generateChatCompletion).mockResolvedValue(mockAnswer);

      const response = await request(app).post('/api/chat').send({
        message: 'test message',
        selectedCompanySlug: 'selected-company',
      });

      expect(response.status).toBe(200);
      expect(response.body.sources).toContainEqual({
        name: mockSelectedCompany.name,
        slug: mockSelectedCompany.slug,
        radical_primary_category: mockSelectedCompany.radical_primary_category,
      });
    });

    it('should handle errors', async () => {
      vi.mocked(geminiLib.generateEmbedding).mockRejectedValue(new Error('API error'));

      const response = await request(app).post('/api/chat').send({ message: 'test message' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });

    it('should handle different embedding formats in fallback', async () => {
      const mockEmbedding = new Array(768).fill(0.1);
      const mockCompany = {
        id: '1',
        name: 'Company A',
        slug: 'company-a',
        radical_primary_category: 'AI',
      };

      vi.mocked(geminiLib.generateEmbedding).mockResolvedValue(mockEmbedding);
      vi.mocked(supabaseClient.supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'RPC not found' },
      } as any);

      // Mock embedding count check (returns 0, triggering fallback)
      const embeddingCountQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          count: 0,
          error: null,
        }),
      };

      // Mock keyword search query with .or() method
      const keywordSearchQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [mockCompany],
          error: null,
        }),
      };

      vi.mocked(supabaseClient.supabase.from)
        .mockReturnValueOnce(embeddingCountQuery as any)
        .mockReturnValueOnce(keywordSearchQuery as any);

      vi.mocked(geminiLib.generateChatCompletion).mockResolvedValue('Answer');

      const response = await request(app).post('/api/chat').send({ message: 'test message' });

      expect(response.status).toBe(200);
    });

    it('should handle client-side similarity search fallback when RPC fails', async () => {
      const mockEmbedding = new Array(768).fill(0.1);
      const mockCompany = {
        id: '1',
        name: 'Company A',
        slug: 'company-a',
        radical_primary_category: 'AI',
      };
      const mockEmbeddings = [
        {
          company_id: '1',
          embedding: mockEmbedding, // Array format
        },
      ];
      const mockAnswer = 'This is a test answer';

      vi.mocked(geminiLib.generateEmbedding).mockResolvedValue(mockEmbedding);

      // Mock embedding count check (returns > 0)
      const embeddingCountQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          count: 5,
          error: null,
        }),
      };

      // Mock RPC to fail
      vi.mocked(supabaseClient.supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'RPC function not found' },
      } as any);

      // Mock embeddings fetch for client-side search
      const embeddingsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockEmbeddings,
          error: null,
        }),
      };

      // Mock companies fetch
      const companiesQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [mockCompany],
          error: null,
        }),
      };

      vi.mocked(supabaseClient.supabase.from)
        .mockReturnValueOnce(embeddingCountQuery as any)
        .mockReturnValueOnce(embeddingsQuery as any)
        .mockReturnValueOnce(companiesQuery as any);

      vi.mocked(geminiLib.generateChatCompletion).mockResolvedValue(mockAnswer);

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'test message', topK: 5 });

      expect(response.status).toBe(200);
      expect(response.body.answer).toBe(mockAnswer);
    });

    it('should handle different embedding formats in client-side search', async () => {
      const mockEmbedding = new Array(768).fill(0.1);
      const mockCompany = {
        id: '1',
        name: 'Company A',
        slug: 'company-a',
        radical_primary_category: 'AI',
      };

      // Test JSON string format
      const mockEmbeddings = [
        {
          company_id: '1',
          embedding: JSON.stringify(mockEmbedding),
        },
      ];
      const mockAnswer = 'This is a test answer';

      vi.mocked(geminiLib.generateEmbedding).mockResolvedValue(mockEmbedding);

      const embeddingCountQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          count: 5,
          error: null,
        }),
      };

      vi.mocked(supabaseClient.supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'RPC function not found' },
      } as any);

      const embeddingsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockEmbeddings,
          error: null,
        }),
      };

      const companiesQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [mockCompany],
          error: null,
        }),
      };

      vi.mocked(supabaseClient.supabase.from)
        .mockReturnValueOnce(embeddingCountQuery as any)
        .mockReturnValueOnce(embeddingsQuery as any)
        .mockReturnValueOnce(companiesQuery as any);

      vi.mocked(geminiLib.generateChatCompletion).mockResolvedValue(mockAnswer);

      const response = await request(app).post('/api/chat').send({ message: 'test message' });

      expect(response.status).toBe(200);
    });

    it('should handle keyword fallback when vector search returns no results', async () => {
      const mockEmbedding = new Array(768).fill(0.1);
      const mockCompany = {
        id: '1',
        name: 'Company A',
        slug: 'company-a',
        radical_primary_category: 'AI',
      };
      const mockAnswer = 'This is a test answer';

      vi.mocked(geminiLib.generateEmbedding).mockResolvedValue(mockEmbedding);

      const embeddingCountQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          count: 5,
          error: null,
        }),
      };

      // RPC returns empty array
      vi.mocked(supabaseClient.supabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      // Mock keyword search fallback
      const keywordSearchQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [mockCompany],
          error: null,
        }),
      };

      vi.mocked(supabaseClient.supabase.from)
        .mockReturnValueOnce(embeddingCountQuery as any)
        .mockReturnValueOnce(keywordSearchQuery as any);

      vi.mocked(geminiLib.generateChatCompletion).mockResolvedValue(mockAnswer);

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'test message', topK: 5 });

      expect(response.status).toBe(200);
      expect(response.body.answer).toBe(mockAnswer);
    });

    it('should handle final fallback to all companies', async () => {
      const mockEmbedding = new Array(768).fill(0.1);
      const mockCompany = {
        id: '1',
        name: 'Company A',
        slug: 'company-a',
        radical_primary_category: 'AI',
      };
      const mockAnswer = 'This is a test answer';

      vi.mocked(geminiLib.generateEmbedding).mockResolvedValue(mockEmbedding);

      const embeddingCountQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          count: 5,
          error: null,
        }),
      };

      // RPC returns empty
      vi.mocked(supabaseClient.supabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      // Keyword search also returns empty
      const keywordSearchQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      // Final fallback to all companies
      const allCompaniesQuery = {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [mockCompany],
          error: null,
        }),
      };

      vi.mocked(supabaseClient.supabase.from)
        .mockReturnValueOnce(embeddingCountQuery as any)
        .mockReturnValueOnce(keywordSearchQuery as any)
        .mockReturnValueOnce(allCompaniesQuery as any);

      vi.mocked(geminiLib.generateChatCompletion).mockResolvedValue(mockAnswer);

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'test message', topK: 5 });

      expect(response.status).toBe(200);
      expect(response.body.answer).toBe(mockAnswer);
    });

    it('should detect and regenerate on hallucination', async () => {
      const mockEmbedding = new Array(768).fill(0.1);
      const mockCompanies = [
        {
          company: {
            id: '1',
            name: 'Company A',
            slug: 'company-a',
            radical_primary_category: 'AI',
          },
          distance: 0.2,
        },
      ];

      // First answer contains hallucination
      const hallucinatedAnswer =
        'Companies like NVIDIA and Google are working on AI infrastructure.';
      // Second answer is clean
      const cleanAnswer = 'Company A is working on AI infrastructure.';

      vi.mocked(geminiLib.generateEmbedding).mockResolvedValue(mockEmbedding);

      const embeddingCountQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          count: 10,
          error: null,
        }),
      };

      vi.mocked(supabaseClient.supabase.from).mockReturnValueOnce(embeddingCountQuery as any);
      vi.mocked(supabaseClient.supabase.rpc).mockResolvedValue({
        data: mockCompanies,
        error: null,
      } as any);

      // Mock generateChatCompletion to return hallucinated answer first, then clean answer
      vi.mocked(geminiLib.generateChatCompletion)
        .mockResolvedValueOnce(hallucinatedAnswer)
        .mockResolvedValueOnce(cleanAnswer);

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'test message', topK: 5 });

      expect(response.status).toBe(200);
      expect(response.body.answer).toBe(cleanAnswer);
      expect(geminiLib.generateChatCompletion).toHaveBeenCalledTimes(2); // Called twice due to regeneration
    });
  });
});
