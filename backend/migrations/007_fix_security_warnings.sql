-- ============================================
-- Fix Function Search Path Security Warnings
-- ============================================
-- Supabase requires functions to have an explicit search_path to prevent
-- security vulnerabilities. This migration updates all functions to set
-- the search_path explicitly.

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix search_similar_companies function
CREATE OR REPLACE FUNCTION search_similar_companies(
  query_embedding vector(1536),
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
    1 - (ce.embedding <=> query_embedding) AS distance
  FROM company_embeddings ce
  JOIN companies c ON c.id = ce.company_id
  WHERE ce.source = 'description'
    AND 1 - (ce.embedding <=> query_embedding) > match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Fix insert_company_embedding function
CREATE OR REPLACE FUNCTION insert_company_embedding(
  p_company_id uuid,
  p_embedding vector(1536),
  p_source text DEFAULT 'description'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
-- Fix Extension in Public Schema Warning
-- ============================================
-- Note: Moving the vector extension from public schema requires careful handling.
-- The extension warning is less critical but can be addressed by:
-- 1. Creating an extensions schema
-- 2. Moving the extension there (requires dropping and recreating, which is destructive)
--
-- For now, we'll create an extensions schema for future use.
-- Moving the vector extension should be done during initial setup or with
-- careful planning as it requires recreating all vector columns.

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema to public (for future extension moves)
GRANT USAGE ON SCHEMA extensions TO public;

-- Note: To fully resolve the extension warning, you would need to:
-- 1. Drop the vector extension from public
-- 2. Create it in the extensions schema
-- 3. This requires recreating all vector columns, which is a more complex migration
-- 
-- For production, consider doing this during initial setup or during a maintenance window.
-- The current warning is acceptable for development, but should be addressed before production.

-- ============================================
-- Alternative: If you want to move vector extension now (DESTRUCTIVE)
-- ============================================
-- WARNING: This will require recreating all vector columns and data.
-- Only run this if you're okay with losing existing embeddings and can re-import them.
--
-- Uncomment the following if you want to move the extension:
--
-- -- Drop vector extension from public (this will drop all vector columns!)
-- -- DROP EXTENSION IF EXISTS vector CASCADE;
-- 
-- -- Create extension in extensions schema
-- -- CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;
-- 
-- -- You would then need to recreate all tables with vector columns
-- -- and re-import all embeddings

