import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/hotel-data/**/*.spec.ts'],
    exclude: ['node_modules/**'],
    resolve: {
      alias: {
        '@': '/Users/Moatazi/hotels-vendors-new',
      },
    },
    deps: {
      interopDefault: true,
    },
  },
});
