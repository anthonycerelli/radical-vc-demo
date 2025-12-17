import { defineConfig } from 'vitest/config';

/**
 * Root Vitest config for E2E / cross-cutting tests only
 * 
 * Client tests: Run from client/ directory
 * Backend tests: Run from backend/ directory
 * E2E tests: Run from root with this config
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/e2e/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.nuxt/**',
      '**/coverage/**',
      'client/**',
      'backend/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '**/*.config.*',
        '**/types/**',
        '**/*.d.ts',
        '**/migrations/**',
        '**/scripts/**',
        'tests/**',
        'client/**',
        'backend/**',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});

