#!/usr/bin/env node
/**
 * Create isolated local Playwright states for the five Clerk acceptance roles.
 * Secrets are read only from HV_AUTH_PASSWORD and are never logged or written.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { clerk, clerkSetup } from '@clerk/testing/playwright';

loadEnv({ path: '.env.local' });
await clerkSetup();

const baseURL = process.env.HV_E2E_BASE_URL ?? 'http://127.0.0.1:3100';
const stateDir = path.resolve(process.env.HV_AUTH_STATE_DIR ?? '.auth');
const password = process.env.HV_AUTH_PASSWORD;
const verificationCode = process.env.HV_AUTH_CODE;
const verificationCodes = (process.env.HV_AUTH_CODES ?? '').split(',').map((value) => value.trim());
const roles = [
  ['hotel', 'hotelsvendors@gmail.com'],
  ['supplier', 'support@hotelsvendors.com'],
  ['carrier', 'mozixwatt@gmail.com'],
  ['funder', 'moatazceo@hotelsvendors.com'],
  ['admin', 'reem@hotelsvendors.com'],
];

mkdirSync(stateDir, { recursive: true, mode: 0o700 });
const browser = await chromium.launch({ headless: process.env.HV_AUTH_HEADLESS !== '0' });
try {
  for (const [role, identifier] of roles) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
    await clerk.signIn({ emailAddress: identifier, page });
    await page.goto(`${baseURL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    if (page.url().includes('/login')) throw new Error(`${role}: Clerk did not produce an authenticated session`);
    const cookieNames = (await context.cookies()).map(({ name }) => name);
    if (!cookieNames.some((name) => name === '__session' || name.startsWith('__session_'))) {
      throw new Error(`${role}: authenticated session cookie was not established`);
    }
    // A cookie alone is insufficient evidence: Clerk may have created a
    // session shell that has not completed the server-side handshake. Verify
    // the exact authenticated API boundary before exporting the state.
    const identity = await page.request.get(`${baseURL}/api/v2/me`);
    if (identity.status() !== 200) {
      throw new Error(`${role}: Clerk session did not authenticate /api/v2/me (HTTP ${identity.status()})`);
    }
    await context.storageState({ path: path.join(stateDir, `${role}.json`) });
    console.log(`BATCH_AUTH_OK: ${role}`);
    await context.close();
  }
} finally {
  await browser.close();
}
