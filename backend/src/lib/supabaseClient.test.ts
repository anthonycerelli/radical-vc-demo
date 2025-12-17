import { describe, it, expect, vi } from 'vitest';

// Mock dotenv
vi.mock('dotenv', () => ({
  default: {
    config: vi.fn(),
  },
}));

// Import after mocking
import { supabase, getDbClient } from './supabaseClient.js';

describe('Supabase client', () => {
  it('should export supabase client', () => {
    expect(supabase).toBeDefined();
  });

  it('should export getDbClient function', () => {
    expect(getDbClient).toBeDefined();
    expect(typeof getDbClient).toBe('function');
  });

  it('should return supabase client from getDbClient', () => {
    const client = getDbClient();
    expect(client).toBe(supabase);
  });
});
