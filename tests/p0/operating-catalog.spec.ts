import { describe, expect, it } from "vitest";
import { operatingCategory } from "@/lib/directory/operating-category";
import { loadOperatingCatalogBatches } from "@/lib/directory/operating-catalog-batches";
import { validateInternalDirectoryBatch } from "@/lib/directory/publish-internal-batch";

describe("operating catalog", () => {
  it("validates every supplier-neutral batch and covers each operating area", async () => {
    const batches = await loadOperatingCatalogBatches();
    const groups = new Set<string>();
    let records = 0;
    for (const batch of batches) {
      expect(() => validateInternalDirectoryBatch(batch)).not.toThrow();
      records += batch.records.length;
      for (const record of batch.records) groups.add(operatingCategory(record.category, record.name).group);
    }
    expect(records).toBeGreaterThanOrEqual(200);
    expect(groups).toEqual(new Set([
      "Restaurants & bars",
      "Housekeeping & laundry",
      "Guest rooms & amenities",
      "Engineering & maintenance",
      "Furniture, fixtures & outdoor",
      "Hotel services",
      "Safety & compliance",
      "Hotel technology",
      "Uniforms & workwear",
    ]));
  });
});
