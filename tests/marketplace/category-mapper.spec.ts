import { describe, expect, it } from "vitest";
import { transformCatalogItemToMarketplaceProduct, transformToMarketplaceProduct } from "../../lib/marketplace/category-mapper";

describe("marketplace product mapping", () => {
  it("preserves quote-only terms without inventing a unit price", () => {
    const mapped = transformToMarketplaceProduct({
      id: "prod-rfq-1",
      name: "Commercial kitchen supplies",
      description: null,
      category: "fb",
      subcategory: null,
      sku: "KITCHEN-001",
      unitPrice: null,
      basePrice: null,
      pricingMode: "RFQ",
      rfqThresholdQty: 100,
      currency: "EGP",
      unitOfMeasure: "piece",
      stockQuantity: 0,
      minOrderQty: 1,
      leadTimeDays: 7,
      images: null,
      supplierId: "supplier-1",
      supplier: {
        id: "supplier-1",
        name: "Example Supplier",
        tier: "CORE",
        city: "Cairo",
        rating: null,
        reviewCount: 0,
      },
    });

    expect(mapped.unitPrice).toBeNull();
    expect(mapped.basePrice).toBeNull();
    expect(mapped.pricingMode).toBe("RFQ");
    expect(mapped.rfqThresholdQty).toBe(100);
    expect(mapped.supplierName).toBe("Example Supplier");
  });

  it("preserves a supplier-provided reference price for transparent comparison", () => {
    const mapped = transformToMarketplaceProduct({
      id: "prod-fixed-1",
      name: "Hotel towels",
      description: null,
      category: "ose",
      subcategory: null,
      sku: "TOWEL-001",
      unitPrice: 80,
      basePrice: 100,
      pricingMode: "FIXED",
      rfqThresholdQty: null,
      currency: "EGP",
      unitOfMeasure: "piece",
      stockQuantity: 25,
      minOrderQty: 5,
      leadTimeDays: 3,
      images: null,
      supplierId: "supplier-2",
      supplier: {
        id: "supplier-2",
        name: "Textile Supplier",
        tier: "CORE",
        city: "Alexandria",
        rating: null,
        reviewCount: 0,
      },
    });

    expect(mapped.unitPrice).toBe(80);
    expect(mapped.basePrice).toBe(100);
    expect(mapped.pricingMode).toBe("FIXED");
    expect(mapped.stockQuantity).toBe(25);
  });

  it("keeps an unclaimed market reference quote-only and hides the source supplier", () => {
    const mapped = transformCatalogItemToMarketplaceProduct({
      id: "catalog-ref-1",
      name: "Commercial butter 1kg",
      brand: "Example brand",
      category: "Food and Beverage",
      subcategory: "Dairy",
      unitOfMeasure: null,
      description: "Observed public catalogue reference",
      status: "PENDING_REVIEW",
      imageUrl: "https://source.example/butter.jpg",
      imageRightsStatus: "SOURCE_REVIEW_REQUIRED",
      sources: [{ sourceUrl: "https://source.example/butter" }],
    });

    expect(mapped.listingKind).toBe("MARKET_REFERENCE");
    expect(mapped.unitPrice).toBeNull();
    expect(mapped.pricingMode).toBe("RFQ");
    expect(mapped.supplierName).toBe("Market reference · supplier not onboarded");
    expect(mapped.supplierId).toBe("");
    expect(mapped.images).toBeNull();
    expect(mapped.sourceCount).toBe(1);
  });
});
