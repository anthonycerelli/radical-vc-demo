-- Create company_embeddings table
CREATE TABLE IF NOT EXISTS company_embeddings (
  id bigserial PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,
  source text NOT NULL DEFAULT 'description',
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, source)
);

-- Create pgvector index for similarity search using IVFFlat
-- Note: IVFFlat requires at least some data to be effective
-- You may want to create this index after importing data, or use HNSW for better performance
CREATE INDEX IF NOT EXISTS company_embeddings_embedding_idx
  ON company_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Alternative: HNSW index (better for production, but requires pgvector 0.5.0+)
-- Uncomment if your Supabase instance supports it:
-- CREATE INDEX IF NOT EXISTS company_embeddings_embedding_hnsw_idx
--   ON company_embeddings
--   USING hnsw (embedding vector_cosine_ops);

-- Create index on company_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_company_embeddings_company_id ON company_embeddings(company_id);

