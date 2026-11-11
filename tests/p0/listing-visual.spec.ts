import { describe, expect, it } from "vitest";
import { edibleRank, listingArabicName, listingImage, orderedOperatingGroups } from "@/lib/directory/listing-visual";

describe("listing visuals", () => {
  it("gives food specifications their own local pictures and keeps other areas on covers", () => {
    expect(listingImage("Long-grain white rice", "FOOD_BEVERAGE")).toBe("/catalog/rice.jpg");
    expect(listingImage("Frozen chicken breast", "FOOD_BEVERAGE")).toBe("/catalog/chicken.jpg");
    expect(listingImage("Orange juice", "FOOD_BEVERAGE")).toBe("/catalog/juice.jpg");
    expect(listingImage("Still mineral water, 330 ml", "FOOD_BEVERAGE")).toBe("/catalog/water.jpg");
    expect(listingImage("Hot-water boiler inspection", "SERVICES")).toBe("/category-supplier-catalogue.png");
    expect(listingImage("Lobby coffee table", "FFE")).toBe("/category-furniture-fixtures.jpg");
    expect(listingImage("White bath towel, 100 × 150 cm", "LINEN_TEXTILES")).toBe("/category-housekeeping.png");
    expect(listingImage("Guest-room television", "ICT_AV")).toBe("/catalog/technology.jpg");
    expect(listingImage("Long-grain white rice", "FOOD_BEVERAGE")).not.toMatch(/^https?:/);
  });

  it("puts food and beverage first and shows its Arabic name", () => {
    expect(orderedOperatingGroups(["Engineering & maintenance", "Restaurants & bars", "Uniforms & workwear"])[0]).toBe("Restaurants & bars");
    expect(edibleRank("Dry grocery")).toBeLessThan(edibleRank("Kitchen food preparation"));
    expect(listingArabicName("Long-grain white rice", null)).toBe("أرز أبيض طويل الحبة");
    expect(listingArabicName("Long-grain white rice", "أرز محفوظ")).toBe("أرز محفوظ");
  });
});
