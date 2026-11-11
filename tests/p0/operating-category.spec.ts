import { describe, expect, it } from "vitest";
import { operatingCategories, operatingCategory } from "@/lib/directory/operating-category";

describe("operating category crosswalk", () => {
  it("places supplier-register codes on the same operating areas as catalog listings", () => {
    expect(operatingCategory("COMMERCIAL_KITCHEN").group).toBe("Restaurants & bars");
    expect(operatingCategory("TABLETOP_SERVICEWARE").group).toBe("Restaurants & bars");
    expect(operatingCategory("PACKAGING_DISPOSABLES").group).toBe("Restaurants & bars");
    expect(operatingCategory("HOUSEKEEPING_CLEANING").group).toBe("Housekeeping & laundry");
    expect(operatingCategory("LINEN_TEXTILES").subcategory).toBe("Linen, towels & textile care");
    expect(operatingCategory("GUEST_AMENITIES").group).toBe("Guest rooms & amenities");
    expect(operatingCategory("SAFETY_SECURITY").group).toBe("Safety & compliance");
    expect(operatingCategory("ICT_AV").group).toBe("Hotel technology");
    expect(operatingCategory("UNIFORMS").group).toBe("Uniforms & workwear");
    expect(operatingCategory("FOOD_BEVERAGE", "Long-grain white rice")).toEqual({
      code: "FOOD_BEVERAGE",
      group: "Restaurants & bars",
      subcategory: "Food, beverage & kitchen operations",
    });
  });

  it("keeps an unknown code out of a guessed commercial category", () => {
    expect(operatingCategory("NOT_A_CATEGORY").group).toBe("Other operating needs");
  });

  it("deduplicates repeated supplier category claims", () => {
    expect(operatingCategories(["HOUSEKEEPING_CLEANING", "HOUSEKEEPING_LAUNDRY"])).toEqual([
      expect.objectContaining({ group: "Housekeeping & laundry", subcategory: "Cleaning tools & consumables" }),
    ]);
  });
});
