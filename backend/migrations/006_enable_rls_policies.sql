-- Enable Row Level Security on companies table
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on company_embeddings table
ALTER TABLE company_embeddings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Companies Table Policies
-- ============================================

-- Policy: Allow service role full access (for backend API)
-- This allows the backend service role to read and write all companies
CREATE POLICY "Service role can manage companies"
  ON companies
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users read-only access
-- This allows authenticated users (if using Supabase Auth) to read companies
CREATE POLICY "Authenticated users can read companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow anon users read-only access (if needed for public API)
-- Uncomment if you want to allow unauthenticated read access
-- CREATE POLICY "Anon users can read companies"
--   ON companies
--   FOR SELECT
--   TO anon
--   USING (true);

-- ============================================
-- Company Embeddings Table Policies
-- ============================================

-- Policy: Allow service role full access (for backend API)
-- This allows the backend service role to read and write all embeddings
CREATE POLICY "Service role can manage embeddings"
  ON company_embeddings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users read-only access to embeddings
-- This allows authenticated users to read embeddings for semantic search
CREATE POLICY "Authenticated users can read embeddings"
  ON company_embeddings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow anon users read-only access to embeddings (if needed)
-- Uncomment if you want to allow unauthenticated read access for search
-- CREATE POLICY "Anon users can read embeddings"
--   ON company_embeddings
--   FOR SELECT
--   TO anon
--   USING (true);

-- ============================================
-- Notes:
-- ============================================
-- 1. Service role has full access - this is what your backend uses
-- 2. Authenticated users have read-only access - useful if frontend connects directly
-- 3. Anon policies are commented out - uncomment if you need public read access
-- 4. All write operations (INSERT, UPDATE, DELETE) are restricted to service_role only
-- 5. If you need more restrictive policies, you can add additional conditions to the USING clauses

