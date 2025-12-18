import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchCompanies, fetchCompanyBySlug, fetchInsights, sendChatMessage } from './api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    vi.stubEnv('VITE_API_BASE_URL', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('fetchCompanies', () => {
    it('should fetch companies without parameters', async () => {
      const mockResponse = {
        companies: [{ id: '1', name: 'Company A' }],
        total: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchCompanies();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/companies');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch companies with search query', async () => {
      const mockResponse = {
        companies: [{ id: '1', name: 'Company A' }],
        total: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchCompanies({ q: 'test' });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/companies?q=test');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch companies with all parameters', async () => {
      const mockResponse = {
        companies: [{ id: '1', name: 'Company A' }],
        total: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchCompanies({
        q: 'test',
        category: 'AI',
        year: '2023',
        limit: 10,
        offset: 5, // Use non-zero offset since 0 is falsy
      });

      // Check that fetch was called with the correct base URL and that all parameters are present
      const fetchCall = mockFetch.mock.calls[0][0] as string;
      expect(fetchCall).toContain('http://localhost:3001/api/companies');
      expect(fetchCall).toContain('q=test');
      expect(fetchCall).toContain('category=AI');
      expect(fetchCall).toContain('year=2023');
      expect(fetchCall).toContain('limit=10');
      expect(fetchCall).toContain('offset=5');
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(fetchCompanies()).rejects.toThrow(
        'Failed to fetch companies: Internal Server Error'
      );
    });
  });

  describe('fetchCompanyBySlug', () => {
    it('should fetch company by slug', async () => {
      const mockCompany = {
        id: '1',
        name: 'Company A',
        slug: 'company-a',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCompany,
      });

      const result = await fetchCompanyBySlug('company-a');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/companies/company-a');
      expect(result).toEqual(mockCompany);
    });

    it('should throw "Company not found" error for 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(fetchCompanyBySlug('non-existent')).rejects.toThrow('Company not found');
    });

    it('should throw error for other failures', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(fetchCompanyBySlug('company-a')).rejects.toThrow(
        'Failed to fetch company: Internal Server Error'
      );
    });
  });

  describe('fetchInsights', () => {
    it('should fetch insights successfully', async () => {
      const mockInsights = {
        byCategory: [{ category: 'AI', count: 5 }],
        byYear: [{ year: 2023, count: 3 }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInsights,
      });

      const result = await fetchInsights();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/insights/summary');
      expect(result).toEqual(mockInsights);
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(fetchInsights()).rejects.toThrow(
        'Failed to fetch insights: Internal Server Error'
      );
    });
  });

  describe('sendChatMessage', () => {
    it('should send chat message successfully', async () => {
      const mockRequest = {
        message: 'test message',
        topK: 5,
      };

      const mockResponse = {
        answer: 'This is a test answer',
        sources: [{ name: 'Company A', slug: 'company-a', radical_primary_category: 'AI' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await sendChatMessage(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockRequest),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should send chat message with selected company', async () => {
      const mockRequest = {
        message: 'test message',
        selectedCompanySlug: 'company-a',
        topK: 5,
      };

      const mockResponse = {
        answer: 'This is a test answer',
        sources: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await sendChatMessage(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockRequest),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when fetch fails', async () => {
      const mockRequest = {
        message: 'test message',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(sendChatMessage(mockRequest)).rejects.toThrow(
        'Failed to send chat message: Internal Server Error'
      );
    });
  });
});
