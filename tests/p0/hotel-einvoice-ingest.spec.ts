import { beforeEach, describe, expect, it, vi } from "vitest";

const PermissionDeniedError = vi.hoisted(() => class PermissionDeniedError extends Error {});
const m = vi.hoisted(() => ({
  actor: vi.fn(),
  hotel: vi.fn(),
  consent: vi.fn(),
  importCreate: vi.fn(),
  importList: vi.fn(),
  audit: vi.fn(),
  permission: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: m.audit }));
vi.mock("@/lib/auth/rbac", () => ({ requirePermission: m.permission, PermissionDeniedError }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    hotel: { findFirst: m.hotel },
    consentRecord: { findFirst: m.consent },
    hotelEInvoiceImport: { findMany: m.importList, create: m.importCreate },
    $transaction: m.transaction,
  },
}));

import { POST as ingestPost, GET as ingestGet } from "@/app/api/v2/hotel/e-invoices/ingest/route";

const actor = { id: "buyer", tenantId: "tenant", platformRole: "HOTEL", role: "DEPARTMENT_HEAD" };

function request(body: unknown) {
  return new Request("https://hotelsvendors.com/api/v2/hotel/e-invoices/ingest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const payloadSummary = { contentDigest: "a".repeat(64), documentCount: 1 };

describe("hotel e-invoice ingestion boundaries", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue(actor);
    m.audit.mockResolvedValue({});
    m.permission.mockResolvedValue(undefined);
    m.transaction.mockImplementation((fn: any) => fn({ hotelEInvoiceImport: { create: m.importCreate } }));
    m.hotel.mockResolvedValue({ id: "hotel-1", status: "ACTIVE" });
    m.consent.mockResolvedValue({ id: "consent-1" });
    m.importCreate.mockResolvedValue({ id: "import-1", tenantId: "tenant", hotelId: "hotel-1" });
    m.importList.mockResolvedValue([]);
  });

  it("rejects unauthenticated ingestion", async () => {
    m.actor.mockResolvedValue(null);
    const response = await ingestPost(request({ hotelId: "h", sourceType: "API", sourceReference: "ref", payloadSummary }));
    expect(response.status).toBe(401);
    expect(m.hotel).not.toHaveBeenCalled();
  });

  it("requires einvoice:ingest permission", async () => {
    m.permission.mockRejectedValue(new PermissionDeniedError("denied"));
    const response = await ingestPost(request({ hotelId: "h", sourceType: "API", sourceReference: "ref", payloadSummary }));
    expect(response.status).toBe(403);
    expect(m.hotel).not.toHaveBeenCalled();
  });

  it("rejects ingestion when consent is missing", async () => {
    m.consent.mockResolvedValue(null);
    const response = await ingestPost(request({ hotelId: "hotel-1", sourceType: "API", sourceReference: "ref", payloadSummary }));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "CONSENT_REQUIRED", message: expect.any(String) });
    expect(m.importCreate).not.toHaveBeenCalled();
  });

  it("creates an import record for an active hotel with valid consent", async () => {
    const response = await ingestPost(request({ hotelId: "hotel-1", sourceType: "API", sourceReference: "ref-1", payloadSummary, recordCount: 1 }));
    expect(response.status).toBe(201);
    expect(m.importCreate.mock.calls[0][0].data).toMatchObject({
      tenantId: "tenant",
      hotelId: "hotel-1",
      sourceType: "API",
      sourceReference: "ref-1",
      recordCount: 1,
      status: "PENDING",
      payloadSummary,
    });
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ entityName: "HOTEL_EINVOICE_IMPORT", actionType: "CREATED" }), expect.anything());
  });

  it("lists hotel imports tenant-scoped", async () => {
    m.importList.mockResolvedValue([{ id: "import-1", hotelId: "hotel-1" }]);
    const response = await ingestGet();
    expect(response.status).toBe(200);
    expect(m.importList.mock.calls[0][0].where).toMatchObject({ tenantId: "tenant", hotelId: "hotel-1" });
  });
});
