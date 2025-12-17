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

      vi.mocked(geminiLib.generateEmbedding).mockResolvedValue(mockEmbedding);
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
      const mockEmbeddings = [
        {
          company_id: '1',
          embedding: mockEmbedding,
        },
      ];
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
        .mockReturnValueOnce(embeddingsQuery as any)
        .mockReturnValueOnce(companiesQuery as any);

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

      const companyQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockSelectedCompany,
          error: null,
        }),
      };

      vi.mocked(supabaseClient.supabase.from).mockReturnValue(companyQuery as any);
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
      const mockEmbeddings = [
        {
          company_id: '1',
          embedding: JSON.stringify(mockEmbedding), // JSON string format
        },
      ];
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
        .mockReturnValueOnce(embeddingsQuery as any)
        .mockReturnValueOnce(companiesQuery as any);

      vi.mocked(geminiLib.generateChatCompletion).mockResolvedValue('Answer');

      const response = await request(app).post('/api/chat').send({ message: 'test message' });

      expect(response.status).toBe(200);
    });
  });
});
