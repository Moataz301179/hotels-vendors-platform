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

  it('uses the live curtain, blur, ice action, and cobalt hover tokens', () => {
    expect(css).toContain('background:#2f2f2feb');
    expect(css).toContain('backdrop-filter:blur(14px)');
    expect(css).toContain('background:#95c4f5');
    expect(css).toContain('background:#276aa9');
  });
});
