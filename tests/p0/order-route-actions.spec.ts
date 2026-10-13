import { beforeEach, describe, expect, it, vi } from "vitest";

const PermissionDeniedError = vi.hoisted(() => class PermissionDeniedError extends Error {});
const m = vi.hoisted(() => ({ actor: vi.fn(), order: vi.fn(), permission: vi.fn(), transaction: vi.fn() }));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/auth/rbac", () => ({ requirePermission: m.permission, PermissionDeniedError }));
vi.mock("@/lib/auth/v2-authority", () => ({ evaluateV2Authority: vi.fn() }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { order: { findFirst: m.order }, $transaction: m.transaction } }));

import { PATCH } from "@/app/api/v2/orders/route";

describe("order action boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: "receiver-a", tenantId: "hotel-a", platformRole: "HOTEL", role: "RECEIVING_CLERK" });
    m.order.mockResolvedValue({ id: "order-a", tenantId: "hotel-a", supplierId: "supplier-a", status: "IN_TRANSIT", paymentGuaranteed: true, approvalPolicySnapshot: null, approvals: [] });
    m.permission.mockResolvedValue(undefined);
  });

  it("directs receive actions to the GRN endpoint instead of persisting a non-status", async () => {
    const response = await PATCH(new Request("https://hotelsvendors.com/api/v2/orders", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "order-a", status: "RECEIVE" }),
    }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "GRN_RECEIPT_REQUIRED" });
    expect(m.transaction).not.toHaveBeenCalled();
  });
});
