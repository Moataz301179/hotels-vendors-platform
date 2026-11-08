/** Expo SQLite durable drafts for HOVIN RFQ/quote/receipt work.
 *
 * Drafts are separate from server state and from the existing GRN outbox:
 * a draft is never presented as a server-confirmed record.
 */
import type { SQLiteDatabase } from 'expo-sqlite';

export type DraftKind = 'RFQ' | 'QUOTE' | 'RECEIPT';

export type Draft = {
  /** Stable client id. Also used as the idempotency key when submitted. */
  id: string;
  tenantId: string;
  kind: DraftKind;
  payload: string;
  createdAt: number;
};

export async function initializeDrafts(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`CREATE TABLE IF NOT EXISTS hovin_drafts (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('RFQ', 'QUOTE', 'RECEIPT')),
    payload TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE INDEX IF NOT EXISTS hovin_drafts_tenant ON hovin_drafts(tenant_id, kind, created_at);`);
}

export async function saveDraft(db: SQLiteDatabase, draft: Draft): Promise<void> {
  if (!draft.tenantId || !draft.id) throw new Error('Tenant and stable draft id are required');
  await db.runAsync(
    'INSERT OR REPLACE INTO hovin_drafts(id, tenant_id, kind, payload, created_at) VALUES (?, ?, ?, ?, ?)',
    draft.id,
    draft.tenantId,
    draft.kind,
    draft.payload,
    draft.createdAt || Math.floor(Date.now() / 1000),
  );
}

export async function listDrafts(db: SQLiteDatabase, tenantId: string, kind?: DraftKind): Promise<Draft[]> {
  const rows = kind
    ? await db.getAllAsync<{
        id: string;
        tenant_id: string;
        kind: DraftKind;
        payload: string;
        created_at: number;
      }>('SELECT id, tenant_id, kind, payload, created_at FROM hovin_drafts WHERE tenant_id = ? AND kind = ? ORDER BY created_at DESC LIMIT 100', tenantId, kind)
    : await db.getAllAsync<{
        id: string;
        tenant_id: string;
        kind: DraftKind;
        payload: string;
        created_at: number;
      }>('SELECT id, tenant_id, kind, payload, created_at FROM hovin_drafts WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 100', tenantId);
  return rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    kind: row.kind,
    payload: row.payload,
    createdAt: row.created_at,
  }));
}

export async function deleteDraft(db: SQLiteDatabase, id: string, tenantId: string): Promise<void> {
  await db.runAsync('DELETE FROM hovin_drafts WHERE id = ? AND tenant_id = ?', id, tenantId);
}
