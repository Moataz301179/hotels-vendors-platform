/**
 * Read-only catalog/supplier readiness report.
 *
 * This intentionally never writes to Prisma or promotes research candidates to
 * suppliers. It is the gate in front of a reviewed staging materialization:
 * source records must be unique, categorized, and provenance-tagged before
 * they can become public listings.
 *
 * Run: npx tsx scripts/catalog-readiness-report.ts
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

type JsonRecord = Record<string, unknown>;
type ProductCandidate = {
  sku?: unknown;
  name?: unknown;
  category?: unknown;
  supplier_id?: unknown;
  source?: unknown;
  sourceUrl?: unknown;
  provenance?: unknown;
};

const root = resolve(process.cwd());
const taxonomyPath = resolve(root, "data/staging/hospitality-catalog-taxonomy.v1.json");
const registerPath = resolve(root, "data/staging/egypt-hospitality-supplier-register.v1.json");
const marketPath = resolve(root, "data/egyptian-market-v2.json");

async function json(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

function string(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function main() {
  const [taxonomyRaw, registerRaw, marketRaw] = await Promise.all([
    json(taxonomyPath),
    json(registerPath),
    json(marketPath),
  ]);
  const taxonomy = taxonomyRaw as JsonRecord;
  const register = registerRaw as JsonRecord;
  const market = marketRaw as JsonRecord;
  const categories = Array.isArray(taxonomy.categories) ? taxonomy.categories : [];
  const candidates = Array.isArray(register.records) ? register.records : [];
  const products = Array.isArray(market.product_catalog) ? market.product_catalog as ProductCandidate[] : [];
  const target = typeof taxonomy.skuTarget === "number" ? taxonomy.skuTarget : 5000;

  const seen = new Map<string, number>();
  const invalid: string[] = [];
  const categoryCounts = new Map<string, number>();
  for (const [index, product] of products.entries()) {
    const sku = string(product.sku)?.toUpperCase();
    const name = string(product.name);
    const category = string(product.category)?.toUpperCase();
    if (!sku || !name || !category) {
      invalid.push(`product[${index}] missing sku/name/category`);
      continue;
    }
    seen.set(sku, (seen.get(sku) || 0) + 1);
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  }
  const duplicateSkus = [...seen.entries()].filter(([, count]) => count > 1).map(([sku]) => sku);
  const candidateStatus = string(register.status) || "UNKNOWN";
  const provenanceTagged = products.filter((product) => Boolean(string(product.source) || string(product.sourceUrl) || string(product.provenance))).length;
  const categoryTargets = categories.reduce((sum, category) => {
    const item = category as JsonRecord;
    return sum + (typeof item.targetSkus === "number" ? item.targetSkus : 0);
  }, 0);

  const report = {
    targetSkus: target,
    sourceCatalogRecords: products.length,
    uniqueSourceSkus: seen.size,
    duplicateSkuCount: duplicateSkus.length,
    invalidProductCount: invalid.length,
    provenanceTaggedCount: provenanceTagged,
    categoryCount: categories.length,
    categoryTargetSum: categoryTargets,
    supplierRegisterRecords: candidates.length,
    supplierRegisterStatus: candidateStatus,
    categoryCounts: Object.fromEntries([...categoryCounts.entries()].sort()),
    duplicateSkus,
    invalid,
    materializationReady: products.length >= target && duplicateSkus.length === 0 && invalid.length === 0 && provenanceTagged === products.length && candidateStatus === "VERIFIED_OPERATIONAL",
  };
  console.log(JSON.stringify(report, null, 2));
  if (!report.materializationReady) process.exitCode = 2;
}

void main();
