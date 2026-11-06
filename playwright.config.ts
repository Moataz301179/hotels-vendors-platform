import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.HV_E2E_BASE_URL ?? 'http://127.0.0.1:3100';

export default defineConfig({
  testDir: './tests/browser',
  reporter: 'list',
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', testIgnore: /authenticated\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
    {
      name: 'chromium-aggregator',
      testMatch: /aggregator-redesign\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    ...(process.env.HV_AUTH_E2E === '1'
      ? [{ name: 'chromium-authenticated', testMatch: /authenticated\.spec\.ts/, use: { ...devices['Desktop Chrome'] } }]
      : []),
  ],
});
