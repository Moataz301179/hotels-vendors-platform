import { beforeEach, describe, expect, it, vi } from 'vitest';

const rows = new Map<string, Record<string, unknown>>();

const db = {
  execAsync: vi.fn().mockImplementation(async (sql: string) => {
    if (sql.includes('CREATE TABLE IF NOT EXISTS hovin_drafts')) rows.clear();
  }),
  runAsync: vi.fn().mockImplementation(async (sql: string, ...args: unknown[]) => {
    if (sql.startsWith('INSERT OR REPLACE INTO hovin_drafts')) {
      const [id, tenantId, kind, payload] = args as [string, string, string, string];
      rows.set(id, { id, tenant_id: tenantId, kind, payload, created_at: 1 });
      return { changes: 1 };
    }
    if (sql.startsWith('DELETE FROM hovin_drafts')) {
      const [id, tenantId] = args as [string, string];
      const existing = rows.get(id);
      if (existing && existing.tenant_id === tenantId) rows.delete(id);
      return { changes: 1 };
    }
    return { changes: 0 };
  }),
  getAllAsync: vi.fn().mockImplementation(async (sql: string, tenantId: string, kind?: string) => {
    const all = [...rows.values()].filter((row) => row.tenant_id === tenantId);
    const filtered = kind ? all.filter((row) => row.kind === kind) : all;
    return filtered.sort((a, b) => Number(b.created_at) - Number(a.created_at)).slice(0, 100);
  }),
};

vi.mock('expo-sqlite', () => ({ SQLiteDatabase: db as never }));

const { initializeDrafts, saveDraft, listDrafts, deleteDraft } = await import('./drafts');

beforeEach(() => {
  vi.clearAllMocks();
  rows.clear();
});

describe('HOVIN durable drafts', () => {
  it('creates the draft table on initialize', async () => {
    await initializeDrafts(db as never);
    expect(db.execAsync).toHaveBeenCalled();
  });

  it('saves and lists drafts for the signed-in tenant', async () => {
    await saveDraft(db as never, { id: 'd1', tenantId: 't1', kind: 'RFQ', payload: '{}', createdAt: 1 });
    await saveDraft(db as never, { id: 'd2', tenantId: 't1', kind: 'QUOTE', payload: '{}', createdAt: 2 });
    const drafts = await listDrafts(db as never, 't1');
    expect(drafts).toHaveLength(2);
    expect(drafts.map((draft) => draft.kind).sort()).toEqual(['QUOTE', 'RFQ']);
  });

  it('does not leak drafts across tenants', async () => {
    await saveDraft(db as never, { id: 'd1', tenantId: 't1', kind: 'RFQ', payload: '{}', createdAt: 1 });
    await saveDraft(db as never, { id: 'd2', tenantId: 't2', kind: 'RFQ', payload: '{}', createdAt: 2 });
    expect(await listDrafts(db as never, 't1')).toHaveLength(1);
    expect(await listDrafts(db as never, 't2')).toHaveLength(1);
  });

  it('filters drafts by kind', async () => {
    await saveDraft(db as never, { id: 'd1', tenantId: 't1', kind: 'RFQ', payload: '{}', createdAt: 1 });
    await saveDraft(db as never, { id: 'd2', tenantId: 't1', kind: 'RECEIPT', payload: '{}', createdAt: 2 });
    const drafts = await listDrafts(db as never, 't1', 'RECEIPT');
    expect(drafts).toHaveLength(1);
    expect(drafts[0].id).toBe('d2');
  });

  it('deletes only the owning tenant draft', async () => {
    await saveDraft(db as never, { id: 'd1', tenantId: 't1', kind: 'RFQ', payload: '{}', createdAt: 1 });
    await deleteDraft(db as never, 'd1', 't2');
    expect(await listDrafts(db as never, 't1')).toHaveLength(1);
    await deleteDraft(db as never, 'd1', 't1');
    expect(await listDrafts(db as never, 't1')).toHaveLength(0);
  });

  it('refuses to save a draft without a tenant or stable id', async () => {
    await expect(saveDraft(db as never, { id: '', tenantId: 't1', kind: 'RFQ', payload: '{}', createdAt: 1 })).rejects.toThrow();
    await expect(saveDraft(db as never, { id: 'd1', tenantId: '', kind: 'RFQ', payload: '{}', createdAt: 1 })).rejects.toThrow();
  });
});
