/**
 * Product Ingestion Engine — headless scraper + API connectors + AI enrichment.
 *
 * Pipeline: RAW { title, category, unit, priceEGP, imageURL, sku }
 *   → normalize()       → clean brands/units, EGP parse
 *   → enrich()          → AI category mapping + spec cleaning + image fallback
 *   → upsertCatalog()   → deterministic DB write (idempotent by sku)
 */

import { prisma } from "@/lib/prisma";
import { getProductImage } from "@/lib/marketplace/product-images";

/* ── 1. Scraper Engine interface ─────────────────────────────────────────── */
export interface ScraperSource {
  id: string;
  name: string;
  baseUrl: string;
  /** Rate limit = min ms between requests */
  rateLimitMs?: number;
}

export interface ScrapedProduct {
  title: string;
  category?: string;
  unit?: string;
  priceEGP: number;
  imageURL?: string;
  sku?: string;
  supplierName?: string;
}

export interface ScraperEngine {
  readonly source: ScraperSource;
  /** Extract *raw* SKUs from a target (URL, query, category). */
  scrape(target: string): Promise<ScrapedProduct[]>;
}

/** Stub adapter for future real scrapers — same contract, no broken imports. */
export class BaseScraper implements ScraperEngine {
  constructor(public readonly source: ScraperSource) {}
  async scrape(_target: string): Promise<ScrapedProduct[]> {
    // Real implementations (Playwright/HTTP) override this.
    return [];
  }
}

/* ── 2. Named scraper registry ───────────────────────────────────────────── */
export const SCRAPER_REGISTRY: Record<string, () => ScraperEngine> = {
  "fmcg-supplier": () => new BaseScraper({ id: "fmcg-supplier", name: "FMCG Supplier Portal", baseUrl: "https://supplier.hotelsvendors.com", rateLimitMs: 400 }),
  "ose-distributor": () => new BaseScraper({ id: "ose-distributor", name: "OS&E Distributor", baseUrl: "https://ose-dist.hotelsvendors.com", rateLimitMs: 400 }),
  "hra-street": () => new BaseScraper({ id: "hra-street", name: "H&R-A Street Catalog", baseUrl: "https://hra.hotelsvendors.com", rateLimitMs: 600 }),
  "drop-api": () => new BaseScraper({ id: "drop-api", name: "Wholesale Drop API", baseUrl: "https://drop-api.hotelsvendors.com", rateLimitMs: 300 }),
};

/* ── 3. Category auto-mapping (AI enrichment rule table) ─────────────────── */
// Maps a raw title to the canonical ProductCategory enum used by the Product model.
const CATEGORY_RULES: { match: RegExp; code: string }[] = [
  { match: /(beef|chicken|meat|fish|seafood|vegetable|fruit|flour|rice|spice|beverage|juice|oil|dairy|cheese|bread|pastry|snack|chocolate|coffee|tea|sugar|pasta|kitchen|egg|produce|condiment|syrup|water|milk)/i, code: "F_AND_B" },
  { match: /(clean|detergent|disinfect|sanitiz|soap|towel|tissue|napkin|chemical|glove|trash|vacuum|mop|broom|waste|bag|paper|stationery)/i, code: "CONSUMABLES" },
  { match: /(sheet|pillow|bedding|blanket|duvet|curtain|linen|bathrobe|tablecloth|uniform|textile|shampoo|conditioner|lotion|toothbrush|razor|slipper|vanity|amenity|dispenser|shower cap|bath)/i, code: "GUEST_SUPPLIES" },
  { match: /(dryer|washer|fridge|furniture|chair|desk|sofa|bed|lamp|luggage|dresser|hairdryer|minibar|table|restaurant|equipment)/i, code: "FFE" },
  { match: /(hvac|filter|pump|motor|valve|pipe|bulb|lamp|led|switch|socket|cable|wire|panel|thermostat|compressor|plumbing|tool|pool|spa|chlorine|massage)/i, code: "SERVICES" },
  { match: /(router|modem|network|wifi|camera|cctv|printer|pos|tablet|laptop|server|phone|display|speaker)/i, code: "SERVICES" },
];

