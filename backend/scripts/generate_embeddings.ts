/**
 * Generate embeddings for existing companies in the database
 * This script fetches all companies from Supabase and generates embeddings
 * for companies that don't have embeddings yet.
 */

import { supabase } from '../src/lib/supabaseClient.js';
import { generateEmbedding } from '../src/lib/gemini.js';
import { Company } from '../src/types/database.js';

/**
 * Build embedding input string from company data
 */
function buildEmbeddingInput(company: Company): string {
  const parts: string[] = [];

  if (company.name) parts.push(company.name);
  if (company.tagline) parts.push(company.tagline);
  if (company.description) parts.push(company.description);
  if (company.radical_primary_category) parts.push(company.radical_primary_category);
  if (company.all_sectors && company.all_sectors.length > 0) {
    parts.push(company.all_sectors.join(', '));
  }

  return parts.join('\n').trim();
}

/**
 * Upsert embedding for a company
 */
async function upsertEmbedding(
  companyId: string,
  embedding: number[],
  source: string = 'description'
): Promise<void> {
  // Delete existing embedding for this company and source (idempotent)
  await supabase
    .from('company_embeddings')
    .delete()
    .eq('company_id', companyId)
    .eq('source', source);

  // Insert new embedding
  // Supabase PostgREST requires the vector to be passed as a string in array format
  // The database will automatically cast it to the vector type
  const embeddingString = `[${embedding.join(',')}]`;

  const { error } = await supabase.from('company_embeddings').insert({
    company_id: companyId,
    embedding: embeddingString,
    source,
  });

  if (error) {
    throw new Error(`Failed to insert embedding for company ${companyId}: ${error.message}`);
  }
}

/**
 * Check if company already has an embedding
 */
async function hasEmbedding(companyId: string, source: string = 'description'): Promise<boolean> {
  const { data, error } = await supabase
    .from('company_embeddings')
    .select('id')
    .eq('company_id', companyId)
    .eq('source', source)
    .limit(1);

  if (error) {
    console.warn(`Error checking embedding for company ${companyId}:`, error.message);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Main function to generate embeddings for all companies
 */
async function generateEmbeddingsForCompanies() {
  console.log('Fetching companies from database...');

  // Fetch all companies
  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch companies: ${error.message}`);
  }

  if (!companies || companies.length === 0) {
    console.log('No companies found in database.');
    return;
  }

  console.log(`Found ${companies.length} companies in database\n`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i] as Company;
    console.log(`[${i + 1}/${companies.length}] Processing: ${company.name}`);

    try {
      // Check if embedding already exists
      const alreadyHasEmbedding = await hasEmbedding(company.id);
      if (alreadyHasEmbedding) {
        console.log(`  ⏭️  Skipping ${company.name} (embedding already exists)`);
        skippedCount++;
        continue;
      }

      // Build embedding input
      const embeddingInput = buildEmbeddingInput(company);

      if (!embeddingInput.trim()) {
        console.warn(`  ⚠️  Skipping ${company.name} (no content to embed)`);
        skippedCount++;
        continue;
      }

      // Generate embedding
      console.log('  → Generating embedding...');
      const embedding = await generateEmbedding(embeddingInput);

      // Store embedding
      console.log('  → Storing embedding...');
      await upsertEmbedding(company.id, embedding, 'description');

      successCount++;
      console.log(`  ✓ Successfully generated embedding for ${company.name}`);
    } catch (error) {
      errorCount++;
      console.error(`  ✗ Error processing ${company.name}:`, error);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total companies: ${companies.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
}

// Run the script
generateEmbeddingsForCompanies().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
