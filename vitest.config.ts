// vitest.config.ts
// Run the repository's maintained test specs by default.
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    exclude: ['node_modules/**'],
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
