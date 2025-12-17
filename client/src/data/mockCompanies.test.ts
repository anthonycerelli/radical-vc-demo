import { describe, it, expect } from 'vitest';
import { mockCompanies } from './mockCompanies';
import { Company } from '@/types/company';

describe('mockCompanies', () => {
  it('should export an array of companies', () => {
    expect(Array.isArray(mockCompanies)).toBe(true);
    expect(mockCompanies.length).toBeGreaterThan(0);
  });

  it('should have valid company structure', () => {
    mockCompanies.forEach((company: Company) => {
      expect(company).toHaveProperty('id');
      expect(company).toHaveProperty('name');
      expect(company).toHaveProperty('description');
      expect(company).toHaveProperty('categories');
      expect(company).toHaveProperty('year');
      expect(company).toHaveProperty('stage');
      expect(company).toHaveProperty('teamSize');
      expect(company).toHaveProperty('location');
      expect(company).toHaveProperty('website');

      expect(typeof company.id).toBe('string');
      expect(typeof company.name).toBe('string');
      expect(typeof company.description).toBe('string');
      expect(Array.isArray(company.categories)).toBe(true);
      expect(typeof company.year).toBe('string');
      expect(typeof company.stage).toBe('string');
      expect(typeof company.teamSize).toBe('number');
      expect(typeof company.location).toBe('string');
      expect(typeof company.website).toBe('string');
    });
  });

  it('should have unique company IDs', () => {
    const ids = mockCompanies.map((c: Company) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

