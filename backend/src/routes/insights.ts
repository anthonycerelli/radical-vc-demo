import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabaseClient.js';

const router = Router();

/**
 * GET /api/insights/summary
 * Get portfolio analytics (by category and year)
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    // Get all companies
    const { data: companies, error } = await supabase
      .from('companies')
      .select('radical_primary_category, radical_all_categories, radical_investment_year');

    if (error) {
      throw error;
    }

    // Group by primary category
    const categoryMap = new Map<string, number>();
    for (const company of companies || []) {
      // Use primary category if available, otherwise use first category from all_categories
      const category =
        company.radical_primary_category ||
        (company.radical_all_categories && company.radical_all_categories.length > 0
          ? company.radical_all_categories[0]
          : 'Uncategorized');

      if (category) {
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      }
    }

    const byCategory = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Group by year
    const yearMap = new Map<number, number>();
    for (const company of companies || []) {
      if (company.radical_investment_year) {
        yearMap.set(
          company.radical_investment_year,
          (yearMap.get(company.radical_investment_year) || 0) + 1
        );
      }
    }

    const byYear = Array.from(yearMap.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);

    res.json({
      byCategory,
      byYear,
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      error: {
        message: 'Failed to fetch insights',
      },
    });
  }
});

export default router;

