-- Create RPC function for semantic search
-- This function performs vector similarity search using pgvector

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

