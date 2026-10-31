import { beforeEach, describe, expect, it, vi } from "vitest";

const PermissionDeniedError = vi.hoisted(() => class PermissionDeniedError extends Error {});
const m = vi.hoisted(() => ({
  actor: vi.fn(),
  supplier: vi.fn(),
  update: vi.fn(),
  audit: vi.fn(),
  permission: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: m.audit }));
vi.mock("@/lib/auth/rbac", () => ({ requirePermission: m.permission, PermissionDeniedError }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    supplier: { findFirst: m.supplier, update: m.update },
    $transaction: m.transaction,
  },
}));

import { POST as consentPost, GET as consentGet } from "@/app/api/v2/supplier/price-feed/consent/route";

const actor = { id: "supplier-user", tenantId: "tenant", platformRole: "SUPPLIER", supplierId: "supplier-1" };

function request(body: unknown) {
  return new Request("https://hotelsvendors.com/api/v2/supplier/price-feed/consent", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("supplier price-feed consent boundaries", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue(actor);
    m.audit.mockResolvedValue({});
    m.permission.mockResolvedValue(undefined);
    m.transaction.mockImplementation((fn: any) => fn({ supplier: { update: m.update } }));
    m.supplier.mockResolvedValue({ id: "supplier-1", priceFeedConsentStatus: "NOT_REQUESTED" });
    m.update.mockResolvedValue({ id: "supplier-1", priceFeedConsentStatus: "GRANTED", priceFeedSlaLevel: "STANDARD" });
  });

  it("rejects unauthenticated supplier", async () => {
    m.actor.mockResolvedValue(null);
    const response = await consentPost(request({ optIn: true }));
    expect(response.status).toBe(401);
    expect(m.supplier).not.toHaveBeenCalled();
  });

  it("rejects non-supplier role", async () => {
    m.actor.mockResolvedValue({ ...actor, platformRole: "HOTEL", supplierId: null });
    const response = await consentPost(request({ optIn: true }));
    expect(response.status).toBe(403);
    expect(m.supplier).not.toHaveBeenCalled();
  });

  it("requires price:feed:write permission", async () => {
    m.permission.mockRejectedValue(new PermissionDeniedError("denied"));
    const response = await consentPost(request({ optIn: true }));
    expect(response.status).toBe(403);
    expect(m.supplier).not.toHaveBeenCalled();
  });

  it("rejects when supplier record is missing", async () => {
    m.supplier.mockResolvedValue(null);
    const response = await consentPost(request({ optIn: true }));
    expect(response.status).toBe(404);
    expect(m.update).not.toHaveBeenCalled();
  });

  it("grants consent and audits", async () => {
    const response = await consentPost(request({ optIn: true, slaLevel: "PRIORITY" }));
    expect(response.status).toBe(200);
    expect(m.update.mock.calls[0][0].data).toMatchObject({
      priceFeedConsentStatus: "GRANTED",
      priceFeedSlaLevel: "PRIORITY",
    });
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ entityName: "SUPPLIER", actionType: "PRICE_FEED_CONSENT_GRANTED" }), expect.anything());
  });

  it("revokes consent when optIn is false", async () => {
    const response = await consentPost(request({ optIn: false }));
    expect(response.status).toBe(200);
    expect(m.update.mock.calls[0][0].data).toMatchObject({
      priceFeedConsentStatus: "REVOKED",
      priceFeedSlaLevel: null,
    });
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ actionType: "PRICE_FEED_CONSENT_REVOKED" }), expect.anything());
  });

  it("GET requires price:feed:read permission", async () => {
    m.permission.mockRejectedValue(new PermissionDeniedError("denied"));
    const response = await consentGet();
    expect(response.status).toBe(403);
    expect(m.supplier).not.toHaveBeenCalled();
  });

  it("GET returns supplier consent status", async () => {
    m.supplier.mockResolvedValue({ id: "s1", priceFeedConsentStatus: "GRANTED", priceFeedSlaLevel: "PRIORITY" });
    const response = await consentGet();
    expect(response.status).toBe(200);
    expect(m.supplier).toHaveBeenCalledWith({ where: { id: "supplier-1", tenantId: "tenant", deletedAt: null }, select: expect.any(Object) });
  });
});
