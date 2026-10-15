import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const header = readFileSync('components/v2/app-header.tsx', 'utf8');

describe('workspace header navigation', () => {
  it('keeps the procurement entry on the authenticated workflow', () => {
    expect(header).toContain('href="/workspace/marketplace">Procurement network');
    expect(header).not.toContain('href="/marketplace">Procurement network');
  });
});
