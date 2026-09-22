/**
 * Idempotency Engine (G10 — double-entry safeguards for monetary mutations)
 */

const idempotencyStore = new Map<string, { result: any; timestamp: number }>();

export function checkIdempotency(key: string): { exists: boolean; result?: any } {
  const entry = idempotencyStore.get(key);
  if (entry && Date.now() - entry.timestamp < 24 * 60 * 60 * 1000) {
    return { exists: true, result: entry.result };
  }
  return { exists: false };
}

export function storeIdempotency(key: string, result: any) {
  idempotencyStore.set(key, { result, timestamp: Date.now() });
}
