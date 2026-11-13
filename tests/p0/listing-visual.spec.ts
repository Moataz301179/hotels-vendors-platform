import { describe, expect, it } from "vitest";
import { edibleRank, listingArabicName, listingImage, orderedOperatingGroups } from "@/lib/directory/listing-visual";

describe("listing visuals", () => {
  it("maps products to local catalog photographs instead of repeated scenic covers", () => {
    expect(listingImage("Long-grain white rice", "FOOD_BEVERAGE")).toBe("/catalog/rice.jpg");
    expect(listingImage("Frozen chicken breast", "FOOD_BEVERAGE")).toBe("/catalog/chicken.jpg");
    expect(listingImage("Orange juice", "FOOD_BEVERAGE")).toBe("/catalog/juice.jpg");
    expect(listingImage("Still mineral water, 330 ml", "FOOD_BEVERAGE")).toBe("/catalog/water.jpg");
    expect(listingImage("Stainless steel gastronorm food pan", "FOOD_BEVERAGE")).toBe("/catalog/gastronorm-pan.jpg");
    expect(listingImage("Hot-water boiler inspection", "SERVICES")).toBe("/catalog/facility-service.jpg");
    expect(listingImage("Lobby armchair", "FFE")).toBe("/catalog/lobby-armchair.jpg");
    expect(listingImage("White bath towel, 100 × 150 cm", "LINEN_TEXTILES")).toBe("/catalog/bath-towel.jpg");
    expect(listingImage("Guest shampoo, single use", "GUEST_SUPPLIES")).toBe("/catalog/guest-amenities.jpg");
    expect(listingImage("Guest-room television", "ICT_AV")).toBe("/catalog/guest-tv.jpg");
    expect(listingImage("Portable fire extinguisher", "SAFETY_SECURITY")).toBe("/catalog/fire-extinguisher.jpg");
    expect(listingImage("Long-grain white rice", "FOOD_BEVERAGE")).not.toMatch(/^https?:/);
    expect(listingImage("White bath towel, 100 × 150 cm", "LINEN_TEXTILES")).not.toMatch(/category-/);
  });

  it("does not map housekeeping glass cleaner or network switches to unrelated product photos", () => {
    expect(listingImage("Glass and mirror cleaner", "HOUSEKEEPING")).toBe("/catalog/cleaning-supplies.jpg");
    expect(listingImage("Glass and mirror cleaner", "HOUSEKEEPING")).not.toBe("/catalog/water-tumbler.jpg");
    expect(listingImage("Network access switch", "ICT_AV")).toBe("/catalog/network-equipment.jpg");
    expect(listingImage("Network access switch", "ICT_AV")).not.toBe("/catalog/electrical-fixture.jpg");
    expect(listingImage("Wall light switch", "ENGINEERING_MRO")).toBe("/catalog/electrical-fixture.jpg");
  });

  it("puts food and beverage first and shows its Arabic name", () => {
    expect(orderedOperatingGroups(["Engineering & maintenance", "Restaurants & bars", "Uniforms & workwear"])[0]).toBe("Restaurants & bars");
    expect(edibleRank("Dry grocery")).toBeLessThan(edibleRank("Kitchen food preparation"));
    expect(listingArabicName("Long-grain white rice", null)).toBe("أرز أبيض طويل الحبة");
    expect(listingArabicName("Long-grain white rice", "أرز محفوظ")).toBe("أرز محفوظ");
  });
});
