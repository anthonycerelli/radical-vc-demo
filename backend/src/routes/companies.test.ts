import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import companiesRouter from './companies.js';
import * as supabaseClient from '../lib/supabaseClient.js';

// Mock supabase client
vi.mock('../lib/supabaseClient.js', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Companies route', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/companies', companiesRouter);
    vi.clearAllMocks();
  });

  describe('GET /api/companies', () => {
    it('should return companies list with default pagination', async () => {
      const mockCompanies = [
        { id: '1', name: 'Company A', slug: 'company-a' },
        { id: '2', name: 'Company B', slug: 'company-b' },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockCompanies,
          error: null,
          count: 2,
        }),
      };

      vi.mocked(supabaseClient.supabase.from).mockReturnValue(mockQuery as any);

      const response = await request(app).get('/api/companies');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        companies: mockCompanies,
        total: 2,
      });
    });

    it('should filter by search query', async () => {
      const mockCompanies = [{ id: '1', name: 'Test Company', slug: 'test-company' }];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockCompanies,
          error: null,
          count: 1,
        }),
      };

      vi.mocked(supabaseClient.supabase.from).mockReturnValue(mockQuery as any);

      const response = await request(app).get('/api/companies?q=test');

      expect(response.status).toBe(200);
      expect(mockQuery.or).toHaveBeenCalled();
    });

    it('should filter by category', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      vi.mocked(supabaseClient.supabase.from).mockReturnValue(mockQuery as any);

      const response = await request(app).get('/api/companies?category=AI');

      expect(response.status).toBe(200);
      expect(mockQuery.or).toHaveBeenCalled();
    });

    it('should filter by year', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      vi.mocked(supabaseClient.supabase.from).mockReturnValue(mockQuery as any);

      const response = await request(app).get('/api/companies?year=2023');

      expect(response.status).toBe(200);
      expect(mockQuery.eq).toHaveBeenCalledWith('radical_investment_year', 2023);
    });

    it('should handle pagination with limit and offset', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      vi.mocked(supabaseClient.supabase.from).mockReturnValue(mockQuery as any);

      const response = await request(app).get('/api/companies?limit=10&offset=5');

      expect(response.status).toBe(200);
      expect(mockQuery.range).toHaveBeenCalledWith(5, 14);
    });

    it('should cap limit at 100', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      vi.mocked(supabaseClient.supabase.from).mockReturnValue(mockQuery as any);

      const response = await request(app).get('/api/companies?limit=200');

      expect(response.status).toBe(200);
      expect(mockQuery.range).toHaveBeenCalledWith(0, 99); // Capped at 100
    });

    it('should handle invalid limit and offset', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      vi.mocked(supabaseClient.supabase.from).mockReturnValue(mockQuery as any);

      const response = await request(app).get('/api/companies?limit=abc&offset=xyz');

      expect(response.status).toBe(200);
      expect(mockQuery.range).toHaveBeenCalledWith(0, 19); // Default values
    });

    it('should handle errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
          count: null,
        }),
      };

      vi.mocked(supabaseClient.supabase.from).mockReturnValue(mockQuery as any);

      const response = await request(app).get('/api/companies');

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });

    it('should handle errors thrown during query execution', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockRejectedValue(new Error('Query failed')),
      };

      vi.mocked(supabaseClient.supabase.from).mockReturnValue(mockQuery as any);

      const response = await request(app).get('/api/companies');

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/companies/:slug', () => {
    it('should return a company by slug', async () => {
      const mockCompany = { id: '1', name: 'Test Company', slug: 'test-company' };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCompany,
          error: null,
        }),
      };

      vi.mocked(supabaseClient.supabase.from).mockReturnValue(mockQuery as any);

      const response = await request(app).get('/api/companies/test-company');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCompany);
    });

    it('should return 404 for non-existent company', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };

      vi.mocked(supabaseClient.supabase.from).mockReturnValue(mockQuery as any);

      const response = await request(app).get('/api/companies/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe('Company not found');
    });

    it('should handle errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      vi.mocked(supabaseClient.supabase.from).mockReturnValue(mockQuery as any);

      const response = await request(app).get('/api/companies/test-company');

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });
});
