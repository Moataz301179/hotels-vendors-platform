import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@/lib/audit/contrast';
import { workspaceContextLabel } from '@/lib/dashboard/role-navigation';
import { verificationHold } from '@/lib/onboarding/founder-access';
import { buildClerkContentSecurityPolicy } from '@/lib/security/clerk-csp';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('ISO 9241-110 operating screens', () => {
  it('names the signed-in organization instead of repeating an empty workspace label', () => {
    expect(workspaceContextLabel('HOTEL')).toBe('Hotel workspace');
    expect(workspaceContextLabel('SUPPLIER')).toBe('Vendor workspace');
    expect(workspaceContextLabel('SHIPPING')).toBe('Carrier workspace');
    expect(workspaceContextLabel('FACTORING')).toBe('Funder workspace');
    expect(workspaceContextLabel('')).toBe('Organization');
    expect(workspaceContextLabel('')).not.toBe('Workspace workspace');
  });

  it('tells a pending organization the one next legal action', () => {
    expect(verificationHold('HOTEL')).toContain('sealed sourcing request');
    expect(verificationHold('SUPPLIER')).toContain('requests assigned to it');
    expect(verificationHold('SHIPPING')).toContain('assigned movements');
    expect(verificationHold('FACTORING')).toContain('accepted invoice');
  });

  it('points an empty order desk at a sealed request', () => {
    const orders = source('components/v2/orders-client.tsx');
    expect(orders).toContain('Start from a requirement, not from a direct purchase.');
    expect(orders).toContain('href="/workspace/marketplace"');
  });

  it('keeps commercial data off the phone plan', () => {
    const plan = source('lib/mobile/field-layer.ts');
    expect(plan).toContain('Supplier identity on a hotel buying surface');
    expect(plan).toContain('Prices, invoices, and funding decisions');
    expect(plan).toContain('Binding offers and stock');
  });

  it('names a blocked receipt instead of showing an empty failure', () => {
    const mobile = source('mobile/app/index.tsx');
    expect(mobile).toContain('ETA_CLEARANCE_REQUIRED_BEFORE_DELIVERY');
    expect(mobile).toContain('RECEIVING_ROLE_REQUIRED');
  });
});

describe('WCAG 2.2 AA operating surfaces', () => {
  it('keeps field text at or above 4.5:1', () => {
    const pairs = [
      ['#808B95', '#101215'],
      ['#808B95', '#171B20'],
      ['#B4BDC5', '#101215'],
      ['#F2F4F5', '#101215'],
      ['#10202C', '#9BC9E9'],
      ['#F4B6B0', '#402326'],
    ];
    for (const [foreground, background] of pairs) expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#7a520e', '#f1f0e8')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#7a520e', '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#4d565b', '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#546068', '#f1f0e8')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#546068', '#e6e7de')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#546068', '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#245c96', '#e6e7de')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#ffffff', '#2f6fb0')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#ffffff', '#245c96')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#546068', '#fbfbf7')).toBeGreaterThanOrEqual(4.5);
    const header = source('app/globals.css');
    expect(header).toContain('.app-top-primary{display:inline-flex;align-items:center;gap:7px;min-height:38px;padding:0 13px;background:var(--blue);color:#fff!important;');
    expect(header).toContain('.app-shell .side .side-label{padding:0 12px 10px;color:#546068;');
    const catalogue = source('components/v2/procurement-console.tsx');
    expect(catalogue).not.toContain('role="list"');
    const directory = source('components/marketing/marketplace-directory.tsx');
    expect(directory).not.toContain('role="table"');
    expect(directory).not.toContain('role="row"');
    const carousel = source('components/marketing/marketplace-carousel.tsx');
    expect(carousel).toContain('tabIndex={slideIndex === index ? 0 : -1}');
    const dots = source('components/marketing/marketplace-carousel.module.css');
    expect(dots).toContain('width: 24px;');
    expect(dots).toContain('height: 24px;');
    const css = source('app/globals.css');
    expect(css).toContain('--amber:#7a520e');
    expect(css).toContain('.hv-auth-legal{font-size:13px;line-height:1.7;color:#4d565b;');
  });

  it('gives the order filters and receipt quantities accessible names', () => {
    const orders = source('components/v2/orders-client.tsx');
    expect(orders).toContain('aria-label="Filter orders"');
    expect(orders).toContain('aria-label="Filter by status"');
    expect(orders).toContain('<label>Received');
    expect(orders).toContain('<label>Accepted');
    expect(orders).toContain('role="alert"');
  });

  it('exposes the organization setup progress and pending status to assistive technology', () => {
    const onboarding = source('app/(app)/onboarding/page.tsx');
    expect(onboarding).toContain('aria-label="Organization setup progress"');
    expect(onboarding).toContain('role="status"');
    expect(onboarding).toContain('<label>{labels.name}');
  });
});

describe('OWASP ASVS 5.0 browser and access controls', () => {
  it('meets the Level 2 browser header requirements in 3.4.1 through 3.4.6', () => {
    const proxy = source('proxy.ts');
    const policy = buildClerkContentSecurityPolicy('pk_test_Y2xlcmsuaG90ZWxzdmVuZG9ycy5jb20k', 'nonce');
    expect(proxy).toContain('max-age=63072000; includeSubDomains; preload');
    expect(proxy).toContain('X-Content-Type-Options", "nosniff"');
    expect(proxy).toContain('strict-origin-when-cross-origin');
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy.split('; ').find((directive) => directive.startsWith('script-src'))).not.toContain("'unsafe-inline'");
  });
});
