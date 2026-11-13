import { describe, expect, it } from "vitest";
import { canonicalizeSubcategory, HOSPITALITY_TAXONOMY, subcategoriesForGroup } from "@/lib/directory/hospitality-taxonomy";
import { operatingCategory } from "@/lib/directory/operating-category";

describe("hospitality catalog taxonomy", () => {
  it("keeps food, beverage, furniture and technology browse trees distinct", () => {
    const food = subcategoriesForGroup("Restaurants & bars");
    expect(food).toEqual(expect.arrayContaining([
      "Fresh produce",
      "Meat",
      "Poultry",
      "Fish & seafood",
      "Frozen foods",
      "Bakery",
      "Soft drinks",
      "Juices",
      "Spirit drinks",
    ]));

    const furniture = subcategoriesForGroup("Furniture, fixtures & outdoor");
    expect(furniture).toEqual(expect.arrayContaining([
      "Beds & mattresses",
      "Lobby & lounge",
      "Outdoor & pool",
      "Banquet & events",
    ]));

    const technology = subcategoriesForGroup("Hotel technology");
    expect(technology).toEqual(expect.arrayContaining([
      "Property software",
      "Guest apps & lockers",
      "Speakers & sound systems",
    ]));
    expect(technology).not.toEqual(expect.arrayContaining(["HVAC parts"]));
    expect(subcategoriesForGroup("Engineering & maintenance")).toEqual(
      expect.arrayContaining(["Indoor finishes", "Outdoor & grounds maintenance"]),
    );
  });

  it("aliases legacy catalog labels onto the canonical buyer filters", () => {
    expect(canonicalizeSubcategory("Protein")).toBe("Frozen foods");
    expect(canonicalizeSubcategory("Beverage")).toBe("Hot beverages");
    expect(canonicalizeSubcategory("Guest room furniture")).toBe("Guest room seating & desks");
    expect(canonicalizeSubcategory("Network")).toBe("Network & connectivity");
  });

  it("keeps ICT and engineering on separate operating groups", () => {
    expect(operatingCategory("ICT_AV").group).toBe("Hotel technology");
    expect(operatingCategory("ENGINEERING_MRO").group).toBe("Engineering & maintenance");
    expect(HOSPITALITY_TAXONOMY["Hotel technology"].label).toBe("Hotel technology");
  });
});
