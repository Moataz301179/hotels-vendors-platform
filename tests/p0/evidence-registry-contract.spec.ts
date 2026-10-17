import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({
  actor: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  transaction: vi.fn(),
  audit: vi.fn(),
}));

vi.mock("@/lib/v2-auth", () => ({ getActor: mock.actor }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: mock.audit }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    evidenceRecord: { findMany: mock.findMany, count: mock.count },
    $transaction: mock.transaction,
  },
}));

import { GET, POST } from "@/app/api/v2/evidence/route";

const actor = { id: "user-1", tenantId: "tenant-a", platformRole: "HOTEL" };

describe("evidence registry contract", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mock.actor.mockResolvedValue(actor);
    mock.findMany.mockResolvedValue([]);
    mock.count.mockResolvedValueOnce(4).mockResolvedValueOnce(1).mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    mock.create.mockResolvedValue({ id: "evidence-1", status: "EXTRACTED" });
    mock.transaction.mockImplementation((callback: (transaction: { evidenceRecord: { create: typeof mock.create } }) => Promise<unknown>) => callback({ evidenceRecord: { create: mock.create } }));
    mock.audit.mockResolvedValue("audit-1");
  });

  it("returns a tenant-scoped evidence ledger and review totals", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(mock.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: "tenant-a", deletedAt: null } }));
    expect(await response.json()).toMatchObject({ summary: { total: 4, pending: 1, extracted: 2, resolved: 1 } });
  });

  it("requires a source reference before accepting an observation", async () => {
    const response = await POST(new Request("https://example.test/api/v2/evidence", { method: "POST", body: JSON.stringify({ extractedFact: "Observed fact" }) }));
    expect(response.status).toBe(400);
    expect(mock.transaction).not.toHaveBeenCalled();
  });

  it("stores user-provided provenance and an audit entry in one transaction", async () => {
    const response = await POST(new Request("https://example.test/api/v2/evidence", {
      method: "POST",
      body: JSON.stringify({ sourceUrl: "https://supplier.example/catalogue", extractedFact: "Supplier publishes a 5L pack." }),
    }));
    expect(response.status).toBe(201);
    expect(mock.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ tenantId: "tenant-a", provenanceClass: "USER_PROVIDED", status: "EXTRACTED" }) }));
    expect(mock.audit).toHaveBeenCalledWith(expect.objectContaining({ entityName: "EVIDENCE", tenantId: "tenant-a", actorId: "user-1" }), expect.anything());
  });

  it("rejects evidence submission from an unapproved partner role", async () => {
    mock.actor.mockResolvedValue({ ...actor, platformRole: "SHIPPING" });
    const response = await POST(new Request("https://example.test/api/v2/evidence", {
      method: "POST",
      body: JSON.stringify({ sourceReference: "Carrier note", extractedFact: "Observed delivery window." }),
    }));
    expect(response.status).toBe(403);
  });
});
