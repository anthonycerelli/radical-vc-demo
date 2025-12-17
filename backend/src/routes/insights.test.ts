import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import insightsRouter from './insights.js';
import * as supabaseClient from '../lib/supabaseClient.js';

// Mock supabase client
vi.mock('../lib/supabaseClient.js', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Insights route', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/insights', insightsRouter);
    vi.clearAllMocks();
  });

  describe('GET /api/insights/summary', () => {
    it('should return portfolio analytics grouped by category and year', async () => {
      const mockCompanies = [
        {
          radical_primary_category: 'AI',
          radical_all_categories: ['AI', 'ML'],
          radical_investment_year: 2023,
        },
        {
          radical_primary_category: 'AI',
          radical_all_categories: ['AI'],
          radical_investment_year: 2023,
        },
        {
          radical_primary_category: 'Climate',
          radical_all_categories: ['Climate'],
          radical_investment_year: 2024,
        },
      ];

      const mockQuery = {
        select: vi.fn().mockResolvedValue({
          data: mockCompanies,
          error: null,
        }),
      };

      vi.mocked(supabaseClient.supabase.from).mockReturnValue(mockQuery as any);

      const response = await request(app).get('/api/insights/summary');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('byCategory');
      expect(response.body).toHaveProperty('byYear');
      expect(response.body.byCategory).toEqual([
        { category: 'AI', count: 2 },
        { category: 'Climate', count: 1 },
      ]);
      expect(response.body.byYear).toEqual([
        { year: 2023, count: 2 },
        { year: 2024, count: 1 },
      ]);
    });

    it('should use first category from all_categories if primary is missing', async () => {
      const mockCompanies = [
        {
          radical_primary_category: null,
          radical_all_categories: ['Healthcare'],
          radical_investment_year: 2023,
        },
      ];

      const mockQuery = {
        select: vi.fn().mockResolvedValue({
          data: mockCompanies,
          error: null,
        }),
      };

      vi.mocked(supabaseClient.supabase.from).mockReturnValue(mockQuery as any);

      const response = await request(app).get('/api/insights/summary');

      expect(response.status).toBe(200);
      expect(response.body.byCategory).toEqual([{ category: 'Healthcare', count: 1 }]);
    });

    it('should handle companies with no category', async () => {
      const mockCompanies = [
        {
          radical_primary_category: null,
          radical_all_categories: null,
          radical_investment_year: 2023,
        },
      ];

      const mockQuery = {
        select: vi.fn().mockResolvedValue({
          data: mockCompanies,
          error: null,
        }),
      };

      vi.mocked(supabaseClient.supabase.from).mockReturnValue(mockQuery as any);

      const response = await request(app).get('/api/insights/summary');

      expect(response.status).toBe(200);
      expect(response.body.byCategory).toEqual([{ category: 'Uncategorized', count: 1 }]);
    });

    it('should handle companies with empty all_categories array', async () => {
      const mockCompanies = [
        {
          radical_primary_category: null,
          radical_all_categories: [],
          radical_investment_year: 2023,
        },
      ];

      const mockQuery = {
        select: vi.fn().mockResolvedValue({
          data: mockCompanies,
          error: null,
        }),
      };

      vi.mocked(supabaseClient.supabase.from).mockReturnValue(mockQuery as any);

      const response = await request(app).get('/api/insights/summary');

      expect(response.status).toBe(200);
      expect(response.body.byCategory).toEqual([{ category: 'Uncategorized', count: 1 }]);
    });

    it('should handle companies with no investment year', async () => {
      const mockCompanies = [
        {
          radical_primary_category: 'AI',
          radical_all_categories: ['AI'],
          radical_investment_year: null,
        },
      ];

      const mockQuery = {
        select: vi.fn().mockResolvedValue({
          data: mockCompanies,
          error: null,
        }),
      };

      vi.mocked(supabaseClient.supabase.from).mockReturnValue(mockQuery as any);

      const response = await request(app).get('/api/insights/summary');

      expect(response.status).toBe(200);
      expect(response.body.byCategory).toEqual([{ category: 'AI', count: 1 }]);
      expect(response.body.byYear).toEqual([]);
    });

    it('should handle empty companies list', async () => {
      const mockQuery = {
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      vi.mocked(supabaseClient.supabase.from).mockReturnValue(mockQuery as any);

      const response = await request(app).get('/api/insights/summary');

      expect(response.status).toBe(200);
      expect(response.body.byCategory).toEqual([]);
      expect(response.body.byYear).toEqual([]);
    });

    it('should handle errors', async () => {
      const mockQuery = {
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      vi.mocked(supabaseClient.supabase.from).mockReturnValue(mockQuery as any);

      const response = await request(app).get('/api/insights/summary');

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });
});

