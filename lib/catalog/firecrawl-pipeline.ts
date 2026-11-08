/**
 * Firecrawl → HotelsVendors catalogue ingestion pipeline.
 *
 * Stages: discover → crawl → normalize → dedupe → image fetch → import.
 *
 * Guarantees:
 * - Idempotent: `sourceHash` is unique, so re-running updates records instead of
 *   duplicating them.
 * - Honest: scraped records are imported as source=ECOMMERCE, status=DRAFT,
 *   isVerified=false. They NEVER enter the buyer-facing catalogue, which
 *   requires ACTIVE + verified supplier.
 * - Separate: canonical product identity is kept apart from the supplier offer.
 * - No synthetic data: every record carries its sourceUrl and observedAt.
 * - Bounded: page and record caps are enforced at every stage.
 */

import { createHash } from "node:crypto";

export const FIRECRAWL_PROVIDER = "firecrawl";
export const IMPORT_MAX_PAGES = 25;
export const IMPORT_MAX_RECORDS = 200;
export const IMPORT_MAX_IMAGES = 60;

export interface RawCatalogRecord {
  name: string;
  price: number | null;
  currency: string;
  imageUrl: string | null;
  category: string | null;
  sourceUrl: string;
  sourceHash: string;
  sourceProvider: string;
  sourceObservedAt: string;
  spec: string | null;
  packSize: string | null;
  uom: string | null;
  moq: number | null;
}

export interface ImportSummary {
  pagesDiscovered: number;
  pagesCrawled: number;
  recordsExtracted: number;
  recordsNormalized: number;
  duplicatesSkipped: number;
  recordsImported: number;
  recordsUpdated: number;
  /** Records imported with no observed price — quoted, never priced. */
  quoteOnly: number;
  imagesDownloaded: number;
  imagesFailed: number;
  rejected: { name: string; reason: string }[];
}

export interface ImportResult {
  summary: ImportSummary;
  /** Never a fabricated "all products" claim — always the real coverage. */
  coverage: { crawledPages: number; extractedRecords: number; importedRecords: number };
  sample: Array<{ name: string; sourceUrl: string; price: number | null; status: string }>;
}

export function sourceHashFor(sourceUrl: string, name: string): string {
  return createHash("sha256").update(`${sourceUrl}::${name.trim().toLowerCase()}`).digest("hex").slice(0, 32);
}

/** Normalize a product name: collapse whitespace, strip marketing noise. */
export function normalizeName(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/[\u200e\u200f\u202a-\u202e]/g, "")
    .trim()
    .slice(0, 200);
}

/** Decode the HTML entities that appear in real supplier markup. */
export function decodeEntities(raw: string): string {
  return raw
    .replace(/&#0?38;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&[a-z]+;/gi, " ");
}

/** Parse a price from text, returning null when it cannot be read honestly. */
export function parsePrice(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d.,]/g, "").replace(/,/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}

/** Normalize a unit of measure to a small controlled vocabulary. */
export function normalizeUom(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.toLowerCase();
  if (/(piece|pc|unit|حبة|قطعة)/.test(value)) return "PIECE";
  if (/(kg|kilo|كيلو)/.test(value)) return "KG";
  if (/(g\b|gram|جرام)/.test(value)) return "GRAM";
  if (/(l\b|litre|liter|لتر)/.test(value)) return "LITRE";
  if (/(ml|مللى|مل)/.test(value)) return "ML";
  if (/(box|carton|كرتونة|علبة)/.test(value)) return "BOX";
  if (/(pack|باكيت|باقة)/.test(value)) return "PACK";
  if (/(roll|لفة|رول)/.test(value)) return "ROLL";
  return null;
}

/** Deduplicate by sourceHash, keeping the first occurrence. */
export function dedupeRecords(records: RawCatalogRecord[]): { unique: RawCatalogRecord[]; duplicates: number } {
  const seen = new Set<string>();
  const unique: RawCatalogRecord[] = [];
  let duplicates = 0;
  for (const record of records) {
    if (seen.has(record.sourceHash)) {
      duplicates += 1;
      continue;
    }
    seen.add(record.sourceHash);
    unique.push(record);
  }
  return { unique, duplicates };
}

