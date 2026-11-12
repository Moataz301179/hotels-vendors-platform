import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PUBLIC_NAV_LINKS, PROCUREMENT_JOURNEY } from '@/lib/marketing/procurement-journey';

const root = process.cwd();
const nav = readFileSync(resolve(root, 'components/marketing/site-nav.tsx'), 'utf8');
const css = readFileSync(resolve(root, 'components/marketing/public-nav.module.css'), 'utf8');
const footer = readFileSync(resolve(root, 'components/marketing/site-footer.tsx'), 'utf8');
const journey = readFileSync(resolve(root, 'lib/marketing/procurement-journey.ts'), 'utf8');

describe('public header contract', () => {
  it('exposes one coherent public navigation path into catalogue, solutions, receiving and e-invoicing', () => {
    expect(nav).toContain('PUBLIC_NAV_LINKS');
    expect(PUBLIC_NAV_LINKS.map((link) => link.label)).toEqual([
      'How it works',
      'Catalogue',
      'Solutions',
      'Receiving',
      'E-invoicing',
    ]);
    expect(PUBLIC_NAV_LINKS.map((link) => link.href)).toEqual([
      '/platform',
      '/marketplace',
      '/solutions',
      '/hovin',
      '/eta-connect',
    ]);
    expect(nav).toContain('Sign in');
    expect(nav).toContain('Join the network');
    expect(footer).toContain('For Vendors');
    expect(footer).toContain('Logistics partners');
    expect(footer).toContain('Finance partners');
    expect(footer).toContain('Partner enquiries');
    expect(footer).toContain('HOVIN receiving');
    expect(footer).toContain('PROCUREMENT_JOURNEY.hovin.href');
    expect(footer).toContain('PUBLIC_NAV_LINKS');
    expect(PROCUREMENT_JOURNEY.hovin.href).toBe('/hovin');
    expect(footer).not.toContain('Carrier partner portal');
    expect(footer).not.toContain('Funder partner portal');
    expect(journey).toContain('receivingLogin');
  });

  it('uses the solid charcoal chrome and cobalt action system', () => {
    expect(css).toContain('background:var(--chrome)');
    expect(css).toContain('background:var(--blue)');
    expect(css).toContain('color:#fff');
    expect(css).toContain('background:#fff');
  });
});
