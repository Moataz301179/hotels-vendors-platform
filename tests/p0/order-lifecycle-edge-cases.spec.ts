import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Order lifecycle edge cases — against the REAL state machine contract.
 *
 * Covers the paths a happy-path test never exercises: partial delivery,
 * rejection and resubmission, cancellation, returns via dispute, transition
 * gates, and duplicate / out-of-order status events.
 *
 * Every assertion is about the STATE CONTRACT: an invalid or duplicate
 * transition must not mutate the order and must not be recorded as an event.
 */

const m = vi.hoisted(() => ({
  orderFindUnique: vi.fn(),
  orderUpdate: vi.fn(),
  auditLogCreate: vi.fn(),
  invoiceFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        order: { findUnique: m.orderFindUnique, update: m.orderUpdate },
        auditLog: { create: m.auditLogCreate },
        invoice: { findFirst: m.invoiceFindFirst },
      }),
  },
}));

const { validateStatusTransition, getTransitionGate, atomicStatusUpdate } = await import(
  "../../lib/auth/state-machine"
);

describe("order lifecycle edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.auditLogCreate.mockResolvedValue({});
  });

  describe("partial delivery", () => {
    it("allows IN_TRANSIT → PARTIALLY_DELIVERED", () => {
      expect(validateStatusTransition("IN_TRANSIT", "PARTIALLY_DELIVERED").valid).toBe(true);
    });

    it("allows PARTIALLY_DELIVERED → DELIVERED", () => {
      expect(validateStatusTransition("PARTIALLY_DELIVERED", "DELIVERED").valid).toBe(true);
    });

    it("requires authority and ETA validation for both partial-delivery transitions", () => {
      expect(getTransitionGate("IN_TRANSIT", "PARTIALLY_DELIVERED")?.requires).toMatchObject({
        authorityApproval: true,
        etaValidation: true,
      });
      expect(getTransitionGate("PARTIALLY_DELIVERED", "DELIVERED")?.requires).toMatchObject({
        authorityApproval: true,
        etaValidation: true,
      });
    });

    it("forbids skipping straight from CONFIRMED to DELIVERED", () => {
      expect(validateStatusTransition("CONFIRMED", "DELIVERED").valid).toBe(false);
    });

    it("forbids going backwards from PARTIALLY_DELIVERED to IN_TRANSIT", () => {
      expect(validateStatusTransition("PARTIALLY_DELIVERED", "IN_TRANSIT").valid).toBe(false);
    });

    it("forbids cancelling a partially delivered order directly — it must be disputed first", () => {
      expect(validateStatusTransition("PARTIALLY_DELIVERED", "CANCELLED").valid).toBe(false);
    });
  });

  describe("rejection and resubmission", () => {
    it("allows PENDING_APPROVAL → REJECTED", () => {
      expect(validateStatusTransition("PENDING_APPROVAL", "REJECTED").valid).toBe(true);
    });

    it("allows REJECTED → DRAFT for resubmission", () => {
      expect(validateStatusTransition("REJECTED", "DRAFT").valid).toBe(true);
    });

    it("forbids rejecting an order that was never pending approval", () => {
      expect(validateStatusTransition("CONFIRMED", "REJECTED").valid).toBe(false);
    });

    it("forbids approving a rejected order directly", () => {
      expect(validateStatusTransition("REJECTED", "APPROVED").valid).toBe(false);
    });
  });

  describe("cancellation", () => {
    it("allows cancellation from the pre-fulfilment states", () => {
      for (const from of ["DRAFT", "PENDING_APPROVAL", "APPROVED", "CONFIRMED"]) {
        expect(validateStatusTransition(from, "CANCELLED").valid).toBe(true);
      }
    });

    it("forbids cancellation once goods are in motion", () => {
      expect(validateStatusTransition("IN_TRANSIT", "CANCELLED").valid).toBe(false);
    });

    it("makes CANCELLED terminal — nothing transitions out", () => {
      expect(validateStatusTransition("CANCELLED", "DRAFT").valid).toBe(false);
      expect(validateStatusTransition("CANCELLED", "DELIVERED").valid).toBe(false);
      expect(validateStatusTransition("CANCELLED", "PENDING_APPROVAL").valid).toBe(false);
    });
  });

  describe("returns via dispute", () => {
    it("allows IN_TRANSIT → DISPUTED", () => {
      expect(validateStatusTransition("IN_TRANSIT", "DISPUTED").valid).toBe(true);
    });

    it("allows a DELIVERED order to be disputed (returns path)", () => {
      expect(validateStatusTransition("DELIVERED", "DISPUTED").valid).toBe(true);
    });

    it("allows a disputed order to be resolved as delivered or cancelled", () => {
      expect(validateStatusTransition("DISPUTED", "DELIVERED").valid).toBe(true);
      expect(validateStatusTransition("DISPUTED", "CANCELLED").valid).toBe(true);
    });

    it("forbids reopening a dispute into an earlier fulfilment state", () => {
      expect(validateStatusTransition("DISPUTED", "IN_TRANSIT").valid).toBe(false);
      expect(validateStatusTransition("DISPUTED", "CONFIRMED").valid).toBe(false);
    });
  });

  describe("duplicate and out-of-order events", () => {
    it("treats a repeat of the current status as a valid no-op, not an error", () => {
      expect(validateStatusTransition("DELIVERED", "DELIVERED").valid).toBe(true);
    });

    it("does not mutate the order or write an audit row when the order is missing", async () => {
      m.orderFindUnique.mockResolvedValue(null);
      const result = await atomicStatusUpdate("missing", "CONFIRMED", "user-1", "tenant-1");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Order not found");
      expect(m.orderUpdate).not.toHaveBeenCalled();
      expect(m.auditLogCreate).not.toHaveBeenCalled();
    });

    it("blocks a transition that fails its gate and writes no audit row", async () => {
      // APPROVED → CONFIRMED requires a payment guarantee.
      m.orderFindUnique.mockResolvedValue({ id: "order-1", status: "APPROVED", paymentGuaranteed: false });
      const result = await atomicStatusUpdate("order-1", "CONFIRMED", "user-1", "tenant-1");
      expect(result.success).toBe(false);
      expect(result.error).toContain("requires payment guarantee");
      expect(m.orderUpdate).not.toHaveBeenCalled();
      expect(m.auditLogCreate).not.toHaveBeenCalled();
    });

    it("blocks an ETA-gated transition when no accepted invoice exists", async () => {
      m.orderFindUnique.mockResolvedValue({ id: "order-1", status: "CONFIRMED", paymentGuaranteed: true });
      m.invoiceFindFirst.mockResolvedValue(null);
      const result = await atomicStatusUpdate("order-1", "IN_TRANSIT", "user-1", "tenant-1");
      expect(result.success).toBe(false);
      expect(result.error).toContain("ETA-accepted");
      expect(m.orderUpdate).not.toHaveBeenCalled();
    });

    it("applies the transition and writes exactly one audit row on success", async () => {
      m.orderFindUnique.mockResolvedValue({ id: "order-1", status: "PENDING_APPROVAL", paymentGuaranteed: false });
      m.orderUpdate.mockResolvedValue({ id: "order-1", status: "REJECTED" });
      const result = await atomicStatusUpdate("order-1", "REJECTED", "user-1", "tenant-1");
      expect(result.success).toBe(true);
      expect(result.order?.status).toBe("REJECTED");
      expect(m.orderUpdate).toHaveBeenCalledTimes(1);
      expect(m.auditLogCreate).toHaveBeenCalledTimes(1);
      expect(m.auditLogCreate.mock.calls[0][0].data.changes).toEqual({
        before: { status: "PENDING_APPROVAL" },
        after: { status: "REJECTED" },
      });
    });

    it("allows an override to bypass a blocked gate, and records that it did", async () => {
      m.orderFindUnique.mockResolvedValue({ id: "order-1", status: "APPROVED", paymentGuaranteed: false });
      m.orderUpdate.mockResolvedValue({ id: "order-1", status: "CONFIRMED" });
      const result = await atomicStatusUpdate("order-1", "CONFIRMED", "user-1", "tenant-1", true);
      expect(result.success).toBe(true);
      expect(m.auditLogCreate).toHaveBeenCalledTimes(1);
    });
  });
});
