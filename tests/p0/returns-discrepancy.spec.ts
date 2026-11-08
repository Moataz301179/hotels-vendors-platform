import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Returns and discrepancy contract.
 *
 * Proves the last missing segment of the connected procurement journey:
 * a return can only be raised against a delivered order with an accepted
 * receipt, approval issues a credit note for the approved quantity only,
 * a dispute records liability without moving money, and every write is
 * audited and notified.
 */

const m = vi.hoisted(() => ({
  hasPermission: vi.fn(),
  orderFindFirst: vi.fn(),
  grnFindFirst: vi.fn(),
  returnFindFirst: vi.fn(),
  returnCreate: vi.fn(),
  returnUpdate: vi.fn(),
  creditNoteCreate: vi.fn(),
  disputeCreate: vi.fn(),
  returnFindMany: vi.fn(),
  disputeFindMany: vi.fn(),
  transaction: vi.fn(),
  appendAuditEntry: vi.fn(),
  notify: vi.fn(),
}));

vi.mock("@/lib/auth/rbac", () => ({ hasPermission: m.hasPermission }));
vi.mock("@/lib/notifications/service", () => ({ notify: m.notify }));
vi.mock("@/lib/audit/tamper-proof", () => ({ appendAuditEntry: m.appendAuditEntry }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { findFirst: m.orderFindFirst, findUnique: m.orderFindFirst },
    goodsReceiptNote: { findFirst: m.grnFindFirst },
    returnRequest: { findFirst: m.returnFindFirst, create: m.returnCreate, update: m.returnUpdate, findMany: m.returnFindMany },
    creditNote: { create: m.creditNoteCreate },
    dispute: { create: m.disputeCreate, findMany: m.disputeFindMany },
    $transaction: m.transaction,
  },
}));

const { requestReturn, approveReturn, openDispute, findReturnableOrder, listReturns, listDisputes } = await import(
  "../../lib/returns/service"
);

const actor = { id: "user-1", platformRole: "HOTEL_MANAGER" };
const order = { id: "order-1", orderNumber: "HV-1", status: "DELIVERED", requesterId: "user-hotel", supplierId: "supplier-1" };

