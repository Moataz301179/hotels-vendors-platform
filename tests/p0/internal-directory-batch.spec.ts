import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const batch = JSON.parse(readFileSync(resolve(process.cwd(), 'data/directory/hospitality-core-specifications.v1.json'), 'utf8')) as { source: { sourceUrl: string; sourceType: string; permissionStatus: string; permissionNote: string }; records: Array<Record<string, unknown>> };
const prohibited = /\b(supplier|vendor|price|stock|availability|available|offer|quotation|quote|delivery|eta|lead time)\b/i;

describe('internal supplier-neutral directory batch', () => {
  it('contains a bounded, internally authored production batch', () => {
    expect(batch.source.sourceUrl).toMatch(/^internal:\/\/hotelsvendors\//);
    expect(batch.source.sourceType).toBe('INTERNAL_HOSPITALITY_SPECIFICATION');
    expect(batch.source.permissionStatus).toBe('PERMITTED');
    expect(batch.records).toHaveLength(15);
    expect(new Set(batch.records.map((record) => record.sourceRecordKey))).toHaveLength(batch.records.length);
  });

  it('does not encode commercial or supplier claims in buyer-facing specifications', () => {
    for (const record of batch.records) expect(JSON.stringify(record)).not.toMatch(prohibited);
  });
});
