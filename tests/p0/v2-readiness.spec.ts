import { describe, expect, it } from 'vitest';
import { getMissingRequiredTables, REQUIRED_V2_TABLES } from '../../lib/v2-readiness';

describe('V2 readiness schema checks', () => {
  it('reports ready only when every required table is present', () => {
    const checks = REQUIRED_V2_TABLES.map((table_name) => ({ table_name, present: true }));
    expect(getMissingRequiredTables(checks)).toEqual([]);
  });

  it('identifies absent critical tables without hiding schema drift', () => {
    const checks = REQUIRED_V2_TABLES.map((table_name) => ({
      table_name,
      present: !['Opportunity', 'SavingsLedger', 'EvidenceRecord'].includes(table_name),
    }));
    expect(getMissingRequiredTables(checks)).toEqual(['Opportunity', 'SavingsLedger', 'EvidenceRecord']);
  });
});
