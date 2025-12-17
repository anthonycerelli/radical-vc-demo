import { readFileSync } from 'fs';
import { join } from 'path';
import { supabase } from '../src/lib/supabaseClient.js';
import { generateEmbedding } from '../src/lib/gemini.js';
const DATA_FILE = join(process.cwd(), 'data', 'radical_portfolio_companies.json');
/**
 * Build embedding input string from company data
 */
function buildEmbeddingInput(company) {
    const parts = [];
    if (company.name)
        parts.push(company.name);
    if (company.tagline)
        parts.push(company.tagline);
    if (company.description)
        parts.push(company.description);
    if (company.radical_primary_category)
        parts.push(company.radical_primary_category);
    if (company.all_sectors && company.all_sectors.length > 0) {
        parts.push(company.all_sectors.join(', '));
    }
    return parts.join('\n').trim();
}
/**
 * Upsert a company into the database
 */
async function upsertCompany(companyInput) {
    const { data, error } = await supabase
        .from('companies')
        .upsert({
        name: companyInput.name,
        slug: companyInput.slug,
        radical_portfolio_url: companyInput.radical_portfolio_url,
        radical_investment_year: companyInput.radical_investment_year,
        radical_all_categories: companyInput.radical_all_categories || [],
        radical_primary_category: companyInput.radical_primary_category,
        tagline: companyInput.tagline,
        all_sectors: companyInput.all_sectors || [],
        primary_sector: companyInput.primary_sector,
        description: companyInput.description,
        founder_names: companyInput.founder_names || [],
        company_website_url: companyInput.company_website_url,
        last_scraped_at: companyInput.last_scraped_at
            ? new Date(companyInput.last_scraped_at).toISOString()
            : null,
    }, {
        onConflict: 'slug',
        ignoreDuplicates: false,
    })
        .select('id')
        .single();
    if (error) {
        throw new Error(`Failed to upsert company ${companyInput.slug}: ${error.message}`);
    }
    if (!data) {
        throw new Error(`Failed to get company ID after upsert for ${companyInput.slug}`);
    }
    return data.id;
}
/**
 * Upsert embedding for a company
 */
async function upsertEmbedding(companyId, embedding, source = 'description') {
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
 * Main import function
 */
async function importCompanies() {
    console.log('Reading portfolio data...');
    const fileContent = readFileSync(DATA_FILE, 'utf-8');
    const portfolioData = JSON.parse(fileContent);
    console.log(`Found ${portfolioData.companies.length} companies to import`);
    let successCount = 0;
    let errorCount = 0;
    for (let i = 0; i < portfolioData.companies.length; i++) {
        const company = portfolioData.companies[i];
        console.log(`\n[${i + 1}/${portfolioData.companies.length}] Processing: ${company.name}`);
        try {
            // Upsert company
            console.log('  → Upserting company...');
            const companyId = await upsertCompany(company);
            // Generate embedding
            console.log('  → Generating embedding...');
            const embeddingInput = buildEmbeddingInput(company);
            if (!embeddingInput.trim()) {
                console.warn(`  ⚠️  Skipping embedding for ${company.slug} (no content to embed)`);
                successCount++;
                continue;
            }
            const embedding = await generateEmbedding(embeddingInput);
            // Upsert embedding
            console.log('  → Storing embedding...');
            await upsertEmbedding(companyId, embedding, 'description');
            successCount++;
            console.log(`  ✓ Successfully imported ${company.name}`);
        }
        catch (error) {
            errorCount++;
            console.error(`  ✗ Error importing ${company.name}:`, error);
        }
    }
    console.log('\n=== Import Summary ===');
    console.log(`Total companies: ${portfolioData.companies.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
}
// Run import
importCompanies().catch((error) => {
    console.error('Fatal error during import:', error);
    process.exit(1);
});
//# sourceMappingURL=import_companies.js.map