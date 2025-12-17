-- ============================================
-- Move Vector Extension from Public to Extensions Schema
-- ============================================
-- WARNING: This migration is DESTRUCTIVE and will:
-- 1. Drop all vector columns (losing all embeddings)
-- 2. Move the extension to the extensions schema
-- 3. Recreate the vector columns
-- 
-- You MUST re-run the import script after this migration to restore embeddings.
-- 
-- This migration should be run during a maintenance window.

-- Step 1: Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Step 2: Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA extensions TO postgres;

-- Step 3: Drop the company_embeddings table (contains vector columns)
-- This will cascade and drop the index as well
DROP TABLE IF EXISTS company_embeddings CASCADE;

-- Step 4: Drop the vector extension from public schema
DROP EXTENSION IF EXISTS vector CASCADE;

-- Step 5: Create the vector extension in the extensions schema
CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;

-- Step 6: Grant usage on the vector type to public (so tables can use it)
GRANT USAGE ON SCHEMA extensions TO public;
-- Grant usage on the vector type specifically
GRANT USAGE ON TYPE extensions.vector TO public;

-- Step 7: Recreate the company_embeddings table with vector type from extensions schema
-- Note: We can reference vector type without schema prefix if extensions is in search_path
-- But to be explicit and avoid issues, we'll use the fully qualified name
CREATE TABLE company_embeddings (
  id bigserial PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  embedding extensions.vector(1536) NOT NULL,
  source text NOT NULL DEFAULT 'description',
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, source)
);

-- Step 8: Recreate indexes
-- The vector operators are in the extensions schema, so we reference them explicitly
CREATE INDEX company_embeddings_embedding_idx
  ON company_embeddings
  USING ivfflat (embedding extensions.vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX idx_company_embeddings_company_id ON company_embeddings(company_id);

-- Step 9: Re-enable RLS on company_embeddings (if it was enabled)
ALTER TABLE company_embeddings ENABLE ROW LEVEL SECURITY;

-- Step 10: Recreate RLS policies for company_embeddings
-- (These should already exist from migration 006, but we'll ensure they're there)
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Service role can manage embeddings" ON company_embeddings;
  DROP POLICY IF EXISTS "Authenticated users can read embeddings" ON company_embeddings;
  
  -- Recreate policies
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

-- Step 11: Update the search function to use the correct vector type
-- The function needs extensions schema in search_path to use vector operators
CREATE OR REPLACE FUNCTION search_similar_companies(
  query_embedding extensions.vector(1536),
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

-- Step 12: Update the insert function to use the correct vector type
-- The function needs extensions schema in search_path
CREATE OR REPLACE FUNCTION insert_company_embedding(
  p_company_id uuid,
  p_embedding extensions.vector(1536),
  p_source text DEFAULT 'description'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Delete existing embedding for this company and source
  DELETE FROM company_embeddings
  WHERE company_id = p_company_id AND source = p_source;

  -- Insert new embedding
  INSERT INTO company_embeddings (company_id, embedding, source)
  VALUES (p_company_id, p_embedding, p_source);
END;
$$;

-- ============================================
-- IMPORTANT: After running this migration
-- ============================================
-- 1. Re-run the import script to restore embeddings:
--    npm run import
--
-- 2. Verify the extension is in the extensions schema:
--    SELECT * FROM pg_extension WHERE extname = 'vector';
--
-- 3. Verify embeddings table exists and is empty:
--    SELECT COUNT(*) FROM company_embeddings;
--
-- 4. After re-importing, verify embeddings are restored:
--    SELECT COUNT(*) FROM company_embeddings;

