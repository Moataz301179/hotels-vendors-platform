import { beforeEach, describe, expect, it, vi } from "vitest";

const PermissionDeniedError = vi.hoisted(() => class PermissionDeniedError extends Error {});
const PaymentGuaranteeTransitionError = vi.hoisted(() => class PaymentGuaranteeTransitionError extends Error {});
const m = vi.hoisted(() => ({ actor: vi.fn(), permission: vi.fn(), order: vi.fn(), targetTenant: vi.fn(), recordGuarantee: vi.fn() }));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/auth/rbac", () => ({ requirePermission: m.permission, PermissionDeniedError }));
vi.mock("@/lib/auth/authority-matrix", () => ({ PaymentGuaranteeTransitionError, setPaymentGuarantee: m.recordGuarantee }));
vi.mock("@/lib/admin/managed-hotel-tenants", () => ({ managedHotelTenant: m.targetTenant }));
vi.mock("@/lib/prisma", () => ({ prisma: { order: { findFirst: m.order } } }));

import { POST } from "@/app/api/v2/orders/guarantee/route";

const request = (body: object = { orderId: "order-a", method: "DIRECT", etaValidated: false, tenantId: "hotel-a" }) => new Request("https://hotelsvendors.com/api/v2/orders/guarantee", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

describe("payment guarantee verification boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: "hotel-gm", tenantId: "hotel-a", platformRole: "HOTEL", role: "GM" });
    m.permission.mockResolvedValue(undefined);
    m.order.mockResolvedValue({ id: "order-a", paymentGuaranteed: false, status: "PENDING_APPROVAL" });
    m.targetTenant.mockResolvedValue({ id: "hotel-a" });
    m.recordGuarantee.mockResolvedValue(undefined);
  });

  it("rejects a hotel user attempting to self-certify a payment guarantee", async () => {
    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "PAYMENT_GUARANTEE_VERIFICATION_REQUIRED" });
    expect(m.order).not.toHaveBeenCalled();
    expect(m.recordGuarantee).not.toHaveBeenCalled();
  });

  it("rejects guarantee verification after the approval stage has passed", async () => {
    m.actor.mockResolvedValue({ id: "platform-admin", tenantId: "hotel-a", platformRole: "ADMIN", role: "ADMIN" });
    m.order.mockResolvedValue({ id: "order-a", paymentGuaranteed: false, status: "DELIVERED" });

    const response = await POST(request());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "ORDER_NOT_PENDING_APPROVAL" });
    expect(m.recordGuarantee).not.toHaveBeenCalled();
  });

  it("records a platform-verified guarantee against the explicitly selected hotel tenant", async () => {
    m.actor.mockResolvedValue({ id: "platform-admin", tenantId: "platform-tenant", platformRole: "ADMIN", role: "OWNER" });

    const response = await POST(request({ orderId: "order-a", method: "DIRECT", etaValidated: false, tenantId: "hotel-a" }));

    expect(response.status).toBe(201);
    expect(m.order).toHaveBeenCalledWith({ where: { id: "order-a", tenantId: "hotel-a", deletedAt: null }, select: { id: true, paymentGuaranteed: true, status: true } });
    expect(m.recordGuarantee).toHaveBeenCalledWith(expect.objectContaining({ orderId: "order-a", tenantId: "hotel-a", verifiedBy: "platform-admin" }));
  });

  it("does not claim a guarantee when the pending-approval state changed during verification", async () => {
    m.actor.mockResolvedValue({ id: "platform-admin", tenantId: "platform-tenant", platformRole: "ADMIN", role: "OWNER" });
    m.recordGuarantee.mockRejectedValue(new PaymentGuaranteeTransitionError());

    const response = await POST(request());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "ORDER_NOT_PENDING_APPROVAL" });
  });
});
