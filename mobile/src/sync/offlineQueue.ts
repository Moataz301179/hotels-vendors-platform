/** Expo SQLite durable outbox for HOVIN GRN submissions. Requires expo-sqlite. */
import type { SQLiteDatabase } from 'expo-sqlite';

export type OutboxItem = {
  id: string;
  tenantId: string;
  kind: 'GRN';
  payload: string;
  attempts: number;
};

export type OutboxSummary = {
  queued: number;
  lastSyncAt: number | null;
};

export async function initializeOutbox(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`CREATE TABLE IF NOT EXISTS hovin_outbox (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind = 'GRN'),
    payload TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'sending')),
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  ); CREATE INDEX IF NOT EXISTS hovin_outbox_pending ON hovin_outbox(tenant_id, state, created_at);
  CREATE TABLE IF NOT EXISTS hovin_device_state (
    state_key TEXT PRIMARY KEY NOT NULL,
    state_value TEXT NOT NULL
  );`);
  // An interrupted send is retried with the same idempotency key.
  await db.runAsync("UPDATE hovin_outbox SET state = 'pending' WHERE state = 'sending'");
}

export async function getOutboxSummary(db: SQLiteDatabase, tenantId: string | null): Promise<OutboxSummary> {
  const queued = tenantId
    ? await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM hovin_outbox WHERE tenant_id = ?', tenantId)
    : await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM hovin_outbox');
  const lastSync = await db.getFirstAsync<{ state_value: string }>("SELECT state_value FROM hovin_device_state WHERE state_key = 'last_successful_sync_at'");
  const parsed = lastSync ? Number(lastSync.state_value) : NaN;
  return { queued: queued?.total ?? 0, lastSyncAt: Number.isFinite(parsed) ? parsed : null };
}

export async function recordSuccessfulSync(db: SQLiteDatabase): Promise<void> {
  await db.runAsync(
    "INSERT OR REPLACE INTO hovin_device_state(state_key, state_value) VALUES ('last_successful_sync_at', ?)",
    String(Date.now()),
  );
}

export async function enqueueGrn(db: SQLiteDatabase, tenantId: string, id: string, payload: unknown): Promise<void> {
  if (!tenantId || !id) throw new Error('Tenant and stable GRN ID are required');
  const json = JSON.stringify(payload);
  await db.withExclusiveTransactionAsync(async tx => {
    // `id` is the client idempotency key, but legacy installs use it as the
    // table primary key. Never let a same-id row from another tenant be
    // silently swallowed by INSERT OR IGNORE.
    const existing = await tx.getFirstAsync<{ tenant_id: string }>(
      'SELECT tenant_id FROM hovin_outbox WHERE id = ?',
      id,
    );
    if (existing && existing.tenant_id !== tenantId) {
      throw new Error('GRN ID already belongs to another tenant');
    }
    await tx.runAsync(
      'INSERT OR IGNORE INTO hovin_outbox(id, tenant_id, kind, payload) VALUES (?, ?, ?, ?)',
      id, tenantId, 'GRN', json,
    );
  });
}

/** Caller must supply authenticated tenant-scoped transport and server-side deduplication. */
export async function flushGrns(
  db: SQLiteDatabase,
  tenantId: string,
  send: (item: OutboxItem, idempotencyKey: string) => Promise<void>,
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  const rows = await db.getAllAsync<{
    id: string; tenant_id: string; kind: 'GRN'; payload: string; attempts: number;
  }>('SELECT id, tenant_id, kind, payload, attempts FROM hovin_outbox WHERE tenant_id = ? AND state = ? ORDER BY created_at LIMIT 50', tenantId, 'pending');
  for (const row of rows) {
    let claimed = false;
    await db.withExclusiveTransactionAsync(async tx => {
      const result = await tx.runAsync(
        "UPDATE hovin_outbox SET state = 'sending', attempts = attempts + 1 WHERE id = ? AND tenant_id = ? AND state = 'pending'",
        row.id, tenantId,
      );
      claimed = result.changes === 1;
    });
    if (!claimed) continue;
    try {
      await send({ id: row.id, tenantId, kind: row.kind, payload: row.payload, attempts: row.attempts + 1 }, row.id);
      await db.withExclusiveTransactionAsync(async tx => {
        await tx.runAsync('DELETE FROM hovin_outbox WHERE id = ? AND tenant_id = ?', row.id, tenantId);
      });
      sent++;
    } catch {
      await db.runAsync("UPDATE hovin_outbox SET state = 'pending' WHERE id = ? AND tenant_id = ?", row.id, tenantId);
      failed++;
    }
  }
  return { sent, failed };
}
