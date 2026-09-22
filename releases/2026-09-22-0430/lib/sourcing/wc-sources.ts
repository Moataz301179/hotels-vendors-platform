/**
 * WooCommerce / WordPress REST source registry — REAL, verified-reachable public
 * Egyptian hospitality supplier catalog endpoints.
 *
 * NOTE (replacing the dead portal seeds): the old PORTAL_SEEDS in lib/sourcing/scraper.ts
 * (metro-egypt SSL-fails, abou-auf / seoudi / almehwar are dead DNS, hyperone 403) are
 * unreachable and are intentionally left in place because other code imports them. THIS
 * module is the verified-reachable public-source replacement. Each entry uses the public
 * `/wp-json/wp/v2/<postType>` REST API (no auth, no token, no Apify). No-FAKE-DATA rule:
 * products fetched here are tagged SUPPLIER_SYNC during the upsert (see scripts/run-scraper.mjs),
 * never FIXTURE.
 *
 * Verified live as of this writing:
 *   - EGYTL (https://egytl.com)  → `wp-json/wp/v2/product?per_page=<n>` returns 200 + real JSON.
 *     HTTP 200 confirmed. No public price in `wp/v2/product` → products land with unitPrice=0 and
 *     attributes.priceAvailable=false (listed but flagged). Do NOT use `/wp-json/wc/v3/products`
 *     (returns 401 Unauthorized).
 *   - ETTC, Al-Azima Linen, MTS, Adnanco → base hosts are reachable, but they do NOT expose a
 *     public product REST endpoint (no `product` post type under wp/v2). Registered here so the
 *     runner can still attempt them; the fetch will surface a non-200 / empty catalog gracefully.
 */

/** WordPress REST product row (public wp/v2 shape). */
export interface WpRestProduct {
  id: number;
  slug: string;
  link: string;
  type?: string;
  title?: { rendered?: string };
  content?: { rendered?: string };
  /** WooCommerce products under wp/v2 generally do NOT expose price/stock/thumbnail here. */
  price?: number | string | null;
  regular_price?: number | string | null;
  stock_quantity?: number | string | null;
  sku?: string;
  featured_media?: number;
  categories?: { id: number; name?: string; slug?: string }[];
  _embedded?: {
    "wp:term"?: Array<Array<{ name?: string; slug?: string }>>;
  };
  [key: string]: unknown;
}

/** Additional metadata surfaced about a product's availability of pricing/imagery. */
export interface WcProductAttributes {
  priceAvailable: boolean;
  priceCurrency?: string;
  externalId?: number;
  slug?: string;
}

/** Normalized, typed product candidate ready for upsert. supplierName = source name. */
export interface ProductCandidate {
  externalId: string;
  provider: string;
  title: string;
  description?: string;
  sku?: string;
  category: "F_AND_B" | "CONSUMABLES" | "GUEST_SUPPLIES" | "FFE" | "SERVICES";
  unitPrice: number;
  currency: "EGP";
  stockQuantity: number;
  moq?: number;
  supplierName: string;
  images?: string[];
  attributes?: WcProductAttributes;
  raw?: WpRestProduct;
}

export interface WcSource {
  id: string;
  name: string;
  baseUrl: string;
  /** Public WP REST product-list endpoint. */
  catalogApiUrl: string;
  /** Public WP REST product-category endpoint. */
  categoryApiUrl: string;
  /** WP post type served by catalogApiUrl (defaults to "product"). */
  postType?: string;
  /** Whether the public product REST endpoint returned 200 + real JSON when last verified. */
  verified: boolean;
  /** Domain/category hints for mapping raw products to the 5 ProductCategory enum values. */
  defaultCategory: ProductCandidate["category"];
}

