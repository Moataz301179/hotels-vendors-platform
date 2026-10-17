import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('directory migration safety', () => {
  const migration = readFileSync(resolve(process.cwd(), 'prisma/migrations/20261017153000_add_directory_catalog_foundation/migration.sql'), 'utf8');

  it('is additive and does not rewrite existing procurement records', () => {
    expect(migration).toMatch(/CREATE TABLE "DirectorySource"/);
    expect(migration).toMatch(/CREATE TABLE "DirectoryCandidate"/);
    expect(migration).toMatch(/CREATE TABLE "DirectoryProfile"/);
    expect(migration).not.toMatch(/\b(DROP|TRUNCATE|DELETE\s+FROM|UPDATE\s+"(?:Product|Order|Supplier)")\b/i);
  });

  it('keeps the directory isolated from supplier offers and commercial fields', () => {
    expect(migration).not.toMatch(/supplierId|unitPrice|stockQuantity|leadTimeDays|deliveryFee|taxAmount/i);
    expect(migration).toMatch(/"candidateId" TEXT NOT NULL/);
  });

  it('matches the Prisma contract without duplicate or missing searchable fields', () => {
    const candidateTable = migration.match(/CREATE TABLE "DirectoryCandidate" \(([\s\S]*?)\n\);/)?.[1] ?? '';
    const profileTable = migration.match(/CREATE TABLE "DirectoryProfile" \(([\s\S]*?)\n\);/)?.[1] ?? '';

    expect((candidateTable.match(/"searchText" TEXT NOT NULL/g) ?? [])).toHaveLength(1);
    expect((profileTable.match(/"searchText" TEXT NOT NULL/g) ?? [])).toHaveLength(1);
  });
});
