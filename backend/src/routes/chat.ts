import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabaseClient.js';
import { generateEmbedding, generateChatCompletion } from '../lib/gemini.js';
import { Company } from '../types/database.js';

const router = Router();

// Request validation schema
const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  selectedCompanySlug: z.string().nullable().optional(),
  topK: z.number().int().min(1).max(10).optional().default(5),
});

/**
 * POST /api/chat
 * Handle chat messages with semantic search and LLM
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = chatRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: {
          message: 'Invalid request body',
          details: validationResult.error.errors,
        },
      });
    }

    const { message, selectedCompanySlug, topK } = validationResult.data;

    // Fetch selected company if provided
    let selectedCompany: Company | null = null;
    if (selectedCompanySlug) {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', selectedCompanySlug)
        .single();

      if (!error && data) {
        selectedCompany = data as Company;
      }
    }

    // Check if embeddings exist in database
    const { count: embeddingCount } = await supabase
      .from('company_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'description');

    console.log('Embeddings in database:', embeddingCount);

    let topCompanies: Array<{ company: Company; distance: number }> = [];

    // If no embeddings, use keyword search immediately
    if (!embeddingCount || embeddingCount === 0) {
      console.warn('No embeddings found in database. Using keyword search fallback.');
      const searchTerms = message
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2);
      if (searchTerms.length > 0) {
        const { data: keywordResults } = await supabase
          .from('companies')
          .select('*')
          .or(
            `name.ilike.%${searchTerms[0]}%,description.ilike.%${searchTerms[0]}%,radical_primary_category.ilike.%${searchTerms[0]}%`
          )
          .limit(topK * 2);

        if (keywordResults && keywordResults.length > 0) {
          topCompanies = keywordResults.slice(0, topK).map((company) => ({
            company: company as Company,
            distance: 0.9,
          }));
          console.log('Keyword search found', topCompanies.length, 'companies');
        }
      }
    } else {
      // Generate embedding for the user message
      const queryEmbedding = await generateEmbedding(message);
      console.log('Generated query embedding, length:', queryEmbedding.length);

      // Perform vector similarity search
      // Note: Supabase PostgREST doesn't directly support vector operations,
      // so we need to use a stored function or raw SQL
      // Format embedding as string array for PostgreSQL vector type
      const embeddingString = `[${queryEmbedding.join(',')}]`;

      const { data: similarCompanies, error: searchError } = await supabase.rpc(
        'search_similar_companies',
        {
          query_embedding: embeddingString,
          match_threshold: 0.5, // Lower threshold to get more results
          match_count: topK,
        }
      );

      console.log('RPC search result:', {
        hasData: !!similarCompanies,
        dataLength: similarCompanies?.length || 0,
        error: searchError?.message,
      });

      // Fallback: If RPC doesn't exist, use a simpler approach with raw SQL via Supabase
      // For now, we'll use a workaround by fetching all embeddings and doing client-side search
      // In production, you should create the RPC function in the database

      if (searchError) {
        console.warn('RPC function not found, using fallback method:', searchError);
        // Fallback: fetch embeddings and compute similarity client-side
        const { data: embeddings, error: embError } = await supabase
          .from('company_embeddings')
          .select('company_id, embedding')
          .eq('source', 'description');

        console.log('Fallback: fetched embeddings:', {
          count: embeddings?.length || 0,
          error: embError?.message,
        });

        if (!embError && embeddings && embeddings.length > 0) {
          // Calculate cosine similarity for each embedding
          const similarities = embeddings
            .map((emb) => {
              // Handle different embedding formats from Supabase
              let embVector: number[];
              if (typeof emb.embedding === 'string') {
                // Try parsing as JSON array
                try {
                  embVector = JSON.parse(emb.embedding);
                } catch {
                  // If not JSON, try parsing as PostgreSQL array format
                  embVector = emb.embedding
                    .replace(/[{}]/g, '')
                    .split(',')
                    .map((v) => parseFloat(v.trim()))
                    .filter((v) => !isNaN(v));
                }
              } else if (Array.isArray(emb.embedding)) {
                embVector = emb.embedding;
              } else {
                console.warn('Unexpected embedding format:', typeof emb.embedding);
                return null;
              }

              if (!embVector || embVector.length !== queryEmbedding.length) {
                return null;
              }

              const distance = cosineDistance(queryEmbedding, embVector);
              // Use similarity (1 - distance) for threshold, distance < 0.5 means similarity > 0.5
              if (distance < 0.5) {
                return { company_id: emb.company_id, distance };
              }
              return null;
            })
            .filter((s): s is { company_id: string; distance: number } => s !== null)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, topK);

          console.log('Fallback: computed similarities:', {
            count: similarities.length,
            topDistances: similarities.slice(0, 3).map((s) => s.distance),
          });

          // Fetch company details for top matches
          const companyIds = similarities.map((s) => s.company_id);
          const { data: companies } = await supabase
            .from('companies')
            .select('*')
            .in('id', companyIds);

          if (companies) {
            topCompanies = similarities.map((sim) => {
              const company = companies.find((c) => c.id === sim.company_id);
              return {
                company: company as Company,
                distance: sim.distance,
              };
            });
          }
        }
      } else if (
        similarCompanies &&
        Array.isArray(similarCompanies) &&
        similarCompanies.length > 0
      ) {
        // Use RPC results if available
        // The RPC function returns companies directly with a distance field
        topCompanies = similarCompanies.map((item: Company & { distance?: number }) => {
          // Extract distance and remove it from the company object
          const { distance, ...company } = item;
          return {
            company: company as Company,
            distance: distance || 0,
          };
        });
        console.log('Using RPC results, found', topCompanies.length, 'companies');
      }

      // If no companies found, try a fallback: use keyword search or fetch all companies
      if (topCompanies.length === 0) {
        console.warn('No companies found from vector search, trying keyword fallback');

        // Try keyword-based search as fallback
        const searchTerms = message
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 3);
        const keywordQuery = searchTerms.join(' | ');

        if (keywordQuery) {
          const { data: keywordResults, error: keywordError } = await supabase
            .from('companies')
            .select('*')
            .or(
              `name.ilike.%${searchTerms[0]}%,description.ilike.%${searchTerms[0]}%,radical_primary_category.ilike.%${searchTerms[0]}%`
            )
            .limit(topK);

          if (!keywordError && keywordResults && keywordResults.length > 0) {
            topCompanies = keywordResults.map((company) => ({
              company: company as Company,
              distance: 0.8, // Medium distance for keyword match
            }));
            console.log('Keyword fallback: found', topCompanies.length, 'companies');
          }
        }

        // If still no results, fetch all companies and let LLM filter
        if (topCompanies.length === 0) {
          console.warn('No keyword matches, falling back to all companies');
          const { data: allCompaniesData, error: allError } = await supabase
            .from('companies')
            .select('*')
            .limit(30); // Limit to avoid too much context

          if (!allError && allCompaniesData && allCompaniesData.length > 0) {
            topCompanies = allCompaniesData.map((company) => ({
              company: company as Company,
              distance: 1.0, // High distance since not matched
            }));
            console.log('Final fallback: using', topCompanies.length, 'companies from database');
          }
        }
      }
    }

    // Note: Portfolio names/slugs could be used for additional hallucination checks if needed

    // Build portfolio context as structured JSON
    const portfolioCompanies = topCompanies.map(({ company }) => ({
      name: company.name,
      slug: company.slug,
      radical_primary_category: company.radical_primary_category,
      radical_all_categories: company.radical_all_categories,
      tagline: company.tagline,
      description: company.description,
      radical_investment_year: company.radical_investment_year,
      all_sectors: company.all_sectors,
      primary_sector: company.primary_sector,
    }));

    console.log('Portfolio context prepared:', {
      companyCount: portfolioCompanies.length,
      companyNames: portfolioCompanies.map((c) => c.name).slice(0, 5),
    });

    // Include selected company if provided
    if (selectedCompany && !portfolioCompanies.find((c) => c.slug === selectedCompany!.slug)) {
      portfolioCompanies.unshift({
        name: selectedCompany.name,
        slug: selectedCompany.slug,
        radical_primary_category: selectedCompany.radical_primary_category,
        radical_all_categories: selectedCompany.radical_all_categories,
        tagline: selectedCompany.tagline,
        description: selectedCompany.description,
        radical_investment_year: selectedCompany.radical_investment_year,
        all_sectors: selectedCompany.all_sectors,
        primary_sector: selectedCompany.primary_sector,
      });
    }

    const portfolioContextJson = JSON.stringify(portfolioCompanies, null, 2);

    // Build strict system prompt
    const systemPrompt = `You are Radical Portfolio Copilot, an internal assistant for Radical Ventures.
You ONLY know about the companies provided to you in the "portfolio_context" section below.

Rules:
- When the user asks "which companies...?", you MUST answer ONLY with companies from the portfolio_context.
- Do NOT mention or invent companies that are not in the portfolio_context, even if you know them from elsewhere.
- If the portfolio_context does not contain any relevant companies, say so explicitly (e.g. "Based on the provided Radical Ventures portfolio, I do not see any companies focused on X.").
- When you mention a company, always include its slug and primary category for clarity.
- Keep answers concise and analytical, grounded in the descriptions and metadata you are given.

If a user asks a general AI/tech question that is not about the Radical Ventures portfolio, you may give a brief generic answer BUT you must clearly label it as "outside portfolio context" and keep it secondary.`;

    // Build user instruction with structured context
    const userInstruction = `PORTFOLIO_CONTEXT (JSON array of Radical Ventures portfolio companies):
${portfolioContextJson}

Using ONLY the portfolio_context JSON above, answer the following question:

Question: "${message}"

Respond with clean, readable text (NO markdown formatting like * or **). Use plain text formatting:
- Start with a short sentence summarizing how many companies in the portfolio fit (if applicable).
- Then list each relevant company on a new line with:
  • Company name (in bold by using clear emphasis, but write it as plain text)
  • slug: [slug]
  • primary category: [category]
  • 1–2 sentences explaining why they are relevant

Format your response as clean, readable text without markdown syntax. Use line breaks and simple formatting that reads naturally.

Do NOT mention companies not present in portfolio_context.`;

    // Generate LLM response
    let answer = await generateChatCompletion(systemPrompt, userInstruction);

    // Hallucination detection - check for non-portfolio companies
    const forbiddenExamples = [
      'nvidia',
      'google',
      'microsoft',
      'amazon',
      'intel',
      'amd',
      'openai',
      'anthropic',
      'meta',
      'facebook',
      'apple',
      'tesla',
    ];

    const answerLower = answer.toLowerCase();
    const hallucinated = forbiddenExamples.filter((name) => answerLower.includes(name));

    if (hallucinated.length > 0) {
      console.warn(
        'Potential hallucination detected - non-portfolio companies mentioned:',
        hallucinated
      );

      // Regenerate with stricter prompt
      const stricterPrompt = `${systemPrompt}

CRITICAL: The previous response mentioned companies that are NOT in the Radical Ventures portfolio: ${hallucinated.join(', ')}. You must ONLY mention companies from the portfolio_context JSON provided above. Do not mention any companies outside the portfolio_context.`;

      answer = await generateChatCompletion(stricterPrompt, userInstruction);

      // Log if still hallucinating after regeneration
      const stillHallucinating = forbiddenExamples.filter((name) =>
        answer.toLowerCase().includes(name)
      );
      if (stillHallucinating.length > 0) {
        console.error('Hallucination persisted after regeneration:', stillHallucinating);
      }
    }

    // Build sources array
    const sources = topCompanies.map(({ company }) => ({
      name: company.name,
      slug: company.slug,
      radical_primary_category: company.radical_primary_category,
    }));

    // Include selected company in sources if provided
    if (selectedCompany && !sources.find((s) => s.slug === selectedCompany!.slug)) {
      sources.unshift({
        name: selectedCompany.name,
        slug: selectedCompany.slug,
        radical_primary_category: selectedCompany.radical_primary_category,
      });
    }

    return res.json({
      answer,
      sources,
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to process chat message',
      },
    });
  }
});

/**
 * Calculate cosine distance between two vectors
 */
function cosineDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return 1 - similarity; // Convert similarity to distance
}

export default router;
