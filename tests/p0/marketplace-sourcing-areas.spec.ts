import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const marketplacePage = readFileSync(join(process.cwd(), "app/(marketing)/marketplace/page.tsx"), "utf8");

describe("public marketplace sourcing-area entry points", () => {
  it("exposes every controlled HoReCa family as its own contextual category route", () => {
    for (const category of [
      "Restaurants & bars",
      "Housekeeping & laundry",
      "Guest rooms & amenities",
      "Engineering & maintenance",
      "Furniture, fixtures & outdoor",
      "Hotel services",
    ]) {
      expect(marketplacePage).toContain(`['${category}'`);
    }
    expect(marketplacePage).toContain("encodeURIComponent(title)");
  });
});
