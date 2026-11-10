import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const directory = readFileSync(join(process.cwd(), "components/marketing/marketplace-directory.tsx"), "utf8");

describe("public marketplace sourcing-area entry points", () => {
  it("exposes every controlled HoReCa family through an approved category cover", () => {
    for (const category of [
      "Restaurants & bars",
      "Housekeeping & laundry",
      "Guest rooms & amenities",
      "Engineering & maintenance",
      "Furniture, fixtures & outdoor",
      "Hotel services",
    ]) {
      expect(directory).toContain(`'${category}':`);
      expect(directory).toContain("category-");
    }
    expect(directory).toContain("MarketplaceCarousel");
    expect(directory).not.toContain("getProductImage");
  });
});
