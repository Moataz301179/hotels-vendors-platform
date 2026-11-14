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
    expect(footer).toContain('>Vendors</Link>');
    expect(footer).toContain('>Logistics</Link>');
    expect(footer).toContain('>Finance</Link>');
    expect(footer).toContain('Partner enquiries');
    expect(footer).not.toContain('For Vendors');
    expect(footer).not.toContain('Logistics partners');
    expect(footer).not.toContain('Finance partners');
    expect(footer).not.toContain('Carrier partner portal');
    expect(footer).not.toContain('Funder partner portal');
  });

  it('uses the OLED chrome token and cobalt action system', () => {
    expect(css).toContain('background:var(--chrome)');
    expect(css).toContain('background:var(--blue)');
    expect(css).toContain('color:#fff');
    expect(css).toContain('background:#fff');
    const globals = readFileSync(resolve(root, 'app/globals.css'), 'utf8');
    expect(globals).toContain('--chrome-oled:#141516');
    expect(globals).toMatch(/--chrome:\s*var\(--chrome-oled\)/);
    expect(globals).not.toMatch(/--chrome:\s*var\(--charcoal\)/);
  });
});
