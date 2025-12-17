-- ============================================
-- Update for Gemini Embeddings (768 dimensions)
-- ============================================
-- Gemini uses 768-dimensional embeddings instead of OpenAI's 1536.
-- This migration updates the schema to support Gemini embeddings.
-- 
-- WARNING: This will drop all existing embeddings.
-- You MUST re-run the import script after this migration.

-- Step 1: Drop the company_embeddings table
DROP TABLE IF EXISTS company_embeddings CASCADE;

-- Step 2: Recreate company_embeddings table with 768-dimensional vectors
CREATE TABLE company_embeddings (
  id bigserial PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  embedding extensions.vector(768) NOT NULL,
  source text NOT NULL DEFAULT 'description',
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, source)
);

-- Step 3: Recreate indexes for 768-dimensional vectors
CREATE INDEX company_embeddings_embedding_idx
  ON company_embeddings
  USING ivfflat (embedding extensions.vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX idx_company_embeddings_company_id ON company_embeddings(company_id);

-- Step 4: Re-enable RLS
ALTER TABLE company_embeddings ENABLE ROW LEVEL SECURITY;

-- Step 5: Recreate RLS policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Service role can manage embeddings" ON company_embeddings;
  DROP POLICY IF EXISTS "Authenticated users can read embeddings" ON company_embeddings;
  
  CREATE POLICY "Service role can manage embeddings"
    ON company_embeddings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

  CREATE POLICY "Authenticated users can read embeddings"
    ON company_embeddings
    FOR SELECT
    TO authenticated
    USING (true);
END $$;

-- Step 6: Update search function for 768 dimensions
CREATE OR REPLACE FUNCTION search_similar_companies(
  query_embedding extensions.vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
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
  distance float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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
    1 - (ce.embedding <=> query_embedding) AS distance
  FROM company_embeddings ce
  JOIN companies c ON c.id = ce.company_id
  WHERE ce.source = 'description'
    AND 1 - (ce.embedding <=> query_embedding) > match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Step 7: Update insert function for 768 dimensions
CREATE OR REPLACE FUNCTION insert_company_embedding(
  p_company_id uuid,
  p_embedding extensions.vector(768),
  p_source text DEFAULT 'description'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  DELETE FROM company_embeddings
  WHERE company_id = p_company_id AND source = p_source;

  INSERT INTO company_embeddings (company_id, embedding, source)
  VALUES (p_company_id, p_embedding, p_source);
END;
$$;

-- ============================================
-- IMPORTANT: After running this migration
-- ============================================
-- 1. Re-run the import script to restore embeddings with Gemini:
--    npm run import
--
-- 2. Verify embeddings are restored:
--    SELECT COUNT(*) FROM company_embeddings;

