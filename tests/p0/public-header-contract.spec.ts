import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const nav = readFileSync(resolve(root, 'components/marketing/site-nav.tsx'), 'utf8');
const css = readFileSync(resolve(root, 'components/marketing/public-nav.module.css'), 'utf8');
const footer = readFileSync(resolve(root, 'components/marketing/site-footer.tsx'), 'utf8');

describe('public header contract', () => {
  it('uses the reference header labels and customer-facing partner labels in the footer', () => {
    expect(nav).toContain('label: "How it works"');
    expect(nav).toContain('label: "Catalogue"');
    expect(nav).toContain('label: "Market insights"');
    expect(nav).toContain('label: "E-invoicing"');
    expect(nav).toContain('label: "Partners"');
    expect(nav).toContain('Sign in');
    expect(nav).toContain('Join the network');
    expect(footer).toContain('For Vendors');
    expect(footer).toContain('Logistics partners');
    expect(footer).toContain('Finance partners');
    expect(footer).toContain('Partner enquiries');
    expect(footer).not.toContain('Carrier partner portal');
    expect(footer).not.toContain('Funder partner portal');
  });

  it('uses the solid charcoal chrome and cobalt action system', () => {
    expect(css).toContain('background:var(--chrome)');
    expect(css).toContain('background:var(--blue)');
    expect(css).toContain('color:#fff');
    expect(css).toContain('background:#fff');
  });
});
