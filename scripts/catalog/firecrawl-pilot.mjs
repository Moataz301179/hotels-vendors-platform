#!/usr/bin/env node
/**
 * Bounded Firecrawl → HV catalogue pilot.
 *
 * Usage:
 *   node scripts/catalog/firecrawl-pilot.mjs                 # discover + extract only (no writes)
 *   node scripts/catalog/firecrawl-pilot.mjs --import         # also import (requires an authenticated session)
 *
 * Reports REAL coverage: pages discovered, products extracted / imported /
 * rejected, duplicates, missing images and failures. Never claims "all products".
 */

import { crawlCatalogPage, dedupeRecords, isImportable, IMPORT_MAX_PAGES, IMPORT_MAX_RECORDS } from "../../lib/catalog/firecrawl-pipeline.ts";

// Egyptian hospitality / food-service supplier sources (bounded seed list).
const DEFAULT_SEEDS = [
  "https://www.misrfood.com/",
  "https://www.elbasha.com/",
  "https://www.khayrat.com/",
];

const args = process.argv.slice(2);
const doImport = args.includes("--import");
const seeds = args.filter((arg) => arg.startsWith("http"));

const targets = seeds.length > 0 ? seeds.slice(0, IMPORT_MAX_PAGES) : DEFAULT_SEEDS;

const pages = [];
const records = [];
const failures = [];

console.log(`\n=== HV catalogue pilot ===`);
console.log(`provider: ${process.env.FIRECRAWL_API_KEY ? "firecrawl" : "direct-fetch"}`);
console.log(`seeds: ${targets.length}\n`);

for (const url of targets) {
  try {
    const page = await crawlCatalogPage({ url, firecrawlKey: process.env.FIRECRAWL_API_KEY });
    pages.push({ url, records: page.records.length, note: page.note ?? null });
    records.push(...page.records);
    console.log(`  ${page.records.length > 0 ? "✓" : "•"} ${url} — ${page.records.length} records${page.note ? ` (${page.note})` : ""}`);
  } catch (error) {
    failures.push({ url, error: error instanceof Error ? error.message.slice(0, 160) : String(error) });
    console.log(`  ✗ ${url} — ${failures[failures.length - 1].error}`);
  }
}

const bounded = records.slice(0, IMPORT_MAX_RECORDS);
const { unique, duplicates } = dedupeRecords(bounded);
const rejected = [];
const importable = [];

for (const record of unique) {
  const check = isImportable(record);
  if (check.ok) importable.push(record);
  else rejected.push({ name: record.name || "(unnamed)", reason: check.reason ?? "unimportable" });
}

const missingImages = importable.filter((record) => !record.imageUrl).length;
const withPrice = importable.filter((record) => record.price != null).length;
const quoteOnly = importable.filter((record) => record.price == null).length;

console.log(`\n=== coverage (honest, bounded) ===`);
console.log(`pages discovered:    ${pages.length}`);
console.log(`pages with products: ${pages.filter((p) => p.records > 0).length}`);
console.log(`records extracted:   ${bounded.length}`);
console.log(`duplicates skipped:  ${duplicates}`);
console.log(`importable:          ${importable.length}`);
console.log(`rejected:            ${rejected.length}`);
console.log(`missing images:      ${missingImages}`);
console.log(`with a real price:   ${withPrice}`);
console.log(`quote-only (no price):${quoteOnly}`);
console.log(`failures:            ${failures.length}`);

if (rejected.length > 0) {
  console.log(`\n=== rejected sample ===`);
  for (const item of rejected.slice(0, 5)) console.log(`  - ${item.name}: ${item.reason}`);
}

console.log(`\n=== extracted sample ===`);
for (const record of importable.slice(0, 5)) {
  console.log(`  - ${record.name} | EGP ${record.price ?? "n/a"} | image: ${record.imageUrl ? "yes" : "no"} | ${record.sourceUrl}`);
}

if (doImport) {
  console.log(`\n--import requested. Run the authenticated API route instead:`);
  console.log(`  POST /api/v2/catalog/import  { "urls": ${JSON.stringify(targets)} }`);
  console.log(`The pilot script never writes to the database directly.`);
} else {
  console.log(`\nNo writes performed. Re-run with --import to see the authenticated import route.`);
}

console.log(`\nNote: imported records are DRAFT + unverified and never appear in the buyer catalogue`);
console.log(`until a human verifies product, supplier and image rights.\n`);
