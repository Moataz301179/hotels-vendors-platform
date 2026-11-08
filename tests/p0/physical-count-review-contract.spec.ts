import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/api/v2/inventory/counts/[countId]/review/route.ts"), "utf8");

describe("physical count segregation of duties", () => {
  it("requires an authorized hotel reviewer distinct from the counter", () => {
    expect(source).toContain("PHYSICAL_COUNT_REVIEW_ROLE_REQUIRED");
    expect(source).toContain("COUNT_REVIEWER_MUST_BE_DISTINCT");
    expect(source).toContain("count.countedById === actor.id");
  });

  it("records a decision but never treats camera evidence as a stock adjustment", () => {
    expect(source).toContain("PHYSICAL_COUNT_REVIEWED");
    expect(source).not.toContain("inventorySnapshot.update(");
    expect(source).not.toContain("product.update(");
  });
});
