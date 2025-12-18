/**
 * API Client for Radical Portfolio Backend
 * Handles all communication with the backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Log API base URL in development to help with debugging
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
}

// Warn if using localhost in production
if (import.meta.env.PROD && API_BASE_URL.includes('localhost')) {
  console.warn(
    'Warning: Using localhost API URL in production. Set VITE_API_BASE_URL environment variable.'
  );
}

export interface ApiCompany {
  id: string;
  name: string;
  slug: string;
  radical_portfolio_url: string;
  radical_investment_year: number | null;
  radical_all_categories: string[];
  radical_primary_category: string | null;
  tagline: string | null;
  all_sectors: string[];
  primary_sector: string | null;
  description: string | null;
  founder_names: string[];
  company_website_url: string | null;
  last_scraped_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompaniesResponse {
  companies: ApiCompany[];
  total: number;
}

export interface InsightsResponse {
  byCategory: Array<{ category: string; count: number }>;
  byYear: Array<{ year: number; count: number }>;
}

export interface ChatResponse {
  answer: string;
  sources: Array<{
    name: string;
    slug: string;
    radical_primary_category: string | null;
  }>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  selectedCompanySlug?: string | null;
  topK?: number;
  conversationHistory?: ChatMessage[];
}

/**
 * Fetch companies with optional filters
 */
export async function fetchCompanies(params?: {
  q?: string;
  category?: string;
  year?: string;
  limit?: number;
  offset?: number;
}): Promise<CompaniesResponse> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set('q', params.q);
  if (params?.category) searchParams.set('category', params.category);
  if (params?.year) searchParams.set('year', params.year);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());

  const url = `${API_BASE_URL}/api/companies${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch companies: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch a single company by slug
 */
export async function fetchCompanyBySlug(slug: string): Promise<ApiCompany> {
  const response = await fetch(`${API_BASE_URL}/api/companies/${slug}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Company not found');
    }
    throw new Error(`Failed to fetch company: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch portfolio insights/summary
 */
export async function fetchInsights(): Promise<InsightsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/insights/summary`);

  if (!response.ok) {
    throw new Error(`Failed to fetch insights: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Send a chat message to the copilot
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to send chat message: ${response.statusText}`);
  }

  return response.json();
}
