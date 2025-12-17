-- ============================================
-- Add Full-Text Search Index for Hybrid Search
-- ============================================
-- This migration adds full-text search capabilities to complement
-- vector similarity search, enabling hybrid search for better AI applications
--
-- Full-text search is useful for:
-- - Keyword-based queries
-- - Hybrid search (combining vector + keyword)
-- - Fallback when embeddings aren't available
-- - Exact phrase matching

-- Create a column for full-text search on description
-- This creates a tsvector (text search vector) for fast full-text queries
-- We use a trigger to update it since generated columns with to_tsvector('english', ...) are not immutable
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS description_tsvector tsvector;

-- Create function to update the tsvector column
CREATE OR REPLACE FUNCTION update_companies_tsvector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.description_tsvector := to_tsvector('english',
    COALESCE(NEW.name, '') || ' ' || 
    COALESCE(NEW.tagline, '') || ' ' || 
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(array_to_string(NEW.radical_all_categories, ' '), '') || ' ' ||
    COALESCE(array_to_string(NEW.all_sectors, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update tsvector on insert/update
DROP TRIGGER IF EXISTS companies_tsvector_update ON companies;
CREATE TRIGGER companies_tsvector_update
  BEFORE INSERT OR UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_tsvector();

-- Update existing rows to populate the tsvector column
UPDATE companies SET description_tsvector = to_tsvector('english',
  COALESCE(name, '') || ' ' || 
  COALESCE(tagline, '') || ' ' || 
  COALESCE(description, '') || ' ' ||
  COALESCE(array_to_string(radical_all_categories, ' '), '') || ' ' ||
  COALESCE(array_to_string(all_sectors, ' '), '')
);

-- Create GIN index on the tsvector column for fast full-text search
CREATE INDEX IF NOT EXISTS idx_companies_description_fts 
ON companies 
USING GIN(description_tsvector);

-- Create index on tagline for quick lookups (often used in searches)
CREATE INDEX IF NOT EXISTS idx_companies_tagline 
ON companies(tagline) 
WHERE tagline IS NOT NULL;

-- Create composite index for common filter combinations
-- This optimizes queries that filter by category AND year
CREATE INDEX IF NOT EXISTS idx_companies_category_year 
ON companies(radical_primary_category, radical_investment_year)
WHERE radical_primary_category IS NOT NULL AND radical_investment_year IS NOT NULL;

-- Create index on founder_names array for founder-based queries
CREATE INDEX IF NOT EXISTS idx_companies_founder_names 
ON companies 
USING GIN(founder_names)
WHERE array_length(founder_names, 1) > 0;

-- ============================================
-- Helper Function: Full-Text Search
-- ============================================
-- This function enables keyword-based search that can be combined
-- with vector similarity search for hybrid search capabilities

CREATE OR REPLACE FUNCTION search_companies_by_text(
  search_query text,
  category_filter text[] DEFAULT NULL,
  year_filter integer DEFAULT NULL,
  limit_count integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  radical_portfolio_url text,
  radical_investment_year integer,
  radical_all_categories text[],
  radical_primary_category text,
  tagline text,
  all_sectors text[],
  primary_sector text,
  description text,
  founder_names text[],
  company_website_url text,
  last_scraped_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  rank real
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.slug,
    c.radical_portfolio_url,
    c.radical_investment_year,
    c.radical_all_categories,
    c.radical_primary_category,
    c.tagline,
    c.all_sectors,
    c.primary_sector,
    c.description,
    c.founder_names,
    c.company_website_url,
    c.last_scraped_at,
    c.created_at,
    c.updated_at,
    ts_rank(c.description_tsvector, plainto_tsquery('english', search_query))::real AS rank
  FROM companies c
  WHERE 
    c.description_tsvector @@ plainto_tsquery('english', search_query)
    AND (category_filter IS NULL OR c.radical_primary_category = ANY(category_filter) OR c.radical_all_categories && category_filter)
    AND (year_filter IS NULL OR c.radical_investment_year = year_filter)
  ORDER BY rank DESC, c.name
  LIMIT limit_count;
END;
$$;

-- ============================================
-- Hybrid Search Function
-- ============================================
-- Combines vector similarity search with full-text search
-- for the best of both worlds in AI applications

CREATE OR REPLACE FUNCTION hybrid_search_companies(
  query_embedding extensions.vector(768),
  search_text text DEFAULT NULL,
  category_filter text[] DEFAULT NULL,
  year_filter integer DEFAULT NULL,
  vector_weight float DEFAULT 0.7,
  text_weight float DEFAULT 0.3,
  match_threshold float DEFAULT 0.6,
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  radical_portfolio_url text,
  radical_investment_year integer,
  radical_all_categories text[],
  radical_primary_category text,
  tagline text,
  all_sectors text[],
  primary_sector text,
  description text,
  founder_names text[],
  company_website_url text,
  last_scraped_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  combined_score float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  WITH vector_results AS (
    SELECT
      c.id,
      c.name,
      c.slug,
      c.radical_portfolio_url,
      c.radical_investment_year,
      c.radical_all_categories,
      c.radical_primary_category,
      c.tagline,
      c.all_sectors,
      c.primary_sector,
      c.description,
      c.founder_names,
      c.company_website_url,
      c.last_scraped_at,
      c.created_at,
      c.updated_at,
      (1 - (ce.embedding <=> query_embedding))::float AS vector_score
    FROM company_embeddings ce
    JOIN companies c ON c.id = ce.company_id
    WHERE 
      ce.source = 'description'
      AND (1 - (ce.embedding <=> query_embedding)) > match_threshold
      AND (category_filter IS NULL OR c.radical_primary_category = ANY(category_filter) OR c.radical_all_categories && category_filter)
      AND (year_filter IS NULL OR c.radical_investment_year = year_filter)
  ),
  text_results AS (
    SELECT
      c.id,
      c.name,
      c.slug,
      c.radical_portfolio_url,
      c.radical_investment_year,
      c.radical_all_categories,
      c.radical_primary_category,
      c.tagline,
      c.all_sectors,
      c.primary_sector,
      c.description,
      c.founder_names,
      c.company_website_url,
      c.last_scraped_at,
      c.created_at,
      c.updated_at,
      ts_rank(c.description_tsvector, plainto_tsquery('english', COALESCE(search_text, '')))::float AS text_score
    FROM companies c
    WHERE 
      (search_text IS NULL OR c.description_tsvector @@ plainto_tsquery('english', search_text))
      AND (category_filter IS NULL OR c.radical_primary_category = ANY(category_filter) OR c.radical_all_categories && category_filter)
      AND (year_filter IS NULL OR c.radical_investment_year = year_filter)
  )
  SELECT
    COALESCE(v.id, t.id) AS id,
    COALESCE(v.name, t.name) AS name,
    COALESCE(v.slug, t.slug) AS slug,
    COALESCE(v.radical_portfolio_url, t.radical_portfolio_url) AS radical_portfolio_url,
    COALESCE(v.radical_investment_year, t.radical_investment_year) AS radical_investment_year,
    COALESCE(v.radical_all_categories, t.radical_all_categories) AS radical_all_categories,
    COALESCE(v.radical_primary_category, t.radical_primary_category) AS radical_primary_category,
    COALESCE(v.tagline, t.tagline) AS tagline,
    COALESCE(v.all_sectors, t.all_sectors) AS all_sectors,
    COALESCE(v.primary_sector, t.primary_sector) AS primary_sector,
    COALESCE(v.description, t.description) AS description,
    COALESCE(v.founder_names, t.founder_names) AS founder_names,
    COALESCE(v.company_website_url, t.company_website_url) AS company_website_url,
    COALESCE(v.last_scraped_at, t.last_scraped_at) AS last_scraped_at,
    COALESCE(v.created_at, t.created_at) AS created_at,
    COALESCE(v.updated_at, t.updated_at) AS updated_at,
    (COALESCE(v.vector_score, 0) * vector_weight + COALESCE(t.text_score, 0) * text_weight)::float AS combined_score
  FROM vector_results v
  FULL OUTER JOIN text_results t ON v.id = t.id
  WHERE COALESCE(v.vector_score, 0) * vector_weight + COALESCE(t.text_score, 0) * text_weight > match_threshold
  ORDER BY combined_score DESC
  LIMIT limit_count;
END;
$$;

-- ============================================
-- Grant Permissions
-- ============================================
GRANT EXECUTE ON FUNCTION search_companies_by_text TO authenticated, anon;
GRANT EXECUTE ON FUNCTION hybrid_search_companies TO authenticated, anon;

-- ============================================
-- Notes
-- ============================================
-- 1. The description_tsvector column is automatically updated when
--    name, tagline, description, or categories change
--
-- 2. Use search_companies_by_text() for keyword-only searches
--
-- 3. Use hybrid_search_companies() to combine vector similarity
--    with full-text search for best results
--
-- 4. Adjust vector_weight and text_weight based on your use case:
--    - Higher vector_weight (0.8-0.9) for semantic similarity
--    - Higher text_weight (0.6-0.7) for exact keyword matching
--    - Balanced (0.5-0.5) for general purpose search

