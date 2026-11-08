import { beforeEach, describe, expect, it, vi } from "vitest";

const PermissionDeniedError = vi.hoisted(() => class PermissionDeniedError extends Error {});
const m = vi.hoisted(() => ({
  actor: vi.fn(),
  order: vi.fn(),
  permission: vi.fn(),
  transaction: vi.fn(),
  updateMany: vi.fn(),
  audit: vi.fn(),
  ledger: vi.fn(),
  authority: vi.fn(),
  persist: vi.fn(),
  dispatch: vi.fn(),
}));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/auth/rbac", () => ({ requirePermission: m.permission, PermissionDeniedError }));
vi.mock("@/lib/auth/v2-authority", () => ({ evaluateV2Authority: m.authority }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: m.audit }));
vi.mock("@/lib/procurement/network-transaction-ledger", () => ({ appendNetworkTransactionEvent: m.ledger }));
vi.mock("@/lib/admin/managed-hotel-tenants", () => ({ managedHotelTenants: vi.fn() }));
vi.mock("@/lib/logistics/eta-compliance", () => ({ classifyEtaCompliance: vi.fn() }));
vi.mock("@/lib/procurement/release-outbox", () => ({
  persistReleaseIntent: m.persist,
  dispatchReleaseIntent: m.dispatch,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { order: { findFirst: m.order }, $transaction: m.transaction },
}));

import { PATCH } from "@/app/api/v2/orders/route";

const tx = { order: { updateMany: m.updateMany } };

function patch(status: string) {
  return PATCH(new Request("https://hotelsvendors.com/api/v2/orders", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: "order-a", status }),
  }));
}

describe("binding release outbox intent (MASTER-RELEASE-001 / QA-003 / TST-SEC-011)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.permission.mockResolvedValue(undefined);
    m.audit.mockResolvedValue({});
    m.ledger.mockResolvedValue({});
    m.authority.mockAllowed = undefined;
    m.transaction.mockImplementation((fn: any) => fn(tx));
    m.updateMany.mockResolvedValue({ count: 1 });
    m.persist.mockResolvedValue({ id: "intent-1" });
    m.dispatch.mockResolvedValue(true);
  });

  it("persists the notification intent inside the release transaction and dispatches after commit", async () => {
    m.actor.mockResolvedValue({ id: "supplier-user", tenantId: "supplier-tenant", supplierId: "supplier-a", platformRole: "SUPPLIER", role: "CLERK" });
    m.order.mockResolvedValue({ id: "order-a", tenantId: "hotel-a", supplierId: "supplier-a", status: "APPROVED", paymentGuaranteed: true, requesterId: "buyer-1", approvalPolicySnapshot: null, approvals: [] });

    const response = await patch("CONFIRMED");

    expect(response.status).toBe(200);
    expect(m.persist).toHaveBeenCalledTimes(1);
    // Same transaction client as the status change + audit + ledger writes.
    expect(m.persist.mock.calls[0][0]).toBe(tx);
    expect(m.persist.mock.calls[0][1]).toMatchObject({
      tenantId: "hotel-a",
      userId: "buyer-1",
      orderId: "order-a",
      channel: "IN_APP",
    });
    // Dispatch happens only after the transaction resolved.
    expect(m.dispatch).toHaveBeenCalledTimes(1);
    expect(m.dispatch).toHaveBeenCalledWith(expect.anything(), "intent-1");
  });

  it("does not persist or dispatch a release intent on internal PENDING_APPROVAL states", async () => {
    m.actor.mockResolvedValue({ id: "buyer-user", tenantId: "hotel-a", platformRole: "HOTEL", role: "GM" });
    m.order.mockResolvedValue({ id: "order-a", tenantId: "hotel-a", supplierId: "supplier-a", status: "PENDING_APPROVAL", paymentGuaranteed: true, requesterId: "buyer-1", approvalPolicySnapshot: null, approvals: [] });
    m.authority.mockResolvedValue({ allowed: true });

    const response = await patch("APPROVED");

    expect(response.status).toBe(200);
    expect(m.persist).not.toHaveBeenCalled();
    expect(m.dispatch).not.toHaveBeenCalled();
  });

  it("leaves no dispatchable intent when the release transaction does not commit", async () => {
    m.actor.mockResolvedValue({ id: "supplier-user", tenantId: "supplier-tenant", supplierId: "supplier-a", platformRole: "SUPPLIER", role: "CLERK" });
    m.order.mockResolvedValue({ id: "order-a", tenantId: "hotel-a", supplierId: "supplier-a", status: "APPROVED", paymentGuaranteed: true, requesterId: "buyer-1", approvalPolicySnapshot: null, approvals: [] });
    m.updateMany.mockResolvedValue({ count: 0 });

    const response = await patch("CONFIRMED");

    expect(response.status).toBe(409);
    expect(m.persist).not.toHaveBeenCalled();
    expect(m.dispatch).not.toHaveBeenCalled();
  });
});
