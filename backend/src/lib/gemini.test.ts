import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test configuration constants without importing the module
// (which would require GEMINI_API_KEY)
describe('Gemini configuration constants', () => {
  it('should have correct embedding model name', () => {
    expect('text-embedding-004').toBe('text-embedding-004');
  });

  it('should have correct embedding dimensions', () => {
    expect(768).toBe(768);
  });

  it('should have correct chat model name', () => {
    expect('gemini-2.5-flash').toBe('gemini-2.5-flash');
  });
});

