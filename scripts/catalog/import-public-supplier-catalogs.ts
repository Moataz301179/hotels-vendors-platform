/**
 * Read the public product catalogs that answered, store the company and any
 * price on the private receiving record, and publish only the product on the
 * hotel list.
 *
 * Run: npx tsx scripts/catalog/import-public-supplier-catalogs.ts
 */
import { prisma } from "@/lib/prisma";
import type { RawCatalogObservation } from "@/lib/catalog/receiving/types";
import { publishMaskedCatalogObservations } from "@/lib/directory/publish-masked-observations";
import { observedPackSize } from "@/lib/sourcing/mask-supplier-product";
import { fetchWordpressProducts } from "@/lib/sourcing/wordpress-public-catalog";

const catalogs = [
  { supplierName: "Juhayna Food Industries", siteUrl: "https://juhayna.com/", endpoint: "https://juhayna.com/wp-json/wp/v2/products" },
  { supplierName: "Arabian Food Industries (Domty)", siteUrl: "https://domty.org/", endpoint: "https://domty.org/wp-json/wp/v2/product" },
];

async function main() {
  const actor = await prisma.user.findFirst({
    where: { platformRole: "ADMIN", deletedAt: null },
    select: { id: true, tenantId: true, platformRole: true },
  });
  if (!actor || actor.platformRole !== "ADMIN") throw new Error("ADMIN_REQUIRED");
  const summaries = [];
  for (const catalog of catalogs) {
    const products = await fetchWordpressProducts(catalog.endpoint);
    const observations: RawCatalogObservation[] = products.map((product) => ({
      sourceUrl: catalog.siteUrl,
      productUrl: product.link,
      sourceName: catalog.supplierName,
      sourceType: "PUBLIC_PRODUCT_CATALOG",
      supplierName: catalog.supplierName,
      supplierWebsite: catalog.siteUrl,
      externalId: String(product.id),
      name: product.name,
      category: product.categories.join(" "),
      packSize: observedPackSize(product.name),
      unitPrice: null,
      currency: "EGP",
      images: product.imageUrl ? [product.imageUrl] : [],
    }));
    const result = await publishMaskedCatalogObservations({
      sourceUrl: catalog.siteUrl,
      sourceName: catalog.supplierName,
      observations,
      actor,
    });
    summaries.push({ site: new URL(catalog.siteUrl).hostname, fetched: products.length, published: result.published, held: result.held });
  }
  const publicNames = await prisma.directoryProfile.findMany({
    where: { candidate: { source: { sourceType: "MASKED_OBSERVED_SUPPLIER_PRODUCT" } }, deletedAt: null },
    select: { name: true, description: true, purchaseUnit: true },
    take: 1000,
  });
  const leaked = publicNames.filter((row) => /juhayna|domty|arabian food|egp|\bprice\b|https?:\/\//i.test(`${row.name} ${row.description} ${row.purchaseUnit ?? ""}`));
  console.log(JSON.stringify({ summaries, publicRows: publicNames.length, leakedPublicRows: leaked.length }, null, 2));
  if (leaked.length) process.exitCode = 1;
  await prisma.$disconnect();
}

void main();
