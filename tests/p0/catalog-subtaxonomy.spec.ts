import { describe, expect, it } from "vitest";
import taxonomy from "@/data/staging/hospitality-procurement-subtaxonomy.v1.json";
import { validateSubtaxonomy } from "@/scripts/catalog/validate-subtaxonomy";

describe("hospitality procurement subtaxonomy", () => {
  it("reconciles every operating family to the 10,000-reference planning target", () => {
    expect(validateSubtaxonomy(taxonomy)).toEqual([]);
  });

  it("does not turn taxonomy capacity into an offer or availability claim", () => {
    expect(taxonomy.scope.toLowerCase()).toContain("supplier-neutral");
    expect(taxonomy.scope.toLowerCase()).toContain("not published inventory");
  });
});
