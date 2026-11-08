import { beforeEach, describe, expect, it, vi } from "vitest";

const PermissionDeniedError = vi.hoisted(() => class PermissionDeniedError extends Error {});
const m = vi.hoisted(() => ({
  actor: vi.fn(),
  order: vi.fn(),
  invoice: vi.fn(),
  permission: vi.fn(),
  transaction: vi.fn(),
  updateMany: vi.fn(),
  audit: vi.fn(),
  ledger: vi.fn(),
  persist: vi.fn(),
  dispatch: vi.fn(),
}));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/auth/rbac", () => ({ requirePermission: m.permission, PermissionDeniedError }));
vi.mock("@/lib/auth/v2-authority", () => ({ evaluateV2Authority: vi.fn() }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: m.audit }));
vi.mock("@/lib/procurement/network-transaction-ledger", () => ({ appendNetworkTransactionEvent: m.ledger }));
vi.mock("@/lib/admin/managed-hotel-tenants", () => ({ managedHotelTenants: vi.fn() }));
vi.mock("@/lib/logistics/eta-compliance", () => ({ classifyEtaCompliance: vi.fn() }));
vi.mock("@/lib/procurement/release-outbox", () => ({
  persistReleaseIntent: m.persist,
  dispatchReleaseIntent: m.dispatch,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { order: { findFirst: m.order }, invoice: { findFirst: m.invoice }, $transaction: m.transaction },
}));

import { PATCH } from "@/app/api/v2/orders/route";

const tx = { order: { updateMany: m.updateMany } };
const futureDelivery = new Date(Date.now() + 86_400_000).toISOString();

function patch(status: string) {
  return PATCH(new Request("https://hotelsvendors.com/api/v2/orders", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: "order-a", status, estimatedDelivery: futureDelivery }),
  }));
}

describe("order ETA clearance gate (UX-004 / QA-003 / state-machine gates)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.permission.mockResolvedValue(undefined);
    m.audit.mockResolvedValue({});
    m.ledger.mockResolvedValue({});
    m.transaction.mockImplementation((fn: any) => fn(tx));
    m.updateMany.mockResolvedValue({ count: 1 });
    m.actor.mockResolvedValue({ id: "supplier-user", tenantId: "supplier-tenant", supplierId: "supplier-a", platformRole: "SUPPLIER", role: "CLERK" });
    m.order.mockResolvedValue({ id: "order-a", tenantId: "hotel-a", supplierId: "supplier-a", status: "CONFIRMED", paymentGuaranteed: true, requesterId: "buyer-1", approvalPolicySnapshot: null, approvals: [] });
  });

  it("blocks dispatch without an ETA-accepted signed invoice", async () => {
    m.invoice.mockResolvedValue(null);

    const response = await patch("IN_TRANSIT");

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "ETA_CLEARANCE_REQUIRED", message: expect.any(String) });
    expect(m.transaction).not.toHaveBeenCalled();
  });

  it("scopes the ETA clearance lookup to the order and tenant", async () => {
    m.invoice.mockResolvedValue(null);
    await patch("IN_TRANSIT");
    expect(m.invoice.mock.calls[0][0].where).toMatchObject({
      orderId: "order-a",
      tenantId: "hotel-a",
      etaStatus: "ACCEPTED",
      deletedAt: null,
    });
  });

  it("allows dispatch once an ETA-accepted signed invoice exists", async () => {
    m.invoice.mockResolvedValue({ id: "invoice-1" });

    const response = await patch("IN_TRANSIT");

    expect(response.status).toBe(200);
    expect(m.transaction).toHaveBeenCalledTimes(1);
  });
});
