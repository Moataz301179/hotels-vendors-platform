import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Authenticated acceptance contract.
 *
 * Storage states are created by an approved Clerk test-identity setup and are
 * deliberately external to the repository. This test never accepts passwords,
 * tokens, or production credentials from source control.
 *
 * Run with:
 *   HV_AUTH_E2E=1 HV_E2E_BASE_URL=http://127.0.0.1:3100 \
 *   HV_AUTH_STATE_DIR=.auth playwright test --project=chromium-authenticated
 */
const roles = ['hotel', 'supplier', 'carrier', 'funder', 'admin'] as const;
const stateDir = process.env.HV_AUTH_STATE_DIR ?? '.auth';
const statePath = (role: (typeof roles)[number]) => path.resolve(stateDir, `${role}.json`);
const configured = process.env.HV_AUTH_E2E === '1';

test.describe('authenticated role and tenant boundaries', () => {
  test.skip(!configured, 'Set HV_AUTH_E2E=1 with approved Clerk storage states to run authenticated acceptance tests.');

  for (const role of roles) {
    test(`${role} can open its workspace and identity is authenticated`, async ({ browser }) => {
      const state = statePath(role);
      expect(fs.existsSync(state), `Missing approved storage state: ${state}`).toBe(true);
      const context = await browser.newContext({ storageState: state });
      const page = await context.newPage();
      const response = await page.goto('/dashboard');
      expect(response?.status()).toBe(200);
      await expect(page.locator('body')).not.toContainText('UNAUTHENTICATED');
      const identity = await page.request.get('/api/v2/me');
      expect(identity.status()).toBe(200);
      expect((await identity.json()) as { user?: { platformRole?: string } }).toMatchObject({
        user: { platformRole: expect.any(String) },
      });
      await context.close();
    });
  }

  test('hotel cannot read another tenant through the authenticated API', async ({ browser }) => {
    const state = statePath('hotel');
    expect(fs.existsSync(state), `Missing approved storage state: ${state}`).toBe(true);
    const context = await browser.newContext({ storageState: state });
    const response = await context.request.get('/api/v2/orders?tenantId=unrelated-tenant');
    expect([200, 403]).toContain(response.status());
    if (response.status() === 200) {
      const body = (await response.json()) as { orders?: Array<{ tenantId?: string }> };
      expect(body.orders?.some((order) => order.tenantId === 'unrelated-tenant')).toBe(false);
    }
    await context.close();
  });
});
