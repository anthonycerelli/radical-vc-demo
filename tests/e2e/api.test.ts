import { describe, it, expect, beforeAll } from 'vitest';

/**
 * E2E API Tests
 *
 * These tests should:
 * - Hit real HTTP endpoints (e.g., http://localhost:3001)
 * - Test full request/response cycles
 * - Not import React components or server internals directly
 *
 * To run these tests:
 * 1. Start the backend server: cd backend && npm run dev
 * 2. Run: npm run test:e2e
 *
 * Note: These tests will be skipped if the server is not running
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Check if server is available before running tests
async function checkServerAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
    return response.ok;
  } catch {
    return false;
  }
}

// Use top-level await to check server availability before defining tests
const serverAvailable = await checkServerAvailable();

describe.skipIf(!serverAvailable)('E2E API Tests', () => {
  it('should return health check', async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('ok');
  });

  it('should fetch companies list', async () => {
    const response = await fetch(`${API_BASE_URL}/api/companies?limit=5`);
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('companies');
    expect(data).toHaveProperty('total');
    expect(Array.isArray(data.companies)).toBe(true);
  });

  it('should handle invalid company slug', async () => {
    const response = await fetch(`${API_BASE_URL}/api/companies/invalid-slug-12345`);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});
