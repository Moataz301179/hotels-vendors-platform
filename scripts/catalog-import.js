#!/usr/bin/env node
/**
 * Import the 94 Egyptian-market products into the live catalog:
 *  - directoryProfiles (published + APPROVED + PERMITTED) so the
 *    public marketplace catalog page renders them, with real per-product
 *    Wikimedia Commons images;
 *  - Product records (source MANUAL, status ACTIVE, pricingMode RFQ) so
 *    the marketplace API serves them RFQ-only and supplier-neutral.
 * Dry-run is NOT performed. Writes directly to the dev database.
 */
"use strict";

const fs = require("fs");
const path = require("path");

// Load the dev DATABASE_URL BEFORE PrismaClient initializes
const envLocal = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envLocal)) {
  for (const line of fs.readFileSync(envLocal, "utf8").split("\n")) {
    const m = line.match(/^DATABASE_URL=(.*)$/);
    if (m && !process.env.DATABASE_URL) process.env.DATABASE_URL = m[1];
  }
}

const { PrismaClient } = require("@prisma/client");
const { v4: cuid } = require("uuid");

const prisma = new PrismaClient();
const PROJECT = path.resolve(__dirname, "..");

const MAPPING = JSON.parse(fs.readFileSync(path.join(PROJECT, "data", "catalog-images", "mapping.json"), "utf8"));
const PRODUCTS = JSON.parse(fs.readFileSync(path.join(PROJECT, "data", "egyptian-market-v2.json"), "utf8"));
const CATALOG = PRODUCTS.product_catalog;

// ── Real identifiers (verified from live DB) ──────────────────────────────
const TENANT_ID = "cmuq222j30000crt7wk0wszll";   // MOataz (platform tenant)
const PUBLISHED_BY = "cmux7e4h80004cr3f9plk75bc"; // Moataz Ghani (OWNER)
const SUPPLIER_ID = "cmv5pr843000a8z6kap1rrjui"; // Fighter Flash (ACTIVE, verified, CORE)

// ── Approved-hotel category mapping (source → directory + Prisma enum) ───
const CAT_MAP = {
  fresh_produce:   { dir: "FOOD_BEVERAGE", prisma: "F_AND_B",  sub: "F&B / Fresh produce" },
  dairy:           { dir: "FOOD_BEVERAGE", prisma: "F_AND_B",  sub: "F&B / Dairy" },
  beverages:       { dir: "FOOD_BEVERAGE", prisma: "F_AND_B",  sub: "F&B / Beverages" },
  spices:          { dir: "FOOD_BEVERAGE", prisma: "F_AND_B",  sub: "F&B / Spices" },
  poultry:         { dir: "FOOD_BEVERAGE", prisma: "F_AND_B",  sub: "F&B / Poultry" },
  seafood:         { dir: "FOOD_BEVERAGE", prisma: "F_AND_B",  sub: "F&B / Seafood" },
  meat:            { dir: "FOOD_BEVERAGE", prisma: "F_AND_B",  sub: "F&B / Meat" },
  oils:            { dir: "FOOD_BEVERAGE", prisma: "F_AND_B",  sub: "F&B / Oils" },
  dates:           { dir: "FOOD_BEVERAGE", prisma: "F_AND_B",  sub: "F&B / Dates" },
  bakery:          { dir: "FOOD_BEVERAGE", prisma: "F_AND_B",  sub: "F&B / Bakery" },
  canned_goods:    { dir: "FOOD_BEVERAGE", prisma: "F_AND_B",  sub: "F&B / Canned goods" },
  confectionery:   { dir: "FOOD_BEVERAGE", prisma: "F_AND_B",  sub: "F&B / Confectionery" },
  hospitality_equipment: (sku) => {
    if (/detergent/i.test(sku)) return { dir: "HOUSEKEEPING", prisma: "CONSUMABLES", sub: "Housekeeping consumables" };
    return { dir: "FFE", prisma: "FFE", sub: "FFE / Equipment" };
  },
  linens:          { dir: "LINEN_TEXTILES", prisma: "GUEST_SUPPLIES", sub: "Linens & textiles" },
  amenities:       { dir: "GUEST_SUPPLIES", prisma: "GUEST_SUPPLIES", sub: "In-room amenities" },
  ceramics:        { dir: "GUEST_SUPPLIES", prisma: "GUEST_SUPPLIES", sub: "In-room tableware" },
  glassware:       { dir: "GUEST_SUPPLIES", prisma: "GUEST_SUPPLIES", sub: "In-room glassware" },
  paper_products:  { dir: "HOUSEKEEPING", prisma: "CONSUMABLES", sub: "Housekeeping supplies" },
  cleaning:        { dir: "HOUSEKEEPING", prisma: "CONSUMABLES", sub: "Housekeeping consumables" },
  uniforms:        { dir: "HOUSEKEEPING", prisma: "CONSUMABLES", sub: "Housekeeping uniforms" },
  packaging:       { dir: "HOUSEKEEPING", prisma: "CONSUMABLES", sub: "Packaging & disposables" },
  furniture:       { dir: "FFE", prisma: "FFE", sub: "FFE / Furniture" },
  handicrafts:     { dir: "FFE", prisma: "CONSUMABLES", sub: "FFE / Decorative" },
  cold_storage:    { dir: "FFE", prisma: "FFE", sub: "FFE / Cold chain" },
  logistics:       { dir: "SERVICES", prisma: "SERVICES", sub: "Hotel services" },
  building_materials: { dir: "ENGINEERING_MRO", prisma: "SERVICES", sub: "Engineering & maintenance" },
  electronics:     { dir: "ENGINEERING_MRO", prisma: "SERVICES", sub: "Engineering & maintenance" },
  carpets:         { dir: "FFE", prisma: "CONSUMABLES", sub: "FFE / Carpets" },
  pharmaceuticals: { dir: "ENGINEERING_MRO", prisma: "CONSUMABLES", sub: "Engineering & maintenance" },
};

