import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const header = readFileSync('components/v2/app-header.tsx', 'utf8');

describe('workspace header navigation', () => {
  it('keeps the hotel requirement action on the authenticated workflow', () => {
    expect(header).toContain("HOTEL: { href: '/workspace/marketplace', label: 'New requirement' }");
    expect(header).not.toContain("href: '/marketplace'");
  });
});
