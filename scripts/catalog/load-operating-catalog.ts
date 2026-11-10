/**
 * Loads the approved internal hospitality specifications into a local directory.
 * Dry run is the default. Apply writes only when the database host is local.
 *
 *   npx tsx scripts/catalog/load-operating-catalog.ts
 *   HV_ALLOW_INTERNAL_DIRECTORY_PUBLICATION=1 npx tsx scripts/catalog/load-operating-catalog.ts --apply
 */
import { prisma } from "@/lib/prisma";
import { publishInternalDirectoryBatch, validateInternalDirectoryBatch } from "@/lib/directory/publish-internal-batch";
import { operatingCategory } from "@/lib/directory/operating-category";
import { loadOperatingCatalogBatches } from "@/lib/directory/operating-catalog-batches";

function assertLocalDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL_REQUIRED");
  const host = new URL(databaseUrl).hostname;
  if (!["localhost", "127.0.0.1", "::1"].includes(host)) throw new Error("CATALOG_LOAD_REQUIRES_LOCAL_DATABASE");
}

async function localPublisher() {
  const email = "local-directory@127.0.0.1";
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, tenantId: true, platformRole: true } });
  if (existing?.platformRole === "ADMIN") return { id: existing.id, tenantId: existing.tenantId, platformRole: "ADMIN" as const };
  const tenant = await prisma.tenant.upsert({
    where: { slug: "local-directory-operations" },
    update: { name: "Local directory operations", type: "PLATFORM", status: "ACTIVE" },
    create: { name: "Local directory operations", slug: "local-directory-operations", type: "PLATFORM", status: "ACTIVE" },
    select: { id: true },
  });
  const role = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: "Local directory publisher" } },
    update: {},
    create: { tenantId: tenant.id, name: "Local directory publisher" },
    select: { id: true },
  });
  const user = await prisma.user.upsert({
    where: { email },
    update: { platformRole: "ADMIN", status: "ACTIVE", tenantId: tenant.id, roleId: role.id },
    create: { email, name: "Local directory publisher", platformRole: "ADMIN", status: "ACTIVE", tenantId: tenant.id, roleId: role.id, role: "OWNER" },
    select: { id: true, tenantId: true },
  });
  return { id: user.id, tenantId: user.tenantId, platformRole: "ADMIN" as const };
}

async function main() {
  const batches = await loadOperatingCatalogBatches();
  const coverage = new Map<string, number>();
  for (const batch of batches) {
    validateInternalDirectoryBatch(batch);
    for (const record of batch.records) {
      const area = operatingCategory(record.category, record.name);
      coverage.set(area.group, (coverage.get(area.group) ?? 0) + 1);
    }
  }
  const summary = { records: batches.reduce((total, batch) => total + batch.records.length, 0), areas: Object.fromEntries(coverage) };
  if (!process.argv.includes("--apply")) {
    console.log(JSON.stringify({ ok: true, mode: "dry-run", ...summary }));
    return;
  }
  if (process.env.HV_ALLOW_INTERNAL_DIRECTORY_PUBLICATION !== "1") throw new Error("HV_ALLOW_INTERNAL_DIRECTORY_PUBLICATION=1_REQUIRED");
  assertLocalDatabase();
  const actor = await localPublisher();
  const published = [];
  for (const batch of batches) published.push(await publishInternalDirectoryBatch(batch, actor));
  console.log(JSON.stringify({ ok: true, mode: "apply", ...summary, published }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
