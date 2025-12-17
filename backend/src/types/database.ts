// Database types matching Supabase schema

export interface Company {
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

export interface CompanyEmbedding {
  id: number;
  company_id: string;
  embedding: number[]; // Vector as array
  source: string;
  created_at: string;
}

// Input types for JSON import
export interface CompanyInput {
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
  last_scraped_at: string;
  source_raw_html_snippet?: string | null;
}

export interface PortfolioData {
  companies: CompanyInput[];
}
