import { describe, it, expect } from 'vitest';

describe('Example test suite', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    const str = 'Radical Portfolio Copilot';
    expect(str).toContain('Radical');
    expect(str.length).toBeGreaterThan(0);
  });

  it('should handle array operations', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });
});

