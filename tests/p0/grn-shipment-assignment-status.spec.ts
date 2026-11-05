import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  actor: vi.fn(),
  permission: vi.fn(),
  transaction: vi.fn(),
  orderFindFirst: vi.fn(),
  shipmentFindFirst: vi.fn(),
}));

vi.mock("@/lib/v2-auth", () => ({ getActor: m.actor }));
vi.mock("@/lib/auth/rbac", () => ({ requirePermission: m.permission, PermissionDeniedError: class PermissionDeniedError extends Error {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: m.transaction,
  },
}));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: vi.fn() }));

import { POST } from "@/app/api/v2/grn/route";

const receiptRequest = (overrides: Record<string, unknown> = {}) =>
  new Request("https://hotelsvendors.com/api/v2/grn", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ orderId: "order-a", lines: [], ...overrides }),
  });

describe("goods receipt shipment-assignment evidence gate", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.actor.mockResolvedValue({ id: "receiver-a", tenantId: "hotel-a", platformRole: "HOTEL", role: "RECEIVING_CLERK" });
    m.permission.mockResolvedValue(undefined);
    m.orderFindFirst.mockResolvedValue({
      id: "order-a",
      tenantId: "hotel-a",
      hotelId: "hotel-a",
      supplierId: "supplier-a",
      paymentGuaranteed: true,
      status: "IN_TRANSIT",
      items: [],
    });
    m.shipmentFindFirst.mockResolvedValue(null);
    m.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        $executeRaw: vi.fn().mockResolvedValue(undefined),
        order: { findFirst: m.orderFindFirst },
        shipment: { findFirst: m.shipmentFindFirst },
      }),
    );
  });

  it("requires the carrier assignment to already be DELIVERED when a shipment is referenced", async () => {
    const response = await POST(receiptRequest({ shipmentId: "shipment-a" }));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "DELIVERED_SHIPMENT_REQUIRED" });
    expect(m.shipmentFindFirst).toHaveBeenCalledWith({
      where: {
        id: "shipment-a",
        deletedAt: null,
        status: "DELIVERED",
        orderIds: { has: "order-a" },
        assignment: { hotelTenantId: "hotel-a", orderId: "order-a", status: "DELIVERED", deletedAt: null },
      },
      select: { id: true },
    });
  });

  it("does not look up a shipment when the receipt does not reference one", async () => {
    m.orderFindFirst.mockResolvedValue({
      id: "order-a",
      tenantId: "hotel-a",
      hotelId: "hotel-a",
      supplierId: "supplier-a",
      paymentGuaranteed: true,
      status: "IN_TRANSIT",
      items: [],
    });

    await POST(receiptRequest());

    expect(m.shipmentFindFirst).not.toHaveBeenCalled();
  });
});
