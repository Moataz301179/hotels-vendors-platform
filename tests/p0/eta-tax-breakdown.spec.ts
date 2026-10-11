import { describe, expect, it } from "vitest";
import { buildEtaTaxBreakdown } from "@/lib/eta/tax-breakdown";

describe("ETA tax breakdown", () => {
  it("uses the supplier-stated tax rate instead of inventing 14%", () => {
    expect(buildEtaTaxBreakdown({ lineTotals: [100, 200], vatRate: 5, vatAmount: 15 }))
      .toEqual({ ok: true, lines: [{ taxAmount: 5, taxRate: 5 }, { taxAmount: 10, taxRate: 5 }] });
  });

  it("blocks ETA submission when the tax rate is absent", () => {
    expect(buildEtaTaxBreakdown({ lineTotals: [100], vatRate: null, vatAmount: 14 }))
      .toEqual({ ok: false, reason: "A supplier-stated VAT rate is required for ETA submission." });
  });

  it("blocks ETA submission when supplied VAT does not reconcile", () => {
    expect(buildEtaTaxBreakdown({ lineTotals: [100], vatRate: 5, vatAmount: 14 }))
      .toEqual({ ok: false, reason: "Supplier-stated VAT rate and amount do not reconcile with the invoice lines." });
  });
});