describe("returns and discrepancy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.hasPermission.mockResolvedValue(true);
    m.orderFindFirst.mockResolvedValue({ ...order });
    m.grnFindFirst.mockResolvedValue({ id: "grn-1", status: "ACCEPTED" });
    m.returnFindFirst.mockResolvedValue(null);
    m.returnCreate.mockResolvedValue({ id: "ret-1", status: "REQUESTED" });
    m.returnUpdate.mockResolvedValue({ id: "ret-1", orderId: "order-1" });
    m.creditNoteCreate.mockResolvedValue({ id: "cn-1", number: "CN-ABC" });
    m.disputeCreate.mockResolvedValue({ id: "disp-1", disputeNumber: "DSP-1", status: "OPEN" });
    m.returnFindMany.mockResolvedValue([]);
    m.disputeFindMany.mockResolvedValue([]);
    m.appendAuditEntry.mockResolvedValue("audit-1");
    m.notify.mockResolvedValue({ notificationId: "n1", delivered: true, channel: "IN_APP" });
    // $transaction runs the callback with a tx that mirrors the client.
    m.transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        returnRequest: { create: m.returnCreate, update: m.returnUpdate },
        order: { findUnique: m.orderFindFirst },
        creditNote: { create: m.creditNoteCreate },
        dispute: { create: m.disputeCreate },
      }),
    );
  });

  describe("eligibility", () => {
    it("accepts a delivered order with an accepted receipt", async () => {
      const found = await findReturnableOrder("tenant-1", "order-1");
      expect(found?.id).toBe("order-1");
    });

    it("rejects an order that is not yet delivered", async () => {
      m.orderFindFirst.mockResolvedValue({ ...order, status: "CONFIRMED" });
      expect(await findReturnableOrder("tenant-1", "order-1")).toBeNull();
    });

    it("rejects an order with no accepted receipt", async () => {
      m.grnFindFirst.mockResolvedValue(null);
      expect(await findReturnableOrder("tenant-1", "order-1")).toBeNull();
    });

    it("rejects a missing order", async () => {
      m.orderFindFirst.mockResolvedValue(null);
      expect(await findReturnableOrder("tenant-1", "missing")).toBeNull();
    });
  });

  describe("raising a return", () => {
    it("denies an unauthorized caller", async () => {
      m.hasPermission.mockResolvedValue(false);
      await expect(
        requestReturn({ tenantId: "tenant-1", actor, orderId: "order-1", reason: "DAMAGED", requestedQty: 2, amount: 100 }),
      ).rejects.toThrow("Permission denied: order:update");
      expect(m.returnCreate).not.toHaveBeenCalled();
    });

    it("rejects a non-positive quantity", async () => {
      await expect(
        requestReturn({ tenantId: "tenant-1", actor, orderId: "order-1", reason: "DAMAGED", requestedQty: 0, amount: 100 }),
      ).rejects.toThrow("positive whole-number");
    });

    it("rejects a negative amount", async () => {
      await expect(
        requestReturn({ tenantId: "tenant-1", actor, orderId: "order-1", reason: "DAMAGED", requestedQty: 1, amount: -5 }),
      ).rejects.toThrow("valid return amount");
    });

    it("rejects a return against a non-delivered order", async () => {
      m.orderFindFirst.mockResolvedValue({ ...order, status: "CONFIRMED" });
      await expect(
        requestReturn({ tenantId: "tenant-1", actor, orderId: "order-1", reason: "DAMAGED", requestedQty: 1, amount: 100 }),
      ).rejects.toThrow("only be raised against a delivered order");
    });

    it("rejects a second open return on the same order", async () => {
      m.returnFindFirst.mockResolvedValue({ id: "ret-existing" });
      await expect(
        requestReturn({ tenantId: "tenant-1", actor, orderId: "order-1", reason: "DAMAGED", requestedQty: 1, amount: 100 }),
      ).rejects.toThrow("An open return already exists");
    });

    it("creates the return, audits it and notifies the requester in-app", async () => {
      const result = await requestReturn({
        tenantId: "tenant-1", actor, orderId: "order-1", reason: "WRONG_ITEM", requestedQty: 3, amount: 150,
      });
      expect(result.status).toBe("REQUESTED");
      expect(result.creditNoteId).toBeNull();
      expect(m.appendAuditEntry).toHaveBeenCalledTimes(1);
      expect(m.notify).toHaveBeenCalledTimes(1);
      const notifyCall = m.notify.mock.calls[0][0];
      expect(notifyCall.channel).toBe("IN_APP");
      expect(notifyCall.suppressExternal).toBe(true);
    });

    it("never sends an external supplier notification", async () => {
      await requestReturn({ tenantId: "tenant-1", actor, orderId: "order-1", reason: "DAMAGED", requestedQty: 1, amount: 10 });
      for (const call of m.notify.mock.calls) {
        expect(call[0].suppressExternal).toBe(true);
      }
    });
  });

  describe("approving a return and issuing a credit note", () => {
    it("credits only the approved quantity at the unit rate", async () => {
      m.returnFindFirst.mockResolvedValue({ id: "ret-1", orderId: "order-1", requestedQty: 4, status: "REQUESTED", amount: 200 });
      const result = await approveReturn({ tenantId: "tenant-1", actor, returnId: "ret-1", approvedQty: 2 });
      expect(result.status).toBe("CREDITED");
      expect(result.creditNoteNumber).toBe("CN-ABC");
      // 200 / 4 = 50 per unit, 2 units = 100
      expect(m.creditNoteCreate.mock.calls[0][0].data.amount).toBe(100);
    });

    it("refuses to approve more than was requested", async () => {
      m.returnFindFirst.mockResolvedValue({ id: "ret-1", orderId: "order-1", requestedQty: 2, status: "REQUESTED", amount: 100 });
      await expect(
        approveReturn({ tenantId: "tenant-1", actor, returnId: "ret-1", approvedQty: 5 }),
      ).rejects.toThrow("cannot exceed the requested quantity");
    });

    it("refuses to approve a return that is not REQUESTED", async () => {
      m.returnFindFirst.mockResolvedValue({ id: "ret-1", orderId: "order-1", requestedQty: 2, status: "CREDITED", amount: 100 });
      await expect(
        approveReturn({ tenantId: "tenant-1", actor, returnId: "ret-1", approvedQty: 1 }),
      ).rejects.toThrow("Only a REQUESTED return");
    });

    it("requires invoice:update permission", async () => {
      m.hasPermission.mockResolvedValue(false);
      await expect(
        approveReturn({ tenantId: "tenant-1", actor, returnId: "ret-1", approvedQty: 1 }),
      ).rejects.toThrow("Permission denied: invoice:update");
    });

    it("records the credit note in the audit trail", async () => {
      m.returnFindFirst.mockResolvedValue({ id: "ret-1", orderId: "order-1", requestedQty: 4, status: "REQUESTED", amount: 200 });
      await approveReturn({ tenantId: "tenant-1", actor, returnId: "ret-1", approvedQty: 2, notes: "verified" });
      const changes = m.appendAuditEntry.mock.calls[0][0].changes;
      expect(changes.action).toBe("RETURN_APPROVED");
      expect(changes.creditNoteNumber).toBe("CN-ABC");
      expect(changes.creditAmount).toBe(100);
    });
  });

  describe("opening a dispute", () => {
    it("opens a dispute with a liability assignment and no financial movement", async () => {
      const result = await openDispute({
        tenantId: "tenant-1", actor, orderId: "order-1", reason: "Goods arrived damaged", liability: "SUPPLIER",
      });
      expect(result.status).toBe("OPEN");
      expect(m.disputeCreate).toHaveBeenCalledTimes(1);
      expect(m.creditNoteCreate).not.toHaveBeenCalled();
    });

    it("requires a meaningful reason", async () => {
      await expect(
        openDispute({ tenantId: "tenant-1", actor, orderId: "order-1", reason: "bad" }),
      ).rejects.toThrow("meaningful dispute reason");
    });

    it("refuses a dispute on an unfulfilled order", async () => {
      m.orderFindFirst.mockResolvedValue({ ...order, status: "DRAFT" });
      await expect(
        openDispute({ tenantId: "tenant-1", actor, orderId: "order-1", reason: "Goods arrived damaged" }),
      ).rejects.toThrow("only be opened against a fulfilled order");
    });

    it("notifies the requester in-app only", async () => {
      await openDispute({ tenantId: "tenant-1", actor, orderId: "order-1", reason: "Goods arrived damaged" });
      expect(m.notify.mock.calls[0][0].channel).toBe("IN_APP");
      expect(m.notify.mock.calls[0][0].suppressExternal).toBe(true);
    });
  });

  describe("tenant scoping", () => {
    it("lists returns only for the caller's tenant", async () => {
      await listReturns("tenant-1");
      expect(m.returnFindMany.mock.calls[0][0].where).toEqual({ tenantId: "tenant-1" });
    });

    it("lists disputes only for the caller's tenant, excluding deleted rows", async () => {
      await listDisputes("tenant-1");
      expect(m.disputeFindMany.mock.calls[0][0].where).toEqual({ tenantId: "tenant-1", deletedAt: null });
    });
  });
});
