import { describe, expect, it, vi, beforeEach } from "vitest";

const rows = new Map<string, Record<string, unknown>[]>();

function ensureList() {
  if (!rows.has("hovin_outbox")) rows.set("hovin_outbox", []);
  return rows.get("hovin_outbox")!;
}

const db = {
  execAsync: vi.fn().mockImplementation(async (sql: string) => {
    if (sql.includes("CREATE TABLE IF NOT EXISTS hovin_outbox")) {
      rows.set("hovin_outbox", []);
    }
    // Crash-recovery: reset any row stuck in 'sending' back to 'pending'.
    if (sql.startsWith("UPDATE hovin_outbox SET state = 'pending'")) {
      const list = rows.get("hovin_outbox") ?? [];
      for (const r of list) if (r.state === "sending") r.state = "pending";
    }
  }),
  runAsync: vi.fn().mockImplementation(async (sql: string, ...args: unknown[]) => {
    const list = ensureList();
    if (sql.startsWith("INSERT OR IGNORE")) {
      const [id, tenantId, kind, payload] = args as [string, string, string, string];
      if (!list.some((r) => r.id === id)) {
        list.push({ id, tenant_id: tenantId, kind, payload, attempts: 0, state: "pending" });
      }
      return { changes: 1 };
    }
    if (sql.startsWith("UPDATE hovin_outbox SET state = 'sending'")) {
      const [id, tenantId] = args as [string, string];
      const found = list.find((r) => r.id === id && r.tenant_id === tenantId && r.state === "pending");
      if (found) { found.state = "sending"; found.attempts = (found.attempts as number) + 1; return { changes: 1 }; }
      return { changes: 0 };
    }
    if (sql.startsWith("UPDATE hovin_outbox SET state = 'pending' WHERE id = ? AND tenant_id = ?")) {
      const [id, tenantId] = args as [string, string];
      const found = list.find((r) => r.id === id && r.tenant_id === tenantId);
      if (found) found.state = "pending";
      return { changes: 1 };
    }
    if (sql.startsWith("DELETE FROM hovin_outbox")) {
      const [id, tenantId] = args as [string, string];
      const before = list.length;
      const remaining = list.filter((r) => !(r.id === id && r.tenant_id === tenantId));
      rows.set("hovin_outbox", remaining);
      return { changes: before - remaining.length };
    }
    return { changes: 0 };
  }),
  getAllAsync: vi.fn().mockImplementation(async (sql: string, tenantId: string, state: string) => {
    const list = ensureList();
    return list.filter((r) => r.tenant_id === tenantId && r.state === state).slice(0, 50);
  }),
  withExclusiveTransactionAsync: vi.fn().mockImplementation(async (fn: (tx: typeof db) => Promise<void>) => {
    await fn(db);
  }),
};

vi.mock("expo-sqlite", () => ({ SQLiteDatabase: db as never }));

const { initializeOutbox, enqueueGrn, flushGrns } = await import("./offlineQueue");

beforeEach(() => {
  vi.clearAllMocks();
  rows.clear();
  rows.set("hovin_outbox", []);
});

describe("HOVIN offline GRN outbox", () => {
  it("creates the outbox table on initialize", async () => {
    await initializeOutbox(db as never);
    expect(db.execAsync).toHaveBeenCalled();
    expect(rows.has("hovin_outbox")).toBe(true);
  });

  it("dedupes by stable GRN id", async () => {
    await enqueueGrn(db as never, "tenant-a", "grn-1", { orderId: "o1" });
    await enqueueGrn(db as never, "tenant-a", "grn-1", { orderId: "o1" });
    const list = rows.get("hovin_outbox") ?? [];
    expect(list.filter((r) => r.id === "grn-1")).toHaveLength(1);
  });

  it("flushes successfully and deletes the row", async () => {
    await enqueueGrn(db as never, "tenant-a", "grn-2", { orderId: "o2" });
    const send = vi.fn().mockResolvedValue(undefined);
    const result = await flushGrns(db as never, "tenant-a", send);
    expect(result.sent).toBe(1);
    expect(result.failed).toBe(0);
    expect(send).toHaveBeenCalledTimes(1);
    const list = rows.get("hovin_outbox") ?? [];
    expect(list.filter((r) => r.id === "grn-2")).toHaveLength(0);
  });

  it("flush failure resets the row to pending", async () => {
    await enqueueGrn(db as never, "tenant-a", "grn-3", { orderId: "o3" });
    const send = vi.fn().mockRejectedValue(new Error("network"));
    const result = await flushGrns(db as never, "tenant-a", send);
    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
    const list = rows.get("hovin_outbox") ?? [];
    expect(list.filter((r) => r.id === "grn-3" && r.state === "pending")).toHaveLength(1);
  });

  it("flush is idempotent — a crashed row does not double-send on retry", async () => {
    await enqueueGrn(db as never, "tenant-a", "grn-4", { orderId: "o4" });
    let calls = 0;
    const send = vi.fn().mockImplementation(async () => {
      calls++;
      if (calls === 1) throw new Error("crash");
    });
    await flushGrns(db as never, "tenant-a", send);
    await flushGrns(db as never, "tenant-a", send);
    expect(send).toHaveBeenCalledTimes(2);
    const list = rows.get("hovin_outbox") ?? [];
    expect(list.filter((r) => r.id === "grn-4")).toHaveLength(0);
  });

  it("tenant isolation — flush for tenant B never touches tenant A", async () => {
    await enqueueGrn(db as never, "tenant-a", "grn-a", { orderId: "oa" });
    await enqueueGrn(db as never, "tenant-b", "grn-b", { orderId: "ob" });
    const send = vi.fn().mockResolvedValue(undefined);
    await flushGrns(db as never, "tenant-b", send);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].tenantId).toBe("tenant-b");
    const list = rows.get("hovin_outbox") ?? [];
    expect(list.filter((r) => r.id === "grn-a")).toHaveLength(1);
    expect(list.filter((r) => r.id === "grn-b")).toHaveLength(0);
  });
});