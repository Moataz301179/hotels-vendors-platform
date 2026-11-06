import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const nav = readFileSync(resolve(root, 'components/marketing/site-nav.tsx'), 'utf8');
const css = readFileSync(resolve(root, 'components/marketing/public-nav.module.css'), 'utf8');
const footer = readFileSync(resolve(root, 'components/marketing/site-footer.tsx'), 'utf8');

describe('public header contract', () => {
  it('keeps About and Help in the header, while partner portals remain in the footer', () => {
    expect(nav).toContain('href: "/about", label: "About"');
    expect(nav).toContain('href: "/support", label: "Help"');
    expect(nav).not.toContain('label: "Funders"');
    expect(nav).not.toContain('label: "Carriers"');
    expect(footer).toContain('Carrier partner portal');
    expect(footer).toContain('Funder partner portal');
  });

  it('uses the dark translucent chrome, blur, and light action system', () => {
    expect(css).toContain('background:color-mix(in oklch,var(--chrome) 94%,transparent)');
    expect(css).toContain('backdrop-filter:blur(14px)');
    expect(css).toContain('background:var(--blue)');
    expect(css).toContain('background:var(--paper-0)');
  });
});
