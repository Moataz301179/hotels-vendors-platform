import { createHash } from "node:crypto";
import { ScrapeGraphAI } from "scrapegraph-js";
import { scoreProduct } from "@/lib/storefront/commerce";

export const SCRAPEGRAPH_SCHEMA_VERSION = "hv-supplier-catalog-v1";

export type ScrapeGraphProductObservation = {
  externalId?: string;
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  unitPrice?: number | null;
  currency?: string;
  stockQuantity?: number | null;
  moq?: number | null;
  images?: string[];
  productUrl?: string;
};

export type ScrapeGraphDiscovery = {
  sourceUrl: string;
  canonicalUrl: string;
  observedAt: string;
  schemaVersion: string;
  elapsedMs: number;
  supplierName: string;
  products: ScrapeGraphProductObservation[];
  responseHash: string;
};

export type MarketOfferObservation = {
  sourceUrl: string;
  sourceTitle: string;
  supplierName?: string;
  productName: string;
  unitPrice?: number | null;
  currency?: string;
  packSize?: string;
  leadTimeDays?: number | null;
  availability?: string;
  evidenceExcerpt: string;
};

type SearchSource = { url: string; title: string; content: string };

const productSchema = {
  type: "object",
  properties: {
    supplierName: { type: "string" },
    products: {
      type: "array",
      items: {
        type: "object",
        properties: {
          externalId: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          sku: { type: "string" },
          category: { type: "string" },
          unitPrice: { type: ["number", "null"] },
          currency: { type: "string" },
          stockQuantity: { type: ["number", "null"] },
          moq: { type: ["number", "null"] },
          images: { type: "array", items: { type: "string" } },
          productUrl: { type: "string" },
        },
        required: ["name"],
      },
    },
  },
  required: ["supplierName", "products"],
} as const;

function canonicalize(url: string): string {
  const parsed = new URL(url);
  parsed.hash = "";
  parsed.searchParams.sort();
  return parsed.toString();
}

function asProducts(value: unknown): ScrapeGraphProductObservation[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const name = String(row.name ?? "").trim();
    if (!name) return [];
    return [{
      externalId: row.externalId ? String(row.externalId) : undefined,
      name,
      description: row.description ? String(row.description) : undefined,
      sku: row.sku ? String(row.sku) : undefined,
      category: row.category ? String(row.category) : undefined,
      unitPrice: typeof row.unitPrice === "number" ? row.unitPrice : null,
      currency: row.currency ? String(row.currency).toUpperCase() : "EGP",
      stockQuantity: typeof row.stockQuantity === "number" ? row.stockQuantity : null,
      moq: typeof row.moq === "number" ? row.moq : null,
      images: Array.isArray(row.images) ? row.images.map(String).filter((image) => /^https?:\/\//i.test(image)) : [],
      productUrl: row.productUrl ? String(row.productUrl) : undefined,
    } satisfies ScrapeGraphProductObservation];
  });
}

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function jsonLdNodes(value: unknown): Record<string, unknown>[] {
  const node = record(value);
  if (!node) return Array.isArray(value) ? value.flatMap(jsonLdNodes) : [];
  const graph = Array.isArray(node["@graph"]) ? node["@graph"] : [];
  return [node, ...graph.flatMap(jsonLdNodes)];
}

function productFromJsonLd(value: Record<string, unknown>): ScrapeGraphProductObservation | null {
  const types = strings(value["@type"]);
  if (!types.some(type => type.toLocaleLowerCase() === "product")) return null;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!name) return null;
  const offer = Array.isArray(value.offers) ? record(value.offers[0]) : record(value.offers);
  const imageValues = strings(value.image).filter(image => /^https:\/\//i.test(image));
  const price = offer?.price ?? offer?.lowPrice;
  const stock = offer?.inventoryLevel;
  return {
    externalId: typeof value.productID === "string" ? value.productID : undefined,
    name,
    description: typeof value.description === "string" ? value.description.trim() : undefined,
    sku: typeof value.sku === "string" ? value.sku : undefined,
    category: typeof value.category === "string" ? value.category : undefined,
    unitPrice: typeof price === "number" ? price : typeof price === "string" && Number.isFinite(Number(price)) ? Number(price) : null,
    currency: typeof offer?.priceCurrency === "string" ? offer.priceCurrency.toUpperCase() : "EGP",
    stockQuantity: typeof stock === "number" ? stock : null,
    images: imageValues,
    productUrl: typeof value.url === "string" && /^https?:\/\//i.test(value.url) ? value.url : undefined,
  };
}

/**
 * Keyless fallback for sites that expose schema.org Product JSON-LD. It keeps
 * the acquisition queue usable when a third-party extraction provider is not
 * configured, while returning no rows rather than guessing missing fields.
 */
