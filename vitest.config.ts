// vitest.config.ts
// P0-specific Vitest configuration.
// Runs only the P0 test files.

import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: {
    globals: true,
    environment: 'node',
    // Include ONLY the p0 tests
    include: ['tests/p0/**/*.spec.ts'],
    exclude: [
      // Do NOT run the full platform test suite
      'tests/unit/**',
      'tests/integration/**',
      'tests/e2e/**',
      'node_modules/**',
    ],
    // Coverage thresholds (relaxed for MVP)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        functions: 80,
        lines: 80,
        branches: 80,
        statements: 80,
      },
      // Coverage reports output to coverage/
      reportsDirectory: 'coverage',
      // Allow partial coverage reporting
      skipFull: false,
    },
    // Sequential execution for test isolation clarity
    sequence: {
      sequential: true,
    },
    // Shorter timeout since these are unit tests
    testTimeout: 10_000,
  },
});