/** Strips HTML tags (and collapses whitespace) from WordPress `*.rendered` fields. */
export function parseDescription(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#8217;/g, "'")
    .replace(/&#8230;/g, "…")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** Heuristic mapping from product title/description text to the 5 ProductCategory enum values. */
const CATEGORY_KEYWORDS: Array<[ProductCandidate["category"], RegExp]> = [
  ["F_AND_B", /(food|beverag|drink|juice|cooking|chef|kitchen|cold|refrigerat|display|bar|coffee|cater|hotelequip|hot&|warm|heater|grill|oven|coffee)/i],
  ["GUEST_SUPPLIES", /(amenity|guest|soap|shampoo|linen|towel|bed|lodging|bathrobe|slipper|room|bath)/i],
  ["FFE", /(furniture|table|chair|sofa|decor|light|equipment|lamp|rack|shelf|display|signage|cleaning|cooler|safe|washer)/i],
  ["CONSUMABLES", /(cup|plate|glass|crockery|cuttery|plastic|disposable|paper|bag|glove|tissue|napkin|straw|supply)/i],
  ["SERVICES", /(service|maintenance|install|repair|consult|training|cleaning service)/i],
];

export function mapCategory(input: string): ProductCandidate["category"] {
  const text = (input || "").toLowerCase();
  for (const [cat, re] of CATEGORY_KEYWORDS) if (re.test(text)) return cat;
  return "CONSUMABLES";
}

/** The verified-reachable public WC/wp source registry. */
export const WC_SOURCES: WcSource[] = [
  {
    id: "egytl",
    name: "EGYTL (Egyptian Hotel Equipment)",
    baseUrl: "https://egytl.com",
    catalogApiUrl: "https://egytl.com/wp-json/wp/v2/product",
    categoryApiUrl: "https://egytl.com/wp-json/wp/v2/product_cat",
    postType: "product",
    verified: true,
    defaultCategory: "FFE",
  },
  {
    id: "ettc",
    name: "ETTC Egypt (Tabletop & Hospitality)",
    baseUrl: "https://ettcegypt.com",
    catalogApiUrl: "https://ettcegypt.com/wp-json/wp/v2/product",
    categoryApiUrl: "https://ettcegypt.com/wp-json/wp/v2/product_cat",
    postType: "product",
    verified: false, // host reachable, no public product REST endpoint confirmed
    defaultCategory: "FFE",
  },
  {
    id: "alazima",
    name: "Al-Azima Linen (Hotel Linen)",
    baseUrl: "https://www.alazima-linen.com",
    catalogApiUrl: "https://www.alazima-linen.com/wp-json/wp/v2/product",
    categoryApiUrl: "https://www.alazima-linen.com/wp-json/wp/v2/product_cat",
    postType: "product",
    verified: false,
    defaultCategory: "GUEST_SUPPLIES",
  },
  {
    id: "mts",
    name: "MTS Hotel Supply",
    baseUrl: "https://erp.mtshotelsupply.com",
    catalogApiUrl: "https://erp.mtshotelsupply.com/wp-json/wp/v2/product",
    categoryApiUrl: "https://erp.mtshotelsupply.com/wp-json/wp/v2/product_cat",
    postType: "product",
    verified: false,
    defaultCategory: "CONSUMABLES",
  },
  {
    id: "adnanco",
    name: "Adnanco Egypt (F&B / Hotel Supply)",
    baseUrl: "https://www.adnanco-eg.com",
    catalogApiUrl: "https://www.adnanco-eg.com/wp-json/wp/v2/product",
    categoryApiUrl: "https://www.adnanco-eg.com/wp-json/wp/v2/product_cat",
    postType: "product",
    verified: false,
    defaultCategory: "CONSUMABLES",
  },
];

export function getWcSource(sourceId: string): WcSource | undefined {
  return WC_SOURCES.find((s) => s.id === sourceId);
}

/** Extract category hints from a WP REST row (_embedded wp:term or categories field). */
function collectTerms(p: WpRestProduct): string {
  const parts: string[] = [];
  if (Array.isArray(p.categories)) {
    for (const c of p.categories) if (c && (c.name || c.slug)) parts.push(c.name || c.slug!);
  }
  const embedded = p._embedded?.["wp:term"];
  if (Array.isArray(embedded)) {
    for (const group of embedded) {
      if (!Array.isArray(group)) continue;
      for (const t of group) if (t && (t.name || t.slug)) parts.push(t.name || t.slug!);
    }
  }
  return parts.join(" ");
}

/**
 * Normalize a single public WP REST product row into a typed ProductCandidate.
 * Handles title.rendered / content.rendered (HTML → plain text), link as external page,
 * and the common case where wp/v2 exposes NO public price (unitPrice=0, priceAvailable=false).
 */
export function toProductCandidate(
  raw: WpRestProduct,
  source: WcSource,
): ProductCandidate {
  const title = parseDescription(raw.title?.rendered) || `Product ${raw.slug || raw.id}`;
  const description = parseDescription(raw.content?.rendered);
  const terms = collectTerms(raw);
  const category = mapCategory(title + " " + description + " " + terms);

  // Public wp/v2 product rows rarely carry a usable price. Parse defensively.
  const rawPrice = raw.price ?? raw.regular_price;
  const parsedPrice =
    typeof rawPrice === "number" ? rawPrice : parseFloat(String(rawPrice ?? "").replace(/[^0-9.]/g, ""));
  const priceAvailable = Number.isFinite(parsedPrice) && parsedPrice > 0;

  const stockVal = raw.stock_quantity;
  const stockQuantity =
    typeof stockVal === "number" && Number.isFinite(stockVal) ? Math.max(0, Math.round(stockVal)) : 0;

  return {
    externalId: String(raw.id),
    provider: `wc-rest:${source.id}`,
    title,
    description: description || undefined,
    sku: raw.sku || undefined,
    category,
    unitPrice: priceAvailable ? parsedPrice! : 0,
    currency: "EGP",
    stockQuantity,
    supplierName: source.name,
    images: undefined,
    attributes: {
      priceAvailable,
      priceCurrency: priceAvailable ? "EGP" : undefined,
      externalId: raw.id,
      slug: raw.slug,
    },
    raw,
  };
}

/**
 * Fetch one page of a WooCommerce/wp public REST catalog and normalize to ProductCandidate[].
 * Throws on unreachable host / non-JSON so callers can degrade gracefully.
 */
export async function fetchCatalog(
  sourceOrId: WcSource | string,
  page = 1,
  perPage = 12,
  opts: { timeoutMs?: number } = {},
): Promise<ProductCandidate[]> {
  const source = typeof sourceOrId === "string" ? getWcSource(sourceOrId) : sourceOrId;
  if (!source) throw new Error(`Unknown WC source: ${sourceOrId}`);

  const url = new URL(source.catalogApiUrl);
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(perPage));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 25000);
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (res.status >= 400) {
      throw new Error(`${source.id}: HTTP ${res.status} for ${url}`);
    }
    const body: unknown = await res.json();
    if (!Array.isArray(body)) {
      throw new Error(`${source.id}: expected array from ${url}`);
    }
    return (body as WpRestProduct[]).map((p) => toProductCandidate(p, source));
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch all pages of a source catalog (bounded). Returns flattened candidates + fetch errors. */
export async function fetchAllCatalog(
  sourceOrId: WcSource | string,
  opts: { maxPages?: number; perPage?: number; timeoutMs?: number } = {},
): Promise<{ products: ProductCandidate[]; pages: number; errors: string[] }> {
  const source = typeof sourceOrId === "string" ? getWcSource(sourceOrId) : sourceOrId;
  if (!source) throw new Error(`Unknown WC source: ${sourceOrId}`);

  const maxPages = opts.maxPages ?? 50;
  const perPage = opts.perPage ?? 24;
  const products: ProductCandidate[] = [];
  const errors: string[] = [];
  let pages = 0;

  for (let page = 1; page <= maxPages; page++) {
    try {
      const batch = await fetchCatalog(source, page, perPage, { timeoutMs: opts.timeoutMs });
      if (!batch.length) break;
      products.push(...batch);
      pages++;
      if (batch.length < perPage) break; // last page
    } catch (e) {
      errors.push(String((e as Error).message));
      break;
    }
  }
  return { products, pages, errors };
}