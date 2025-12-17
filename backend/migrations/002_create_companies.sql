-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  radical_portfolio_url text NOT NULL,
  radical_investment_year integer,
  radical_all_categories text[] NOT NULL DEFAULT '{}',
  radical_primary_category text,
  tagline text,
  all_sectors text[] DEFAULT '{}',
  primary_sector text,
  description text,
  founder_names text[] DEFAULT '{}',
  company_website_url text,
  last_scraped_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);

-- Create index on investment year for filtering
CREATE INDEX IF NOT EXISTS idx_companies_investment_year ON companies(radical_investment_year);

-- Create index on primary category for filtering
CREATE INDEX IF NOT EXISTS idx_companies_primary_category ON companies(radical_primary_category);

-- Create GIN index on categories array for array operations
CREATE INDEX IF NOT EXISTS idx_companies_all_categories ON companies USING GIN(radical_all_categories);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

