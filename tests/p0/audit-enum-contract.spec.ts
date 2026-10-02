import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}
function enumValues(schema: string, name: string): Set<string> {
  const block = schema.match(new RegExp(`enum ${name} \\{([\\s\\S]*?)\\n\\}`));
  if (!block) throw new Error(`Missing Prisma enum ${name}`);
  return new Set(block[1].split("\n").map((line) => line.trim()).filter((line) => /^[A-Z][A-Z0-9_]*$/.test(line)));
}

describe("tamper-evident audit enum contract", () => {
  it("declares every literal entity/action written by appendAuditEntry", () => {
    const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
    const entities = enumValues(schema, "EntityName");
    const actions = enumValues(schema, "ActionType");
    const violations: string[] = [];
    for (const file of filesUnder(join(root, "app")).concat(filesUnder(join(root, "lib"))).filter((path) => /\.(ts|tsx)$/.test(path))) {
      const source = readFileSync(file, "utf8");
      if (!source.includes("appendAuditEntry")) continue;
      for (const [, value] of source.matchAll(/entityName\s*:\s*["']([A-Z][A-Z0-9_]*)["']/g)) {
        if (!entities.has(value)) violations.push(`${file}: EntityName.${value}`);
      }
      for (const [, value] of source.matchAll(/actionType\s*:\s*["']([A-Z][A-Z0-9_]*)["']/g)) {
        if (!actions.has(value)) violations.push(`${file}: ActionType.${value}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("has an additive PostgreSQL migration for the newly supported audit values", () => {
    const migration = readFileSync(join(root, "prisma/migrations/20261002180000_expand_audit_enums/migration.sql"), "utf8");
    expect(migration).toContain('ALTER TYPE "EntityName" ADD VALUE IF NOT EXISTS');
    expect(migration).toContain('ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS');
    expect(migration).toContain("'OPPORTUNITY'");
    expect(migration).toContain("'STATUS_CHANGED'");
  });
});
