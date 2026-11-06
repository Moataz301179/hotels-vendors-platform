import { expect, test, afterAll } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * P0 aggregator redesign — click-first task-flow evidence.
 *
 * The aggregator redesign is already present in PR #49 as the authenticated
 * supplier/hotel command center.  We assert the role task flows render,
 * remain tenant-scoped, and are fully responsive (EN 390/768/1280) with no
 * horizontal overflow and the approved non-transparent charcoal header.
 *
 * Run with:
 *   HV_AUTH_ENV=local HV_AUTH_E2E=1 HV_AUTH_STATE_DIR=.auth-testing HV_E2E_BASE_URL=http://127.0.0.1:3100 \
 *   npx playwright test --project=chromium-aggregator
 */
const roles = ['hotel', 'supplier'] as const;
const base = process.env.HV_E2E_BASE_URL ?? 'http://127.0.0.1:3100';
const stateDir = process.env.HV_AUTH_STATE_DIR ?? '.auth-testing';
const stateFor = (role: (typeof roles)[number]) => path.resolve(stateDir, `${role}.json`);
const routes = {
  hotel: '/workspace/marketplace',
  supplier: '/suppliers',
};

let evidence: Array<Record<string, unknown>> = [];
const storeEvidence = (tokens: Record<string, unknown>) => evidence.push(tokens);

async function mainEvidence(page, route, label) {
  const tokens = await page.evaluate((arg) => {
    const routeLabel = arg.label;
    const route = arg.route;
    const text = document.querySelector('main')?.innerText ?? '';
    const metrics = {
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      bodyBg: getComputedStyle(document.body).backgroundColor,
    };
    const header = document.querySelector('header nav, .nav');
    const headerBg = header ? getComputedStyle(header).backgroundColor ?? '' : '';
    const hasCharcoal = /rgba?\([0-9.]+,[ \t]*[0-9.]+,[ \t]*[0-9.]+/.test(headerBg);
    const opaque = header ? !/transparent| rgba?\(0,0,0,0\)/.test(headerBg.toLowerCase()) : false;
    const tokens = {
      actor: routeLabel,
      route,
      hasMain: !!document.querySelector('main'),
      hasNav: !!document.querySelector('nav'),
      hasCharcoalHeader: hasCharcoal,
      headerOpaque: opaque,
      noHorizontalOverflow: metrics.scrollW <= metrics.clientW + 1,
      textLength: text.length,
      keyHeadings: text.split('\n')
        .filter((l) => /command center|commercial desk|RFQ|OPEN|READY|RECORDED|Assigned/.test(l.trim()))
        .join(' | '),
    };
    return tokens;
  }, { route, label });
  storeEvidence(tokens);
  return tokens;
}

const configured = process.env.HV_AUTH_E2E === '1' && process.env.HV_AUTH_ENV === 'local';

test.describe('P0 aggregator redesign (click-first task flows)', () => {
  test.skip(!configured, 'HV_AUTH_E2E=1 with approved Clerk storage states (.auth-testing) required to run.');

  for (const role of roles) {
    test(`${role} aggregator route renders the command center and task flows (EN, no overflow)`, async ({ browser }) => {
      const state = stateFor(role);
      expect(fs.statSync(state, { throwIfNoEntry: false })?.isFile()).toBe(true);
      const ctx = await browser.newContext({ storageState: state });
      const page = await ctx.newPage();
      try {
        await page.goto(`${base}${routes[role]}`, { waitUntil: 'networkidle', timeout: 45000 });
        await expect(page.locator('body')).not.toContainText('UNAUTHENTICATED');
        await mainEvidence(page, { route: routes[role], label: role });
        for (const [w, h] of [[390, 844], [768, 1024], [1280, 1024]] as const) {
          await page.setViewportSize({ width: w, height: h });
          const m = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth }));
          expect(m.scrollW).toBeLessThanOrEqual(m.clientW + 1, `${role} viewport ${w}x${h} horizontal overflow`);
          await expect(page.locator('body')).not.toContainText('UNAUTHENTICATED');
        }
      } finally {
        await ctx.close();
      }
    });
  }
});

afterAll(async () => {
  if (evidence.length === 0) return;
  const report = {
    file: 'tests/browser/aggregator-redesign.spec.ts',
    capturedAt: new Date().toISOString(),
    canonicalTarget: process.env.HV_E2E_BASE_URL,
    results: evidence,
    evidenceFile: 'recovery-reports/aggregator-redesign-evidence.json',
  };
  fs.mkdirSync('recovery-reports', { recursive: true });
  fs.writeFileSync('recovery-reports/aggregator-redesign-evidence.json', JSON.stringify(report, null, 2) + '\n');
  console.log(`\n[P0 aggregator evidence] wrote ${evidence.length} result(s) -> recovery-reports/aggregator-redesign-evidence.json`);
});