// ── Helpers ───────────────────────────────────────────────────────────────
async function now() {
  const [d] = await prisma.$queryRaw`SELECT CURRENT_TIMESTAMP AS ts`;
  return d.ts;
}

/** Build a normalised public-facing description (source data carries no description). */
function publicDescription(name) {
  return `Reviewed reference — specify quantity, timing and delivery context in the procurement workspace. No commercial terms are published.`;
}

// ── Main import ───────────────────────────────────────────────────────────
async function main() {
  const t0 = Date.now();
  const results = [];
  let sourceId = null;

  // 1) Single shared DirectorySource (unique sourceUrl constraint) — idempotent
  let source = await prisma.directorySource.findFirst({
    where: { sourceUrl: "internal://hotel-harca/spec/egyptian-market-v2" },
  });
  if (!source) {
    source = await prisma.directorySource.create({
      data: {
        sourceUrl: "internal://hotel-harca/spec/egyptian-market-v2",
        sourceType: "INTERNAL_HOSPITALITY_SPECIFICATION",
        permissionStatus: "PERMITTED",
        permissionNote: "Curated Egyptian-market hospitality specification bundle (do not publish vendor identity).",
        observedAt: new Date(),
        refreshStatus: "COMPLETED",
      },
    });
  }
  sourceId = source.id;
  console.log("[1] DirectorySource:", source.id);

  for (let i = 0; i < CATALOG.length; i++) {
    const src = CATALOG[i];
    const sku = src.sku;
    const product = src;
    const entry = MAPPING.find((m) => m.sku === sku);
    if (!entry) {
      console.error(`  [${i + 1}/${CATALOG.length}] NO IMAGE MAPPING for ${sku}`);
      results.push({ sku, name: product.name, ok: false, reason: "missing image mapping" });
      continue;
    }
    // Idempotent: skip products that were already imported in a previous run
    const existing = await prisma.product.findUnique({ where: { sku: product.sku } });
    if (existing) {
      results.push({ sku: product.sku, name: product.name, ok: true, note: "already imported", productRecordId: existing.id });
      console.log(`  [${i + 1}/${CATALOG.length}] ${product.sku} already imported`);
      continue;
    }
    const imgUrl = entry.image_url;
    if (!imgUrl) {
      console.error(`  [${i + 1}/${CATALOG.length}] NO IMAGE URL for ${sku}`);
      results.push({ sku, name: product.name, ok: false, reason: "missing image url" });
      continue;
    }

    let mapping = CAT_MAP[product.category];
    if (typeof mapping === "function") mapping = mapping(sku);
    if (!mapping) {
      console.error(`  [${i + 1}/${CATALOG.length}] NO CAT MAP for ${sku} (${product.category})`);
      results.push({ sku, name: product.name, ok: false, reason: "category map gap" });
      continue;
    }
    const { dir: dirCategory, prisma: prismaCategory, sub: subcategory } = mapping;

    // 2) DirectoryCandidate
    const cand = await prisma.directoryCandidate.create({
      data: {
        sourceId,
        sourceRecordKey: sku,
        sourceFingerprint: sku,
        normalizedName: product.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(),
        searchText: `${product.name} ${dirCategory} ${subcategory} ${product.unit}`,
        itemType: "PRODUCT",
        name: product.name,
        category: dirCategory,
        subcategory,
        description: publicDescription(product.name),
        attributes: {},
        unitOfMeasure: product.unit,
        purchaseUnit: product.unit,
        images: [imgUrl],
        searchTerms: [product.category, dirCategory, product.unit, product.name.split("(")[0].trim()],
        sourceSnapshot: { ...product, image: imgUrl },
        reviewStatus: "APPROVED",
        reviewedAt: await now(),
        reviewedById: PUBLISHED_BY,
      },
    });

    // 3) DirectoryProfile (published + APPROVED + PERMITTED filters)
    const prof = await prisma.directoryProfile.create({
      data: {
        candidateId: cand.id,
        itemType: "PRODUCT",
        name: product.name,
        category: dirCategory,
        subcategory,
        description: publicDescription(product.name),
        attributes: {},
        unitOfMeasure: product.unit,
        purchaseUnit: product.unit,
        images: JSON.stringify([imgUrl]),
        searchTerms: [product.category, dirCategory, product.unit],
        searchText: `${product.name} ${dirCategory} ${subcategory}`,
        publicationStatus: "PUBLISHED",
        publishedAt: await now(),
        publishedById: PUBLISHED_BY,
      },
    });

    // 4) Product record (RFQ-only, supplier-neutral, marketplace API consumable)
    const productRecord = await prisma.product.create({
      data: {
        sku: product.sku,
        name: product.name,
        description: publicDescription(product.name),
        category: prismaCategory,
        subcategory,
        currency: "EGP",
        unitOfMeasure: product.unit,
        images: JSON.stringify([imgUrl]),
        source: "MANUAL",
        sourceProvider: "CURATED_CATALOG",
        sourceKey: imgUrl,
        status: "ACTIVE",
        supplierId: SUPPLIER_ID,
        tenantId: TENANT_ID,
        pricingMode: "RFQ",
        stockQuantity: 0,
        unitPrice: null,
        basePrice: null,
        minOrderQty: 1,
        leadTimeDays: 1,
      },
    });

    results.push({ sku, name: product.name, ok: true, image: imgUrl, dirCategory, prismaCategory, productRecordId: productRecord.id });
    console.log(`  [${i + 1}/${CATALOG.length}] ${sku} | ${product.name.substring(0, 46)} | ${dirCategory} | ${prismaCategory}`);
  }

  const t1 = Date.now();
  const written = fs.writeFileSync(
    path.join(PROJECT, "data", "catalog-import-results.json"),
    JSON.stringify({ results, importedAt: new Date().toISOString(), elapsedMs: t1 - t0 }, null, 2)
  );
  console.log(`\nDone: ${results.filter((r) => r.ok).length}/${CATALOG.length} imported in ${t1 - t0}ms`);
  console.log("Wrote data/catalog-import-results.json");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("IMPORT FAILED:", e.message);
  console.error(e.stack);
  process.exit(1);
});
