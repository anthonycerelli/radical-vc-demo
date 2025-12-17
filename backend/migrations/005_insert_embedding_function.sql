-- Helper function to insert embeddings (optional, for cleaner import script)
-- The import script can also use direct INSERT, but this provides better type handling

CREATE OR REPLACE FUNCTION insert_company_embedding(
  p_company_id uuid,
  p_embedding vector(1536),
  p_source text DEFAULT 'description'
)
RETURNS void
LANGUAGE plpgsql
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

