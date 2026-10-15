import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { $queryRaw: m.query } }));

import { GET } from "@/app/api/health/route";

describe("production health readiness", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.HV_RELEASE_ID = "github-test-release";
    process.env.HV_SOURCE_SHA = "test-release";
    process.env.NODE_ENV = "test";
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_live_test";
    process.env.CLERK_SECRET_KEY = "sk_live_test";
  });

  it("does not report ready until the configured database answers", async () => {
    m.query.mockResolvedValue([{ user: "User", product: "Product", rfq: "RfqRequest", quote: "ProcurementQuote", order: "Order", goodsReceipt: "GoodsReceiptNote", evidence: "EvidenceRecord", audit: "AuditLog" }]);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, database: "ready", authorization: "configured", releaseId: "github-test-release", sourceCommit: "test-release" });
  });

  it("fails closed when the configured database is unavailable", async () => {
    m.query.mockRejectedValue(new Error("connection refused"));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, database: "unavailable" });
  });

  it("fails closed when a required procurement relation is missing", async () => {
    m.query.mockResolvedValue([{ user: "User", product: "Product", rfq: "RfqRequest", quote: "ProcurementQuote", order: "Order", goodsReceipt: null, evidence: "EvidenceRecord", audit: "AuditLog" }]);
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, database: "unavailable" });
  });

  it("fails closed before querying the database when production authorization is absent", async () => {
    delete process.env.CLERK_SECRET_KEY;
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, authorization: "unavailable" });
    expect(m.query).not.toHaveBeenCalled();
  });

  it("requires live Clerk credentials when running as production", async () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_not_accepted";
    process.env.CLERK_SECRET_KEY = "sk_test_not_accepted";
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, authorization: "unavailable" });
    expect(m.query).not.toHaveBeenCalled();
  });
});
