import { describe, expect, it } from "vitest";
import { runHospitalityTaxonomyAgent } from "@/lib/catalog/receiving/hospitality-taxonomy-agent";
import type { RawCatalogObservation } from "@/lib/catalog/receiving/types";
import { publicMaskedProduct } from "@/lib/directory/publish-masked-observations";
import { isPublicHoRecaDirectorySourceType } from "@/lib/directory/public-marketplace";
import { maskedPublicProductName } from "@/lib/sourcing/mask-supplier-product";
import { parseWordpressProducts } from "@/lib/sourcing/wordpress-public-catalog";

const observation = (overrides: Partial<RawCatalogObservation> = {}): RawCatalogObservation => ({
  sourceUrl: "https://catalog.example/",
  productUrl: "https://catalog.example/product/fruit-yogurt",
  sourceName: "Example Food Industries",
  sourceType: "PUBLIC_PRODUCT_CATALOG",
  supplierName: "Example Food Industries",
  supplierWebsite: "https://catalog.example/",
  externalId: "105",
  name: "Example Fruit Yogurt Strawberry 105 Gm",
  category: "Fruit Yogurt",
  unitPrice: 42,
  currency: "EGP",
  images: ["https://catalog.example/yogurt.webp"],
  ...overrides,
});

describe("masked supplier products", () => {
  it("removes the selling company and a printed price from the hotel row", () => {
    expect(maskedPublicProductName("Juhayna Fruit Yogurt Strawberry 105 Gm EGP 18.50", "Juhayna Food Industries")).toBe("Fruit Yogurt Strawberry 105 Gm");
    expect(maskedPublicProductName("Flaming Cheesy Puffs", "Arabian Food Industries (Domty)")).toBe("Flaming Cheesy Puffs");
    expect(maskedPublicProductName("جهينة Milk 1 L", "جهينة")).toBe("Milk 1 L");
    expect(maskedPublicProductName("ABC Milk", "ABC")).toBe("Milk");
    expect(maskedPublicProductName("جهينة", "جهينة")).toBeNull();
  });

  it("publishes the product without the company, price, or page address", () => {
    const result = publicMaskedProduct(observation());
    expect(result.safe).toBe(true);
    expect(result.name).toBe("Fruit Yogurt Strawberry 105 Gm");
    expect(result.taxonomy.categoryCode).toBe("FOOD_BEVERAGE");
    expect(result.fields?.subcategory).toBe("Chilled Frozen");
    expect(JSON.stringify(result.fields)).not.toMatch(/example food|42|https:|supplier|price/i);
    expect(isPublicHoRecaDirectorySourceType("MASKED_OBSERVED_SUPPLIER_PRODUCT")).toBe(true);
    expect(isPublicHoRecaDirectorySourceType("PUBLIC_CATALOG_OBSERVATION")).toBe(false);
  });

  it("holds a product whose public title still names the selling company", () => {
    const result = publicMaskedProduct(observation({ name: "جهينة", supplierName: "جهينة", brand: "جهينة" }));
    expect(result.safe).toBe(false);
  });

  it("holds a page that is not an individual product", () => {
    const result = publicMaskedProduct(observation({ name: "Our Products", productUrl: "https://catalog.example/" }));
    expect(result.safe).toBe(false);
  });

  it("reads a public WordPress product collection", () => {
    const products = parseWordpressProducts([{
      id: 7,
      link: "https://catalog.example/product/yogurt/",
      title: { rendered: "Fruit Yogurt Strawberry 105 Gm" },
      _embedded: { "wp:term": [[{ taxonomy: "brands", name: "Fruit Yogurt" }]], "wp:featuredmedia": [{ source_url: "https://catalog.example/yogurt.webp" }] },
    }]);
    expect(products).toEqual([{ id: 7, link: "https://catalog.example/product/yogurt/", name: "Fruit Yogurt Strawberry 105 Gm", categories: ["Fruit Yogurt"], imageUrl: "https://catalog.example/yogurt.webp" }]);
  });

  it("maps a branded yogurt to food and beverage", () => {
    expect(runHospitalityTaxonomyAgent(observation()).subcategoryCode).toBe("CHILLED_FROZEN");
  });
});
