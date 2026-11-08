import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  FeeInputError,
  calculateFullFeeBreakdown,
  calculatePlatformFee,
  fromCents,
  toCents,
} from "@/lib/fintech/fee-math";
import { applyPlatformFees } from "@/lib/fintech/fee-calculator";

describe("platform fee calculator — exact arithmetic", () => {
  it("applies the approved tier structure", () => {
    expect(calculatePlatformFee(1000, "CORE", "TRANSACTION").amount).toBe(25);
    expect(calculatePlatformFee(1000, "PREMIER", "TRANSACTION").amount).toBe(20);
    expect(calculatePlatformFee(1000, "COASTAL", "TRANSACTION").amount).toBe(15);
  });

  it("produces the full breakdown with a deterministic total", () => {
    const breakdown = calculateFullFeeBreakdown(1000, "CORE");
    expect(breakdown.transactionFee.amount).toBe(25);
    expect(breakdown.factoringReferralFee.amount).toBe(5);
    expect(breakdown.documentProcessingFee.amount).toBe(5);
    // The tier rate is an internal estimate, not traceable authorization.
    expect(breakdown.claimedRateTotal).toBe(25);
    expect(breakdown.chargeable).toBe(false);
    expect(breakdown.hypotheticalTotal).toBe(10);
    expect(breakdown.illustrativeTotal).toBe(35);
  });

  it("rounds half-cents deterministically instead of drifting", () => {
    // 333.33 × 2.5% = 8.33325 -> 8.33
    expect(calculatePlatformFee(333.33, "CORE", "TRANSACTION").amount).toBe(8.33);
    // 10.01 × 2.5% = 0.25025 -> 0.25
    expect(calculatePlatformFee(10.01, "CORE", "TRANSACTION").amount).toBe(0.25);
  });

  it("handles a zero total without NaN", () => {
    const breakdown = calculateFullFeeBreakdown(0, "CORE");
    expect(breakdown.transactionFee.amount).toBe(0);
    expect(breakdown.claimedRateTotal).toBe(0);
    expect(breakdown.chargeable).toBe(false);
    expect(breakdown.hypotheticalTotal).toBe(5); // hypothetical document fee only
    expect(Number.isNaN(breakdown.illustrativeTotal)).toBe(false);
  });

  it("scales document fees by document count", () => {
    expect(calculateFullFeeBreakdown(1000, "CORE", 0).documentProcessingFee.amount).toBe(0);
    expect(calculateFullFeeBreakdown(1000, "CORE", 3).documentProcessingFee.amount).toBe(15);
  });

  it("rejects invalid inputs instead of producing negative fees", () => {
    for (const bad of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => calculatePlatformFee(bad, "CORE", "TRANSACTION")).toThrow(FeeInputError);
    }
    expect(() => calculateFullFeeBreakdown(1000, "CORE", -1)).toThrow(FeeInputError);
    expect(() => calculateFullFeeBreakdown(1000, "CORE", 1.5)).toThrow(FeeInputError);
    expect(() => calculatePlatformFee(1000, "NOPE" as never, "TRANSACTION")).toThrow(FeeInputError);
  });

  it("labels unconfirmed rates as hypothetical", () => {
    const breakdown = calculateFullFeeBreakdown(1000, "CORE");
    expect(breakdown.transactionFee.basis).toBe("approved-tier-structure");
    expect(breakdown.factoringReferralFee.basis).toBe("hypothetical");
    expect(breakdown.documentProcessingFee.basis).toBe("hypothetical");
  });

  it("keeps integer cent conversion exact", () => {
    expect(toCents(0.1) + toCents(0.2)).toBe(30n);
    expect(fromCents(30n)).toBe(0.3);
  });
});

describe("applyPlatformFees — permission gate", () => {
  it("scopes the fee write to the caller's tenant", async () => {
    const source = readFileSync(new URL("../../lib/fintech/fee-calculator.ts", import.meta.url), "utf8");
    expect(source).toContain("where: { id: invoiceId, tenantId, deletedAt: null }");
    expect(source).toContain("not found in tenant");
    // permission is enforced before the tenant-scoped lookup
    expect(source.indexOf('await requirePermission("invoice:update")')).toBeLessThan(source.indexOf("findFirst"));
  });

  it("refuses to write without the invoice:update permission", async () => {
    const deny = vi.fn(async () => {
      throw new Error("permission denied");
    });
    await expect(
      applyPlatformFees({ invoiceId: "inv_test", hotelTier: "CORE", tenantId: "tenant-1", requirePermission: deny })
    ).rejects.toThrow("permission denied");
    expect(deny).toHaveBeenCalledWith("invoice:update");
  });
});
