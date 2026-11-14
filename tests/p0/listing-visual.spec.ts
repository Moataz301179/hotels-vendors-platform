import { describe, expect, it } from "vitest";
import { edibleRank, listingArabicName, listingImage, orderedOperatingGroups } from "@/lib/directory/listing-visual";

describe("listing visuals", () => {
  it("does not invent family stock photographs for catalogue rows or details", () => {
    expect(listingImage("Long-grain white rice", "FOOD_BEVERAGE")).toBeNull();
    expect(listingImage("Dry durum pasta", "FOOD_BEVERAGE")).toBeNull();
    expect(listingImage("Black tea leaves", "FOOD_BEVERAGE")).toBeNull();
    expect(listingImage("Glass and mirror cleaner", "HOUSEKEEPING")).toBeNull();
    expect(listingImage("Guest-room television", "ICT_AV")).toBeNull();
    expect(listingImage("Portable fire extinguisher", "SAFETY_SECURITY")).toBeNull();
  });

  it("puts food and beverage first and shows its Arabic name", () => {
    expect(orderedOperatingGroups(["Engineering & maintenance", "Restaurants & bars", "Uniforms & workwear"])[0]).toBe("Restaurants & bars");
    expect(edibleRank("Dry grocery")).toBeLessThan(edibleRank("Kitchen food preparation"));
    expect(listingArabicName("Long-grain white rice", null)).toBe("أرز أبيض طويل الحبة");
    expect(listingArabicName("Long-grain white rice", "أرز محفوظ")).toBe("أرز محفوظ");
  });
});
