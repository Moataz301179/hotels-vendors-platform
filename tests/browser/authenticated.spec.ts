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
 *   HV_AUTH_ENV=local HV_AUTH_E2E=1 HV_E2E_BASE_URL=http://127.0.0.1:3100 \
 *   HV_AUTH_STATE_DIR=.auth playwright test --project=chromium-authenticated
 */
const roles = ['hotel', 'supplier', 'carrier', 'funder', 'admin'] as const;
const expectedPlatformRoles = {
  hotel: 'HOTEL',
  supplier: 'SUPPLIER',
  carrier: 'SHIPPING',
  funder: 'FACTORING',
  admin: 'ADMIN',
} as const;
const stateDir = process.env.HV_AUTH_STATE_DIR ?? '.auth';
const statePath = (role: (typeof roles)[number]) => path.resolve(stateDir, `${role}.json`);
const configured = process.env.HV_AUTH_E2E === '1' && process.env.HV_AUTH_ENV === 'local';

test.describe('authenticated role and tenant boundaries', () => {
  test.skip(!configured, 'Set HV_AUTH_E2E=1 with approved Clerk storage states to run authenticated acceptance tests.');

  for (const role of roles) {
    test(`${role} can open its workspace and identity is authenticated`, async ({ browser }) => {
      const state = statePath(role);
      expect(fs.statSync(state, { throwIfNoEntry: false })?.isFile(), `Missing approved storage state: ${state}`).toBe(true);
      const context = await browser.newContext({ storageState: state });
      const page = await context.newPage();
      const response = await page.goto('/dashboard');
      expect(response?.status()).toBe(200);
      await expect(page.locator('body')).not.toContainText('UNAUTHENTICATED');
      const identity = await page.request.get('/api/v2/me');
      expect(identity.status()).toBe(200);
      const identityBody = (await identity.json()) as { user?: { platformRole?: string; tenantId?: string } };
      expect(identityBody).toMatchObject({
        user: { platformRole: expectedPlatformRoles[role], tenantId: expect.any(String) },
      });
      expect(identityBody.user?.tenantId).not.toBe('unrelated-tenant');
      await context.close();
    });
  }

  test.describe('read-only role and tenant boundaries', () => {
    const probes = {
      hotel: async (request: import('@playwright/test').APIRequestContext) => request.get('/api/v2/orders?tenantId=unrelated-tenant'),
      supplier: async (request: import('@playwright/test').APIRequestContext) => request.get('/api/v2/orders?tenantId=unrelated-tenant'),
      carrier: async (request: import('@playwright/test').APIRequestContext) => request.get('/api/v2/shipments'),
      funder: async (request: import('@playwright/test').APIRequestContext) => request.get('/api/v2/funding'),
      admin: async (request: import('@playwright/test').APIRequestContext) => request.get('/api/v2/audit?tenantId=unrelated-tenant'),
    } as const;

    for (const role of roles) {
      test(`${role} read probe is authenticated and tenant-scoped`, async ({ browser }) => {
        const state = statePath(role);
        expect(fs.statSync(state, { throwIfNoEntry: false })?.isFile(), `Missing approved storage state: ${state}`).toBe(true);
        const context = await browser.newContext({ storageState: state });
        const identity = await context.request.get('/api/v2/me');
        const identityBody = (await identity.json()) as { user?: { tenantId?: string } };
        const tenantId = identityBody.user?.tenantId;
        expect(tenantId).toEqual(expect.any(String));

        const response = await probes[role](context.request);
        expect([200, 403, 404]).toContain(response.status());
        const body = (await response.json()) as Record<string, unknown>;
        expect(JSON.stringify(body)).not.toContain('unrelated-tenant');
        if (role === 'admin' && response.status() === 200) {
          expect(body).toMatchObject({ platformTenantId: tenantId });
        }
        await context.close();
      });
    }
  });
});
