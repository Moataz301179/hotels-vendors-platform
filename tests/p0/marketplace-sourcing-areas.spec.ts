import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const directory = readFileSync(join(process.cwd(), "components/marketing/marketplace-directory.tsx"), "utf8");
const visuals = readFileSync(join(process.cwd(), "lib/directory/listing-visual.ts"), "utf8");

describe("public marketplace sourcing-area entry points", () => {
  it("exposes every controlled HoReCa family through approved local catalog photographs", () => {
    for (const category of [
      "Restaurants & bars",
      "Housekeeping & laundry",
      "Guest rooms & amenities",
      "Engineering & maintenance",
      "Furniture, fixtures & outdoor",
      "Hotel services",
    ]) {
      expect(visuals).toContain(`"${category}":`);
    }
    expect(visuals).toContain("Food & beverage");
    expect(visuals).toContain("/catalog/rice.jpg");
    expect(visuals).toContain("/catalog/bath-towel.jpg");
    expect(visuals).toContain("/catalog/guest-amenities.jpg");
    const covers = visuals.match(/export const APPROVED_COVERS[\s\S]*?= \{[\s\S]*?\n\};/)?.[0] ?? "";
    expect(covers).not.toContain("category-");
    expect(covers).toContain("/catalog/cover-food-beverage.png");
    expect(covers).toContain("/catalog/cover-furniture-fixtures.jpg");
    expect(covers).toContain("/catalog/cover-safety-compliance.jpg");
    expect(covers).toContain("/catalog/cover-hotel-technology.jpg");
    expect(covers).not.toContain("gastronorm-pan.jpg");
    expect(covers).not.toContain("lobby-armchair.jpg");
    expect(covers).not.toContain("fire-extinguisher.jpg");
    expect(covers).not.toContain("guest-tv.jpg");
    expect(directory).toContain("MarketplaceCarousel");
    expect(directory).not.toContain("getProductImage");
    expect(directory).not.toContain("unsplash");
    expect(visuals).not.toContain("unsplash");
    expect(visuals).not.toContain("wikimedia");
  });
});
