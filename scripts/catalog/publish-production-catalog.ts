/**
 * Publishes the supplier-neutral operating catalog to the production Neon database.
 * It uses an existing platform administrator and does not create one.
 *
 * DATABASE_URL must be the production Neon URL.
 * HV_ALLOW_PRODUCTION_DIRECTORY_PUBLICATION=1 is required.
 */
import { prisma } from "@/lib/prisma";
import { publishInternalDirectoryBatch, validateInternalDirectoryBatch } from "@/lib/directory/publish-internal-batch";
import { loadOperatingCatalogBatches } from "@/lib/directory/operating-catalog-batches";

function assertProductionDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL_REQUIRED");
  const url = new URL(databaseUrl);
  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") throw new Error("PRODUCTION_DATABASE_PROTOCOL_REQUIRED");
  if (!url.hostname.endsWith(".neon.tech")) throw new Error("PRODUCTION_DATABASE_HOST_REQUIRED");
  if (url.searchParams.get("sslmode") !== "verify-full") throw new Error("PRODUCTION_DATABASE_SSL_REQUIRED");
}

async function productionPublisher() {
  const actor = await prisma.user.findFirst({
    where: { platformRole: "ADMIN", status: "ACTIVE", deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, tenantId: true, platformRole: true },
  });
  if (actor?.platformRole !== "ADMIN") throw new Error("ACTIVE_PLATFORM_ADMIN_REQUIRED");
  return { id: actor.id, tenantId: actor.tenantId, platformRole: "ADMIN" as const };
}

async function main() {
  if (process.env.HV_ALLOW_PRODUCTION_DIRECTORY_PUBLICATION !== "1") throw new Error("HV_ALLOW_PRODUCTION_DIRECTORY_PUBLICATION=1_REQUIRED");
  assertProductionDatabase();
  const batches = await loadOperatingCatalogBatches();
  for (const batch of batches) validateInternalDirectoryBatch(batch);
  const actor = await productionPublisher();
  const published = [];
  for (const batch of batches) published.push(await publishInternalDirectoryBatch(batch, actor));
  const records = published.reduce((total, batch) => total + batch.records, 0);
  console.log(JSON.stringify({ ok: true, records, batches: published.length }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
