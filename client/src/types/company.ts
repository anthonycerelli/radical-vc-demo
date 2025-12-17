// Frontend Company type that extends the API type with computed/display fields
export interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categories: string[]; // Maps to radical_all_categories
  year: string | number | null; // Maps to radical_investment_year
  tagline: string | null;
  primaryCategory: string | null; // Maps to radical_primary_category
  sectors: string[]; // Maps to all_sectors
  primarySector: string | null;
  founderNames: string[];
  website: string | null; // Maps to company_website_url
  portfolioUrl: string; // Maps to radical_portfolio_url
  // Optional display fields (not from API, for UI compatibility)
  stage?: string;
  teamSize?: number;
  location?: string;
}