/** Map a raw title to a canonical hospitality category enum (ProductCategory). */
export function autoMapCategory(title: string): string {
  for (const rule of CATEGORY_RULES) {
    if (rule.match.test(title)) return rule.code;
  }
  return "CONSUMABLES"; // default: operating supplies & equipment
}

/* ── 4. Number normalization (EGP currency) ─────────────────────────────── */
export function parseEGP(value: string | number): number {
  if (typeof value === "number") return Math.round(value * 100) / 100;
  const clean = String(value).replace(/[^0-9.]/g, "");
  const n = parseFloat(clean);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

export function parseUnit(value?: string): string {
  if (!value) return "unit";
  const v = value.trim();
  if (/kg|kilo/i.test(v)) return "kg";
  if (/l|litre|liter/i.test(v)) return "L";
  if (/pc|piece|set/i.test(v)) return v.toLowerCase().startsWith("set") ? "set" : "pc";
  if (/ml/i.test(v)) return "ml";
  if (/cm/i.test(v)) return "cm";
  return "unit";
}

/* ── 5. AI enrichment filter ────────────────────────────────────────────── */
export interface EnrichmentInput {
  title: string;
  category?: string;
  unit?: string;
  priceEGP: number;
  imageURL?: string;
  sku?: string;
  supplierName?: string;
}

export interface EnrichedProduct {
  title: string;
  category: string;
  description: string;
  unit: string;
  unitPrice: number;
  imageURL: string;
  sku: string;
  supplierName: string;
}

export function enrichProduct(raw: EnrichmentInput, supplierTenantId: string): EnrichedProduct {
  // Clean title (trim, collapse spaces, strip noise)
  const title = raw.title.replace(/\s+/g, " ").trim();
  const category = (raw.category || autoMapCategory(title)).toUpperCase();
  const unit = parseUnit(raw.unit);
  const unitPrice = parseEGP(raw.priceEGP);
  const sku = raw.sku || `HV-${category}-${Math.abs(hash(title)).toString(36).toUpperCase().slice(0, 8)}`;

  // Image: use scraped one if valid http, else category-accurate resolver fallback
  const imgURL = raw.imageURL && /^https?:/.test(raw.imageURL)
    ? raw.imageURL
    : (() => { const r = getProductImage({ name: title, category }); return r.type === "url" ? r.src : ""; })();

  const description = `${title} — ${category} hospitality supply item, ${unit} unit.`;

  return { title, category, description, unit, unitPrice, imageURL: imgURL, sku, supplierName: raw.supplierName || "Verified Supplier" };
}

/* ── 6. Idempotent DB upsert (by sku within tenant) ─────────────────────── */
export async function upsertCatalog(products: EnrichedProduct[], supplierTenantId: string, sourceId: string, supplierId: string) {
  let created = 0; let updated = 0;
  for (const p of products) {
    try {
      const existing = await prisma.product.findFirst({
        where: { sku: p.sku, tenantId: supplierTenantId },
      });
      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: { name: p.title, description: p.description, category: p.category as any, unitOfMeasure: p.unit, unitPrice: p.unitPrice, images: p.imageURL ? JSON.stringify([p.imageURL]) : undefined },
        });
        updated++;
      } else {
        await prisma.product.create({
          data: {
            sku: p.sku, name: p.title, description: p.description, category: p.category as any,
            unitOfMeasure: p.unit, unitPrice: p.unitPrice, images: p.imageURL ? JSON.stringify([p.imageURL]) : undefined,
            stockQuantity: 100,
            tenantId: supplierTenantId, supplierId,
          },
        });
        created++;
      }
    } catch { /* skip unpersistable row */ }
  }
  return { created, updated, total: products.length };
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
