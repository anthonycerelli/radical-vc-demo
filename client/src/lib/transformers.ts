/**
 * Transformers to convert API types to frontend types
 */

import { ApiCompany } from './api';
import { Company } from '@/types/company';

/**
 * Transform API company to frontend company format
 */
export function transformApiCompany(apiCompany: ApiCompany): Company {
  return {
    id: apiCompany.id,
    name: apiCompany.name,
    slug: apiCompany.slug,
    description: apiCompany.description,
    categories: apiCompany.radical_all_categories || [],
    year: apiCompany.radical_investment_year,
    tagline: apiCompany.tagline,
    primaryCategory: apiCompany.radical_primary_category,
    sectors: apiCompany.all_sectors || [],
    primarySector: apiCompany.primary_sector,
    founderNames: apiCompany.founder_names || [],
    website: apiCompany.company_website_url,
    portfolioUrl: apiCompany.radical_portfolio_url,
    // Optional fields - not available in API, can be set to defaults or null
    stage: undefined,
    teamSize: undefined,
    location: undefined,
  };
}
