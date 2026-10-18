import { describe, expect, it } from "vitest";
import { buyerSafeCatalogImageUrls } from "@/lib/catalog/buyer-safe-media";

describe("buyer-safe catalog media", () => {
  it("uses an opaque first-party route for verified supplier-owned images", () => {
    expect(buyerSafeCatalogImageUrls({ productId: "product-1", images: JSON.stringify(["https://supplier.example/media/towels.jpg"]), imageSourceUrl: "https://supplier.example/catalog/towels", supplierWebsite: "https://supplier.example" })).toEqual(["/api/v2/catalog/products/product-1/images/0"]);
  });

  it("withholds unverified image references instead of leaking source URLs", () => {
    expect(buyerSafeCatalogImageUrls({ productId: "product-1", images: JSON.stringify(["https://unverified.example/towels.jpg"]), imageSourceUrl: "https://supplier.example/catalog/towels", supplierWebsite: "https://supplier.example" })).toEqual([]);
  });
});
