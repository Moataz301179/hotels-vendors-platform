import { describe, expect, it } from "vitest";
import { runQualityFilterAgent } from "@/lib/catalog/receiving/quality-filter-agent";
import { runHospitalityTaxonomyAgent } from "@/lib/catalog/receiving/hospitality-taxonomy-agent";
import type { RawCatalogObservation } from "@/lib/catalog/receiving/types";

const observation = (overrides: Partial<RawCatalogObservation> = {}): RawCatalogObservation => ({
  sourceUrl: "https://supplier.example/catalog/cleaning",
  productUrl: "https://supplier.example/product/industrial-degreaser",
  sourceName: "Supplier Catalog",
  sourceType: "SUPPLIER_CATALOG",
  supplierName: "Example Supplies",
  supplierWebsite: "https://supplier.example",
  name: "Industrial kitchen degreaser 5L",
  description: "Professional kitchen degreaser in a 5 litre container.",
  category: "Kitchen cleaning",
  packSize: "5 L",
  unitOfMeasure: "L",
  unitPrice: 285,
  currency: "EGP",
  images: ["https://supplier.example/media/degreaser-5l.jpg"],
  ...overrides,
});

describe("catalog receiving subagents", () => {
  it("accepts product-level same-site evidence without treating missing price as a rejection", () => {
    const result = runQualityFilterAgent(observation({ unitPrice: null }));
    expect(result.status).toBe("ACCEPTED");
    expect(result.flags).toContain("PRICE_NOT_OBSERVED");
  });
  it("holds category pages and off-site detail links for review instead of exporting them", () => {
    expect(runQualityFilterAgent(observation({ productUrl: "https://supplier.example/catalog/cleaning", sku: undefined })).status).toBe("REVIEW_REQUIRED");
    expect(runQualityFilterAgent(observation({ productUrl: "https://other.example/product/1" })).status).toBe("REVIEW_REQUIRED");
  });
  it("rejects navigation and marketing labels, but does not delete the raw record", () => {
    expect(runQualityFilterAgent(observation({ name: "Our Products", productUrl: "https://supplier.example/product/1" })).status).toBe("REJECTED");
  });
  it("maps a product into a hospitality taxonomy subcategory", () => {
    const result = runHospitalityTaxonomyAgent(observation());
    expect(result.status).toBe("MAPPED");
    expect(result.categoryCode).toBe("HOUSEKEEPING_LAUNDRY");
    expect(result.subcategoryCode).toBe("CLEANING_CHEMICALS");
    expect(result.unitOfMeasure).toBe("L");
  });
  it("does not invent MOQ, a purchase unit, or category when the source is insufficient", () => {
    const result = runHospitalityTaxonomyAgent(observation({ name: "Unspecified hospitality item", description: undefined, category: undefined, unitOfMeasure: undefined, packSize: undefined, purchaseUnit: undefined }));
    expect(result.status).toBe("REVIEW_REQUIRED");
    expect(result.categoryCode).toBeNull();
    expect(result.purchaseUnit).toBeNull();
  });
});
