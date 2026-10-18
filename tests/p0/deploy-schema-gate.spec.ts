import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "scripts/verify-live-procurement-schema.mjs"), "utf8");

describe("release schema gate", () => {
  it("fails before activation unless the pending-review physical-count table is present", () => {
    expect(source).toContain('PhysicalInventoryCount: ["id", "tenantId", "hotelId", "productId", "countedById", "clientSubmissionId", "observedQuantity", "capturedAt", "status", "deletedAt"]');
  });
});
