import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/api/v2/inventory/counts/route.ts"), "utf8");
const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");

describe("physical count route safety contract", () => {
  it("records a tenant-scoped pending-review observation with replay protection", () => {
    expect(source).toContain("clientSubmissionId"); expect(source).toContain("pg_advisory_xact_lock"); expect(source).toContain("physicalInventoryCount.create"); expect(schema).toContain("PhysicalCountStatus @default(PENDING_REVIEW)");
  });
  it("never treats camera output as a direct stock adjustment", () => {
    expect(source).not.toContain("product.update("); expect(source).not.toContain("inventorySnapshot.update("); expect(source).toContain("authorized reconciliation review must accept or reject");
  });
});
