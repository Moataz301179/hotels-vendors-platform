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
    expect(visuals).not.toMatch(/APPROVED_COVERS[\s\S]*category-/);
    expect(directory).toContain("MarketplaceCarousel");
    expect(directory).not.toContain("getProductImage");
    expect(directory).not.toContain("unsplash");
    expect(visuals).not.toContain("unsplash");
    expect(visuals).not.toContain("wikimedia");
  });
});
