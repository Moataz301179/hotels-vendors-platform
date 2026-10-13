#!/usr/bin/env node

/**
 * Import observations from the public MTS Odoo catalogue.
 *
 * Dry-run is the default. This script intentionally does not create Product
 * rows or Supplier rows. It writes only platform catalogue observations after
 * explicit --write, and only to an explicitly supplied tenant.
 */

import "dotenv/config";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { PrismaClient, CatalogSourceType, EvidenceClass } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const BASE_URL = "https://mtshotelsupplylive.odoo.com";
const SHOP_PATH = "/shop";
const USER_AGENT = "HotelsVendors-CatalogResearch/1.0 (+https://www.hotelsvendors.com)";

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0) return fallback;
  return process.argv[index + 1] ?? fallback;
}

const pages = Math.max(1, Math.min(200, Number(arg("pages", "1")) || 1));
const tenantId = arg("tenant-id", "");
const output = arg("out", "");
const writeMode = process.argv.includes("--write");

function absoluteUrl(value) {
  if (!value) return "";
  try { return new URL(value, BASE_URL).toString(); } catch { return ""; }
}

function decodeHtml(value) {
  return String(value ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#8217;/g, "'")
    .replace(/&#8230;/g, "…")
    .replace(/&#([0-9]+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function attr(tag, name) {
  const pattern = new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i");
  return tag.match(pattern)?.[1] ?? "";
}

function categoryFor(name, description) {
  const text = `${name} ${description}`.toLowerCase();
  if (/(towel|sheet|linen|textile|bed|mattress|pillow|blanket|robe)/.test(text)) return "Linen, Uniforms and Textiles";
  if (/(clean|detergent|disinfect|trash|waste|glove|mop|bucket|bin)/.test(text)) return "Housekeeping and Cleaning";
  if (/(food|beverage|coffee|kitchen|buffet|tray|glass|plate|cutlery|pan|oven)/.test(text)) return "Food and Beverage";
  if (/(pool|spa|garden|gym|leisure|recreation)/.test(text)) return "Facilities, Grounds and Recreation";
  if (/(wire|bulb|lamp|electrical|plumb|hvac|tool|maintenance|generator)/.test(text)) return "Engineering, Maintenance and Utilities";
  if (/(sofa|chair|table|furniture|fixture|lobby|curtain)/.test(text)) return "FF&E, Technology and Hotel Services";
  if (/(tv|wifi|router|speaker|inverter|pos|computer|technology)/.test(text)) return "FF&E, Technology and Hotel Services";
  return "Unclassified — review required";
}

function extractProducts(html, pageUrl) {
  const result = [];
  const cards = html.match(/<form\b[^>]*role=["']article["'][\s\S]*?<\/form>/gi) ?? [];
  for (const card of cards) {
    const formStart = card.match(/^<form\b[^>]*>/i)?.[0] ?? "";
    const name = decodeHtml(attr(formStart, "aria-label"));
    if (!name) continue;

    const linkMatch = card.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*title=["']([^"']*)["'][^>]*>/i)
      ?? card.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/i);
    const productUrl = absoluteUrl(linkMatch?.[1]);
    if (!productUrl) continue;

    const imageTag = card.match(/<img\b[^>]*>/i)?.[0] ?? "";
    const imageUrl = absoluteUrl(attr(imageTag, "src"));
    const description = decodeHtml(card.match(/<div\b[^>]*class=["'][^"']*oe_subdescription[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? "");
    const externalKey = productUrl.match(/-(\d+)(?:\?|$)/)?.[1] ?? productUrl;
    const observation = {
      externalKey,
      name,
      description: description || null,
      category: categoryFor(name, description),
      sourceUrl: productUrl,
      imageUrl: imageUrl || null,
      price: null,
      currency: null,
      imageRightsStatus: imageUrl ? "SOURCE_REVIEW_REQUIRED" : null,
      observedAt: new Date().toISOString(),
      sourcePage: pageUrl,
    };
    observation.sourceHash = createHash("sha256").update(JSON.stringify({
      sourceUrl: observation.sourceUrl,
      externalKey: observation.externalKey,
      name: observation.name,
      imageUrl: observation.imageUrl,
      price: observation.price,
    })).digest("hex");
    result.push(observation);
  }
  return result;
}

async function fetchPage(page) {
  const path = page === 1 ? SHOP_PATH : `${SHOP_PATH}/page/${page}`;
  const url = new URL(path, BASE_URL);
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT, accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`MTS page ${page} returned HTTP ${response.status}`);
  const html = await response.text();
  return { page, url: response.url, html, products: extractProducts(html, response.url) };
}

function report(observations, fetchedPages, errors) {
  const uniqueEvidence = new Set(observations.map((item) => item.sourceHash)).size;
  const uniqueProducts = new Set(observations.map((item) => `${item.name.toLowerCase()}|${item.category}`)).size;
  return {
    source: BASE_URL,
    fetchedPages,
    errors,
    observations: observations.length,
    uniqueEvidence,
    uniqueProductCandidates: uniqueProducts,
    pricesObserved: observations.filter((item) => item.price !== null).length,
    rfqRequired: observations.filter((item) => item.price === null).length,
    imagesObserved: observations.filter((item) => item.imageUrl).length,
    itemsPendingReview: observations.length,
    writeMode,
    tenantId: tenantId || null,
  };
}

async function ensureCatalogTables(prisma) {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('CatalogItem', 'CatalogSource', 'CatalogEvidence')
  `);
  const found = new Set(rows.map((row) => row.table_name));
  const missing = ["CatalogItem", "CatalogSource", "CatalogEvidence"].filter((name) => !found.has(name));
  if (missing.length) throw new Error(`Catalog tables are not migrated: ${missing.join(", ")}. Stop before writing.`);
}

async function writeObservations(observations) {
  if (!tenantId) throw new Error("--tenant-id is required with --write; no tenant fallback is allowed.");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required with --write.");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    await ensureCatalogTables(prisma);
    let createdItems = 0;
    let updatedItems = 0;
    let createdEvidence = 0;
    for (const item of observations) {
      const canonicalKey = [item.category, item.name].map((value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")).join("|");
      const source = await prisma.catalogSource.upsert({
        where: { tenantId_baseUrl: { tenantId, baseUrl: BASE_URL } },
        create: { tenantId, name: "MTS Hotel Supply public catalogue", sourceType: CatalogSourceType.SUPPLIER_SITE, baseUrl: BASE_URL, lastCheckedAt: new Date() },
        update: { lastCheckedAt: new Date() },
      });
      const existing = await prisma.catalogItem.findUnique({ where: { tenantId_canonicalKey: { tenantId, canonicalKey } }, select: { id: true } });
      const catalogItem = await prisma.catalogItem.upsert({
        where: { tenantId_canonicalKey: { tenantId, canonicalKey } },
        create: { tenantId, canonicalKey, name: item.name, category: item.category, description: item.description, imageUrl: item.imageUrl, imageSourceUrl: item.sourceUrl, imageRightsStatus: item.imageRightsStatus, status: "PENDING_REVIEW" },
        update: { lastObservedAt: new Date(), description: item.description ?? undefined, imageUrl: item.imageUrl ?? undefined, imageSourceUrl: item.sourceUrl, imageRightsStatus: item.imageRightsStatus ?? undefined },
      });
      if (existing) updatedItems++; else createdItems++;
      const evidence = await prisma.catalogEvidence.upsert({
        where: { tenantId_sourceHash: { tenantId, sourceHash: item.sourceHash } },
        create: { tenantId, catalogItemId: catalogItem.id, sourceId: source.id, externalKey: item.externalKey, sourceUrl: item.sourceUrl, sourceHash: item.sourceHash, observedName: item.name, imageUrl: item.imageUrl, observedAt: new Date(item.observedAt), confidence: 80, provenance: EvidenceClass.OBSERVED },
        update: { observedAt: new Date(item.observedAt), catalogItemId: catalogItem.id, sourceId: source.id },
      });
      if (evidence) createdEvidence++;
    }
    return { createdItems, updatedItems, evidenceUpserted: createdEvidence };
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

async function main() {
  const observations = [];
  const errors = [];
  const fetchedPages = [];
  for (let page = 1; page <= pages; page++) {
    try {
      const result = await fetchPage(page);
      fetchedPages.push({ page: result.page, url: result.url, extracted: result.products.length });
      observations.push(...result.products);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      break;
    }
  }

  const deduped = [...new Map(observations.map((item) => [item.sourceHash, item])).values()];
  const result = report(deduped, fetchedPages, errors);
  if (writeMode && deduped.length) result.write = await writeObservations(deduped);
  if (output) await writeFile(output, JSON.stringify({ report: result, observations: deduped }, null, 2));
  console.log(JSON.stringify(result, null, 2));
  if (errors.length) process.exitCode = 2;
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
