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

    // Generate embedding for the user message
    const queryEmbedding = await generateEmbedding(message);

    // Perform vector similarity search
    // Note: Supabase PostgREST doesn't directly support vector operations,
    // so we need to use a stored function or raw SQL
    // Format embedding as string array for PostgreSQL vector type
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    const { data: similarCompanies, error: searchError } = await supabase.rpc(
      'search_similar_companies',
      {
        query_embedding: embeddingString,
        match_threshold: 0.7,
        match_count: topK,
      }
    );

    // Fallback: If RPC doesn't exist, use a simpler approach with raw SQL via Supabase
    // For now, we'll use a workaround by fetching all embeddings and doing client-side search
    // In production, you should create the RPC function in the database
    let topCompanies: Array<{ company: Company; distance: number }> = [];

    if (searchError) {
      console.warn('RPC function not found, using fallback method:', searchError);
      // Fallback: fetch embeddings and compute similarity client-side
      const { data: embeddings, error: embError } = await supabase
        .from('company_embeddings')
        .select('company_id, embedding')
        .eq('source', 'description');

      if (!embError && embeddings) {
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
            return { company_id: emb.company_id, distance };
          })
          .filter((s): s is { company_id: string; distance: number } => s !== null)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, topK);

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
    } else if (similarCompanies) {
      // Use RPC results if available
      topCompanies = similarCompanies.map((item: unknown) => {
        const companyItem = item as { company?: Company; distance?: number };
        return {
          company: companyItem.company as Company,
          distance: companyItem.distance || 0,
        };
      });
    }

    // Build context for LLM
    const contextParts: string[] = [];

    if (selectedCompany) {
      contextParts.push(
        `Selected Company:\n- Name: ${selectedCompany.name}\n- Category: ${selectedCompany.radical_primary_category || 'N/A'}\n- Description: ${selectedCompany.description || 'N/A'}\n- Year: ${selectedCompany.radical_investment_year || 'N/A'}`
      );
    }

    if (topCompanies.length > 0) {
      contextParts.push('\nSimilar Portfolio Companies:');
      topCompanies.forEach(({ company }, index) => {
        contextParts.push(
          `${index + 1}. ${company.name} (${company.radical_primary_category || 'N/A'}) - ${company.description || company.tagline || 'No description available'}`
        );
      });
    }

    const context = contextParts.join('\n\n');

    // Build system prompt
    const systemPrompt = `You are Radical Portfolio Copilot, an internal assistant for a VC firm. You help analyze Radical Ventures' portfolio of AI-first companies. Answer clearly and concisely, using only the context provided. If you don't know something, say you don't know rather than making it up.`;

    // Generate LLM response
    const answer = await generateChatCompletion(systemPrompt, message, context);

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

