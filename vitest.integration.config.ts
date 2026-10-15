import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.spec.ts'],
    sequence: { sequential: true },
    testTimeout: 30_000,
  },
});
