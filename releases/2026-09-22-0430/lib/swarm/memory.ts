/**
 * Swarm Shared-Memory layer.
 *
 * TENANT-ISOLATED by design: every entry is keyed under a tenantId. Cross-tenant
 * access is impossible (lookups are always scoped), and unscoped access (missing
 * or empty tenantId) is REJECTED — it never falls back to a shared bucket.
 *
 * Backs the agent control plane at runtime and is the unit under test for tenant
 * isolation. Implemented as an in-memory store; callers can swap in a durable
 * backend (Prisma + Redis hot cache) without changing the public API.
 */

type MemoryValue = Record<string, unknown> | string | number | boolean | null;

interface MemoryEntry {
  key: string;
  value: MemoryValue;
  createdAt: number;
}

/** Legacy single-object form (SwarmMemory-model shaped). Requires tenantId. */
export interface MemoryRecord {
  tenantId: string;
  namespace?: string;
  key?: string;
  value?: MemoryValue;
  // SwarmMemory-model fields (legacy callers)
  agentId?: string;
  agentName?: string;
  content?: string;
  memoryType?: string;
  category?: string;
  metadata?: Record<string, unknown> | null;
}

// storeMap: tenantId -> (namespace -> Map(key -> entry))
const storeMap = new Map<string, Map<string, Map<string, MemoryEntry>>>();

function requireTenantId(tenantId: string): void {
  if (typeof tenantId !== "string" || tenantId.trim() === "") {
    throw new Error("tenantId is required — unscoped access is not allowed");
  }
}

function namespaceFor(tenantId: string): Map<string, Map<string, MemoryEntry>> {
  let tenant = storeMap.get(tenantId);
  if (!tenant) {
    tenant = new Map<string, Map<string, MemoryEntry>>();
    storeMap.set(tenantId, tenant);
  }
  return tenant;
}

/**
 * Store a value under (tenantId, namespace, key). Throws if tenantId is empty.
 * Also supports the legacy single-object form (memoryRecord) which requires
 * `tenantId` and derives namespace/key from category/agentId when not provided.
 */
export async function storeMemory(
  tenantId: string,
  namespace: string,
  key: string,
  value: MemoryValue
): Promise<void>;
export async function storeMemory(record: MemoryRecord): Promise<void>;
export async function storeMemory(
  arg1: string | MemoryRecord,
  namespace?: string,
  key?: string,
  value?: MemoryValue
): Promise<void> {
  let tenantId: string;
  let ns: string;
  let k: string;
  let v: MemoryValue;

  if (typeof arg1 === "string") {
    tenantId = arg1;
    requireTenantId(tenantId);
    ns = namespace ?? "default";
    k = key ?? "";
    v = value ?? null;
  } else {
    const rec = arg1;
    tenantId = rec.tenantId;
    requireTenantId(tenantId);
    ns = rec.namespace || rec.category || "default";
    k = rec.key || rec.agentId || "record";
    v = rec.value ?? (rec.content as MemoryValue) ?? null;
  }

  const tenant = namespaceFor(tenantId);
  let bucket = tenant.get(ns);
  if (!bucket) {
    bucket = new Map<string, MemoryEntry>();
    tenant.set(ns, bucket);
  }
  bucket.set(k, { key: k, value: v, createdAt: Date.now() });
}

/**
 * Retrieve a single value by (tenantId, namespace, key). Returns null when the
 * key does not exist for THIS tenant (never another tenant's data). Throws if
 * tenantId is empty.
 */
export async function retrieveMemory<T = MemoryValue>(
  tenantId: string,
  namespace: string,
  key: string
): Promise<T | null> {
  requireTenantId(tenantId);
  const entry = storeMap.get(tenantId)?.get(namespace)?.get(key);
  if (!entry) return null;
  return entry.value as T;
}

/**
 * List all entries under (tenantId, namespace), scoped to that tenant only.
 * Each item exposes `{ key, value }`. Throws if tenantId is empty.
 */
export async function listMemory<T = MemoryValue>(
  tenantId: string,
  namespace: string
): Promise<Array<{ key: string; value: T }>> {
  requireTenantId(tenantId);
  const ns = storeMap.get(tenantId)?.get(namespace);
  if (!ns) return [];
  return Array.from(ns.values()).map((e) => ({ key: e.key, value: e.value as T }));
}

/**
 * Remove every entry belonging to a single tenant (all namespaces/keys).
 * Returns the number of entries removed. Never touches other tenants.
 */
export async function clearTenantMemory(tenantId: string): Promise<number> {
  requireTenantId(tenantId);
  const tenant = storeMap.get(tenantId);
  if (!tenant) return 0;

  let count = 0;
  for (const ns of tenant.values()) count += ns.size;
  storeMap.delete(tenantId);
  return count;
}

/** Reset the whole in-memory store. Primarily for tests; safe in non-prod. */
export function _resetMemory(): void {
  storeMap.clear();
}