import { describe, expect, it } from "vitest";
import { planProcurementRecommendations, type ProcurementCandidate } from "@/lib/intelligence/procurement-agent";

const candidates: ProcurementCandidate[] = [
  { id: "p-1", supplierId: "s-1", supplierName: "Verified Linen Co", name: "White bath towel 70x140", category: "LIN", unit: "piece", unitPrice: 180, currency: "EGP", supplierVerified: true, available: true },
  { id: "p-2", supplierId: "s-2", supplierName: "Unverified Textiles", name: "Bath towel", category: "LIN", unit: "piece", unitPrice: 120, currency: "EGP", supplierVerified: false, available: true },
  { id: "p-3", supplierId: "s-3", supplierName: "Verified Housekeeping Co", name: "Laundry detergent", category: "HK", unit: "kg", unitPrice: 95, currency: "EGP", supplierVerified: true, available: true },
];

describe("procurement recommendation planner", () => {
  it("returns verified, available candidates matching the requested category", () => {
    const result = planProcurementRecommendations({ category: "LIN", description: "bath towel", quantity: 20, candidates });
    expect(result.status).toBe("READY_FOR_REVIEW");
    expect(result.recommendations.map((item) => item.productId)).toEqual(["p-1"]);
    expect(result.recommendations[0]?.estimatedSubtotal).toBe(3600);
  });

  it("does not recommend unverified or unavailable supply", () => {
    const result = planProcurementRecommendations({ category: "LIN", description: "towel", quantity: 10, candidates: candidates.map((c) => ({ ...c, available: c.id !== "p-1" })) });
    expect(result.status).toBe("NO_VERIFIED_MATCH");
    expect(result.recommendations).toEqual([]);
    expect(result.excluded.some((item) => item.reason === "SUPPLIER_NOT_VERIFIED")).toBe(true);
  });

  it("never claims an order, inventory reservation or guaranteed saving", () => {
    const result = planProcurementRecommendations({ category: "HK", description: "detergent", quantity: 4, candidates });
    expect(result).toMatchObject({ orderCreated: false, inventoryReserved: false, guaranteedSaving: false });
    expect(result.recommendations[0]?.evidence.length).toBeGreaterThan(0);
  });
});