export async function discoverPublicCatalogJsonLd(input: { sourceUrl: string; supplierName?: string }): Promise<ScrapeGraphDiscovery> {
  const canonicalUrl = canonicalize(input.sourceUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  let response: Response;
  try {
    response = await fetch(canonicalUrl, { headers: { accept: "text/html,application/xhtml+xml", "user-agent": "HotelsVendorsCatalogResearch/1.0 (+https://www.hotelsvendors.com)" }, signal: controller.signal, redirect: "follow" });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new Error(`CATALOG_SOURCE_HTTP_${response.status}`);
  const html = await response.text();
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const nodes = scripts.flatMap(match => {
    try { return jsonLdNodes(JSON.parse(match[1])); } catch { return []; }
  });
  const byKey = new Map<string, ScrapeGraphProductObservation>();
  for (const node of nodes) {
    const product = productFromJsonLd(node);
    if (product) byKey.set(`${product.productUrl ?? ""}|${product.sku ?? ""}|${product.name}`, product);
  }
  const products = [...byKey.values()];
  const supplierName = input.supplierName?.trim() || new URL(response.url || canonicalUrl).hostname;
  const observedAt = new Date().toISOString();
  const responseHash = createHash("sha256").update(JSON.stringify({ canonicalUrl, supplierName, products })).digest("hex");
  return { sourceUrl: input.sourceUrl, canonicalUrl, observedAt, schemaVersion: "hv-public-jsonld-v1", elapsedMs: 0, supplierName, products, responseHash };
}

/**
 * Extracts public supplier catalog observations. This is deliberately server-only:
 * SGAI_API_KEY is never accepted from a request and the result is observation data,
 * not a verified supplier or a publishable Product record.
 */
export async function discoverSupplierCatalogWithScrapeGraph(input: {
  sourceUrl: string;
  supplierName?: string;
}): Promise<ScrapeGraphDiscovery> {
  const apiKey = process.env.SGAI_API_KEY;
  if (!apiKey) return discoverPublicCatalogJsonLd(input);

  const canonicalUrl = canonicalize(input.sourceUrl);
  const client = ScrapeGraphAI({ apiKey });
  const result = await client.extract({
    url: canonicalUrl,
    prompt: "Extract only publicly visible supplier catalog products. Never invent missing prices, stock, SKUs, suppliers, or categories. Return an empty products array when a field is not observable. Preserve product page URLs when present.",
    schema: productSchema,
    mode: "reader",
    fetchConfig: { mode: "js", timeout: 30000, stealth: true },
  });

  if (result.status !== "success" || !result.data) {
    throw new Error(result.error || "SCRAPEGRAPH_EXTRACTION_FAILED");
  }

  const payload = result.data as unknown as Record<string, unknown>;
  const raw = payload.results ?? payload;
  const extracted = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const products = asProducts(extracted.products);
  const supplierName = String(extracted.supplierName || input.supplierName || new URL(canonicalUrl).hostname).trim();
  const observedAt = new Date().toISOString();
  const responseHash = createHash("sha256").update(JSON.stringify({ canonicalUrl, supplierName, products })).digest("hex");

  return { sourceUrl: input.sourceUrl, canonicalUrl, observedAt, schemaVersion: SCRAPEGRAPH_SCHEMA_VERSION, elapsedMs: result.elapsedMs, supplierName, products, responseHash };
}

/** Search is invoked by a hotel product inquiry, not as a one-off admin import. */
export async function compareMarketOffers(input: { query: string; quantity: number }): Promise<{ query: string; observedAt: string; offers: MarketOfferObservation[]; elapsedMs: number }> {
  const apiKey = process.env.SGAI_API_KEY;
  if (!apiKey) throw new Error("SCRAPEGRAPH_NOT_CONFIGURED");
  const client = ScrapeGraphAI({ apiKey });
  const result = await client.search({
    query: `${input.query} hotel supplier Egypt price pack size lead time`,
    numResults: 8,
    format: "markdown",
    mode: "reader",
    prompt: "Extract only observable offers for the requested product. Do not estimate or invent price, pack size, stock, lead time, supplier, or currency. Return one offer per source. sourceUrl MUST exactly equal the result URL that supplied the product observation; omit the offer if that cannot be established.",
    schema: {
      type: "object",
      properties: {
        offers: { type: "array", items: { type: "object", properties: { sourceUrl: { type: "string" }, supplierName: { type: "string" }, productName: { type: "string" }, unitPrice: { type: ["number", "null"] }, currency: { type: "string" }, packSize: { type: "string" }, leadTimeDays: { type: ["number", "null"] }, availability: { type: "string" } }, required: ["productName", "sourceUrl"] } },
      },
      required: ["offers"],
    },
    fetchConfig: { mode: "js", timeout: 30000, stealth: true },
  });
  if (result.status !== "success" || !result.data) throw new Error(result.error || "SCRAPEGRAPH_SEARCH_FAILED");
  const data = result.data as { results?: Array<{ url: string; title: string; content: string }>; json?: Record<string, unknown> | null };
  const structured = Array.isArray(data.json?.offers) ? data.json?.offers : [];
  const fallback = data.results ?? [];
  const offers = marketOfferObservations(input.query, structured, fallback);
  return { query: input.query, observedAt: new Date().toISOString(), offers, elapsedMs: result.elapsedMs };
}

/**
 * Converts an extraction result into a buyer-safe market observation. An offer
 * is discarded unless it has an exact source URL returned by the search and a
 * product name that actually matches the requested requirement. This avoids
 * the dangerous shortcut of linking model rows to sources by list position.
 */
export function marketOfferObservations(query: string, rows: unknown[], sources: SearchSource[]): MarketOfferObservation[] {
  const sourceByUrl = new Map(sources.map((source) => [source.url, source]));
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const value = row as Record<string, unknown>;
    const sourceUrl = String(value.sourceUrl ?? "").trim();
    const source = sourceByUrl.get(sourceUrl);
    const productName = String(value.productName ?? "").trim();
    if (!source || !productName || scoreProduct(query, { name: productName }) === 0) return [];
    return [{ sourceUrl, sourceTitle: source.title, supplierName: value.supplierName ? String(value.supplierName) : undefined, productName, unitPrice: typeof value.unitPrice === "number" ? value.unitPrice : null, currency: value.currency ? String(value.currency).toUpperCase() : undefined, packSize: value.packSize ? String(value.packSize) : undefined, leadTimeDays: typeof value.leadTimeDays === "number" ? value.leadTimeDays : null, availability: value.availability ? String(value.availability) : undefined, evidenceExcerpt: source.content.slice(0, 500) } satisfies MarketOfferObservation];
  });
}