/** A record is only importable if it has a real name and a real source URL. */
export function isImportable(record: RawCatalogRecord): { ok: boolean; reason?: string } {
  if (!record.name || record.name.length < 3) return { ok: false, reason: "name too short" };
  if (!/^https?:\/\//.test(record.sourceUrl)) return { ok: false, reason: "no source URL" };
  // A price is NOT required. A procurement hub routinely lists quote-only
  // products: the buyer sees the item and requests a quote. Records without a
  // price are imported as quote-only (`requestForQuote: true`), never as a
  // published price.
  return { ok: true };
}

/** True when the record carries no observed price and must be quoted, not priced. */
export function isQuoteOnly(record: RawCatalogRecord): boolean {
  return record.price == null;
}

export interface CrawlPageInput {
  url: string;
  /** Firecrawl API key; when absent a bounded direct fetch is used. */
  firecrawlKey?: string;
  fetchImpl?: typeof fetch;
}

export interface CrawledPage {
  url: string;
  records: RawCatalogRecord[];
  /** Why the page produced nothing, when it did. */
  note?: string;
}

/**
 * Crawl a single page and extract product records. Uses Firecrawl when a key is
 * configured; otherwise a bounded direct fetch with conservative HTML parsing.
 */
export async function crawlCatalogPage(input: CrawlPageInput): Promise<CrawledPage> {
  const { url, firecrawlKey } = input;
  const fetchImpl = input.fetchImpl ?? fetch;

  if (firecrawlKey) {
    const response = await fetchImpl("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${firecrawlKey}` },
      body: JSON.stringify({
        url,
        formats: ["markdown", "html"],
        onlyMainContent: true,
        timeout: 20_000,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) return { url, records: [], note: `firecrawl ${response.status}` };
    const payload = (await response.json()) as {
      data?: { markdown?: string; html?: string; metadata?: { title?: string } };
    };
    return { url, records: extractFromHtml(payload.data?.html ?? payload.data?.markdown ?? "", url) };
  }

  const response = await fetchImpl(url, {
    headers: { "User-Agent": "HotelsVendors-CatalogBot/1.0 (+https://hotelsvendors.com)" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) return { url, records: [], note: `http ${response.status}` };
  const html = await response.text();
  return { url, records: extractFromHtml(html, url) };
}

/** Names that are navigation chrome, never products. */
const NON_PRODUCT_NAMES = new Set([
  "explore", "scroll down", "scroll", "menu", "search", "login", "sign in", "register",
  "home", "about", "contact", "cart", "checkout", "wishlist", "compare", "filters",
  "next", "previous", "back", "more", "view all", "shop now", "read more", "close",
  "english", "arabic", "egp", "usd", "menu", "offers", "sale", "brands", "categories",
]);

function isPlausibleProductName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  if (normalized.length < 4) return false;
  if (NON_PRODUCT_NAMES.has(normalized)) return false;
  // Navigation/brand one-word labels are not products.
  if (normalized.split(/\s+/).length === 1 && normalized.length < 8) return false;
  return true;
}

/**
 * Conservative HTML extraction: product cards, JSON-LD Product blocks, and
 * table rows. Never invents a price or a name that is not on the page.
 */
export function extractFromHtml(html: string, pageUrl: string): RawCatalogRecord[] {
  const records: RawCatalogRecord[] = [];
  const observedAt = new Date().toISOString();

  // 1. JSON-LD Product blocks — the most reliable structured source.
  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1]) as Record<string, unknown> | Array<Record<string, unknown>>;
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item["@type"] !== "Product" && item["@type"] !== "product") continue;
        const offers = item.offers as { price?: string | number; priceCurrency?: string } | undefined;
        const name = typeof item.name === "string" ? decodeEntities(item.name) : null;
        if (!name) continue;
        const image = typeof item.image === "string" ? item.image : Array.isArray(item.image) ? (item.image[0] as string) : null;
        records.push({
          name: normalizeName(name),
          price: parsePrice(offers?.price != null ? String(offers.price) : null),
          currency: offers?.priceCurrency ?? "EGP",
          imageUrl: image,
          category: typeof item.category === "string" ? item.category : null,
          sourceUrl: pageUrl,
          sourceHash: sourceHashFor(pageUrl, name),
          sourceProvider: FIRECRAWL_PROVIDER,
          sourceObservedAt: observedAt,
          spec: typeof item.description === "string" ? item.description.slice(0, 300) : null,
          packSize: null,
          uom: null,
          moq: null,
        });
      }
    } catch {
      // Malformed JSON-LD is skipped, never guessed.
    }
  }

  // 2. Product-card heuristics: a heading/link with a nearby price.
  const cardPattern = /<(?:li|div|article)[^>]*class=["'][^"']*(?:product|item|card)[^"']*["'][^>]*>([\s\S]*?)<\/(?:li|div|article)>/gi;
  for (const match of html.matchAll(cardPattern)) {
    const block = match[1];
    const nameMatch = block.match(/<(?:h[1-6]|a|p|span)[^>]*>([\s\S]*?)<\/(?:h[1-6]|a|p|span)>/i);
    const priceMatch = block.match(/(?:EGP|جنيه|LE)\s*([\d.,]+)|([\d.,]+)\s*(?:EGP|جنيه|LE)/i);
    const imageMatch = block.match(/<img[^>]*src=["']([^"']+)["']/i);
    if (!nameMatch) continue;
    const name = normalizeName(decodeEntities(nameMatch[1].replace(/<[^>]+>/g, " ")));
    if (!isPlausibleProductName(name)) continue;
    // A card without a price is only a product if the block looks like a
    // product card (class hint) — otherwise it is navigation chrome.
    // A price is optional: quote-only products are valid catalogue records.
    // But a block that is neither priced nor obviously a product card is
    // navigation chrome — exclude it.
    const hasPrice = Boolean(priceMatch);
    const isProductCard = /product|item|sku|listing|listing-item/i.test(match[0]);
    if (!hasPrice && !isProductCard) continue;
    records.push({
      name,
      price: parsePrice(priceMatch ? priceMatch[1] ?? priceMatch[2] : null),
      currency: "EGP",
      imageUrl: imageMatch ? imageMatch[1] : null,
      category: null,
      sourceUrl: pageUrl,
      sourceHash: sourceHashFor(pageUrl, name),
      sourceProvider: FIRECRAWL_PROVIDER,
      sourceObservedAt: observedAt,
      spec: null,
      packSize: null,
      uom: null,
      moq: null,
    });
  }

  return records.slice(0, IMPORT_MAX_RECORDS);
}
