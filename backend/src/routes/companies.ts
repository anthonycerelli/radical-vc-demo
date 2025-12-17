import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabaseClient.js';
import { Company } from '../types/database.js';

const router = Router();

/**
 * GET /api/companies
 * List companies with optional filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q, category, year, limit = '20', offset = '0' } = req.query;

    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 100);
    const offsetNum = parseInt(offset as string, 10) || 0;

    let query = supabase.from('companies').select('*', { count: 'exact' });

    // Text search on name and description
    if (q && typeof q === 'string') {
      const searchTerm = `%${q}%`;
      query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);
    }

    // Category filter
    if (category && typeof category === 'string') {
      const categories = category.split(',').map((c) => c.trim());
      // Filter by primary category OR if any category in the array matches
      const categoryFilters = categories
        .map((cat) => `radical_all_categories.cs.{${cat}}`)
        .join(',');
      query = query.or(`radical_primary_category.in.(${categories.join(',')}),${categoryFilters}`);
    }

    // Year filter
    if (year) {
      const yearNum = parseInt(year as string, 10);
      if (!isNaN(yearNum)) {
        query = query.eq('radical_investment_year', yearNum);
      }
    }

    // Apply pagination
    query = query.range(offsetNum, offsetNum + limitNum - 1);

    // Order by name
    query = query.order('name', { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    res.json({
      companies: (data as Company[]) || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      error: {
        message: 'Failed to fetch companies',
      },
    });
  }
});

/**
 * GET /api/companies/:slug
 * Get a single company by slug
 */
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const { data, error } = await supabase.from('companies').select('*').eq('slug', slug).single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return res.status(404).json({
          error: {
            message: 'Company not found',
          },
        });
      }
      throw error;
    }

    return res.json(data as Company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to fetch company',
      },
    });
  }
});

export default router;
