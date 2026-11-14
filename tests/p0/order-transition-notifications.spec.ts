import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Order lifecycle → unified notification wiring.
 *
 * Proves that every order transition produces a durable, tenant-scoped
 * notification, that the hotel requester is always notified, that the supplier
 * is in-app only (never external before final release), and that a
 * notification failure cannot roll back the commercial state.
 */

const m = vi.hoisted(() => ({
  notify: vi.fn(),
  userFindMany: vi.fn(),
  auditLogCreate: vi.fn(),
}));

vi.mock("@/lib/notifications/service", () => ({
  notify: m.notify,
  NOTIFICATION_TYPES: ["ORDER_UPDATE", "INVOICE_ISSUED", "PAYMENT_DUE", "DISPUTE_OPEN", "OLIV_STATUS", "KYC_REQUIRED", "SYSTEM", "SUPPORT_TICKET"],
  NOTIFICATION_CHANNELS: ["EMAIL", "SMS", "WHATSAPP", "IN_APP"],
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: m.userFindMany },
    auditLog: { create: m.auditLogCreate },
  },
}));

const { notifyOrderTransition } = await import("../../lib/orders/notify");

const base = {
  orderId: "order-1",
  tenantId: "tenant-1",
  requesterId: "user-hotel",
  supplierId: "supplier-1",
  orderNumber: "HV-TEST-001",
  from: "APPROVED",
  to: "CONFIRMED",
  actorId: "user-supplier",
  actorRole: "SUPPLIER",
  allowExternal: false,
};

describe("order transition notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.notify.mockResolvedValue({ notificationId: "n1", delivered: true, channel: "IN_APP" });
    m.userFindMany.mockResolvedValue([{ id: "user-supplier-1" }, { id: "user-supplier-2" }]);
    m.auditLogCreate.mockResolvedValue({});
  });

  it("always notifies the hotel requester", async () => {
    await notifyOrderTransition(base);
    const hotelCall = m.notify.mock.calls.find((c) => c[0].userId === "user-hotel");
    expect(hotelCall).toBeTruthy();
    expect(hotelCall![0].tenantId).toBe("tenant-1");
    expect(hotelCall![0].entityId).toBe("order-1");
  });

  it("never sends external supplier notifications before final release", async () => {
    await notifyOrderTransition({ ...base, allowExternal: false });
    for (const call of m.notify.mock.calls.filter((c) => c[0].userId !== "user-hotel")) {
      expect(call[0].channel).toBe("IN_APP");
      expect(call[0].suppressExternal).toBe(true);
    }
  });

  it("notifies every supplier user in the tenant", async () => {
    await notifyOrderTransition(base);
    const supplierCalls = m.notify.mock.calls.filter((c) => c[0].userId !== "user-hotel");
    expect(supplierCalls).toHaveLength(2);
  });

  it("scopes supplier lookup to the order's tenant", async () => {
    await notifyOrderTransition(base);
    expect(m.userFindMany.mock.calls[0][0].where).toMatchObject({ tenantId: "tenant-1", supplierId: "supplier-1" });
  });

  it("uses IN_APP for the hotel when external delivery is not permitted", async () => {
    await notifyOrderTransition({ ...base, allowExternal: false });
    const hotelCall = m.notify.mock.calls.find((c) => c[0].userId === "user-hotel");
    expect(hotelCall![0].channel).toBe("IN_APP");
  });

  it("allows email for the hotel only when external delivery is permitted", async () => {
    await notifyOrderTransition({ ...base, allowExternal: true });
    const hotelCall = m.notify.mock.calls.find((c) => c[0].userId === "user-hotel");
    expect(hotelCall![0].channel).toBe("EMAIL");
    expect(hotelCall![0].suppressExternal).toBe(false);
  });

  it("writes a dispute notification for DISPUTED transitions", async () => {
    await notifyOrderTransition({ ...base, to: "DISPUTED", from: "DELIVERED" });
    expect(m.notify.mock.calls[0][0].type).toBe("DISPUTE_OPEN");
  });

  it("uses ORDER_UPDATE for fulfilment transitions", async () => {
    for (const to of ["APPROVED", "CONFIRMED", "IN_TRANSIT", "PARTIALLY_DELIVERED", "DELIVERED"]) {
      vi.clearAllMocks();
      m.notify.mockResolvedValue({ notificationId: "n1", delivered: true, channel: "IN_APP" });
      await notifyOrderTransition({ ...base, to });
      expect(m.notify.mock.calls[0][0].type).toBe("ORDER_UPDATE");
    }
  });

  it("survives a notification failure without throwing", async () => {
    m.notify.mockRejectedValue(new Error("queue down"));
    await expect(notifyOrderTransition(base)).resolves.toBeUndefined();
  });

  it("records an audit entry stating supplier external delivery is off", async () => {
    await notifyOrderTransition(base);
    const changes = m.auditLogCreate.mock.calls[0][0].data.changes;
    expect(changes.supplierExternal).toBe(false);
    expect(changes.externalAllowed).toBe(false);
    expect(changes.to).toBe("CONFIRMED");
  });
});
