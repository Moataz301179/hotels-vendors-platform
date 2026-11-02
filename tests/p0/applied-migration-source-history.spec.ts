import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("applied production migration source history", () => {
  it("retains the exact bytes of every verified historical migration", () => {
    const baseline = JSON.parse(readFileSync(join(process.cwd(), "docs/recovery/applied-migration-checksums.json"), "utf8"));
    expect(Object.keys(baseline.migrationChecksums)).toHaveLength(51);
    for (const [name, checksum] of Object.entries(baseline.migrationChecksums)) {
      const sql = readFileSync(join(process.cwd(), "prisma/migrations", name, "migration.sql"));
      expect(createHash("sha256").update(sql).digest("hex"), name).toBe(checksum);
    }
  });
});
