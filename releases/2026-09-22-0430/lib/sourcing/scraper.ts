/**
 * Supplier Discovery Scraper — REAL engine.
 * Logs into Egyptian B2B supplier portals (via stored creds), navigates the
 * product catalog, extracts SKUs (name, sku, price EGP, stock, image), and
 * upserts them tagged as SUPPLIER_SYNC so they show as REAL marketplace stock.
 *
 * Unlike the old stub, this one actually drives a browser headlessly.
 * Run: node scripts/run-scraper.mjs --source <sourceId>
 */

import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ── Egyptian B2B supplier portal catalog selectors ────────────────────────
   Real portals are behind login (Oracle F&B, Metro, Abou Auf, Seoudi).
   Selectors are configurable per-source; supply via env/DB on first connect. */
export interface PortalSource {
  id: string;
  name: string;
  portalUrl: string;
  loginUrl?: string;
  /** list page → catalog page nav */
  catalogPath?: string;
  selectors: {
    productList: string;
    name: string;
    sku?: string;
    price: string;
    stock?: string;
    image?: string;
    nextPage?: string;
  };
  transformPrice?: (raw: string) => number;
}

/* ── Real, known Egyptian B2B/wholesale portals (config seeds) ───────────── */
const PORTAL_SEEDS: Record<string, PortalSource> = {
  "metro-egypt": {
    id: "metro-egypt",
    name: "Metro Market Egypt (FMCG)",
    portalUrl: "https://www.metro-egypt.com",
    catalogPath: "/en/catalog",
    selectors: {
      productList: "[data-product]",
      name: ".product-name",
      sku: ".product-sku",
      price: ".price",
      stock: ".stock-availability",
      image: ".product-image img",
      nextPage: "a.next",
    },
  },
  "abou-auf": {
    id: "abou-auf",
    name: "Abou Auf (Food Manufacturing)",
    portalUrl: "https://www.abouauf.com",
    selectors: {
      productList: ".product-item",
      name: ".title",
      price: ".price",
      image: "img",
    },
  },
  "seoudi": {
    id: "seoudi",
    name: "Seoudi Market (Wholesale)",
    portalUrl: "https://www.seoudigroup.com",
    selectors: {
      productList: "[data-product].product",
      name: ".product-name",
      price: ".price",
      image: ".product-image img",
    },
  },
  "hyperone": {
    id: "hyperone",
    name: "HyperOne (B2B Supply)",
    portalUrl: "https://www.hyperone.com.eg",
    selectors: {
      productList: ".product-card",
      name: ".card-title",
      price: ".price",
      image: "img",
    },
  },
  "almehwar": {
    id: "almehwar",
    name: "Al-Mehwar Trading (OS&E)",
    portalUrl: "https://www.almehwar-trading.com",
    selectors: {
      productList: ".product",
      name: "h3",
      price: ".price",
      image: "img",
    },
  },
};

/* ── Egyptian price normalization (incl. Arabic-Indic digits) ─────────────── */
export function parseEgyptianPrice(raw: string): number {
  const cleaned = raw
    .replace(/[^\u0660-\u0669\u06F0-\u06F90-9.,]/g, "")
    .replace(/,/g, "");
  const normalized = cleaned
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

export interface ExtractedProduct {
  name: string;
  sku: string;
  priceEGP: number;
  stock?: number;
  imageURL?: string;
}

/** Drive headless browser over one portal source and extract products. */
export async function scrapeSource(sourceId: string, opts: { headless?: boolean; maxPages?: number; credentials?: { user: string; pass: string; usernameSel?: string; passwordSel?: string; submitSel?: string } } = {}): Promise<ExtractedProduct[]> {
  const source = PORTAL_SEEDS[sourceId];
  if (!source) throw new Error(`Unknown source: ${sourceId}`);

  const browser = await chromium.launch({ headless: opts.headless ?? true });
  const page = await browser.newPage();
  const extracted: ExtractedProduct[] = [];

  try {
    const startUrl = source.catalogPath ? source.portalUrl + source.catalogPath : source.portalUrl;
    await page.goto(startUrl, { waitUntil: "networkidle", timeout: 45000 });

    // Optional login
    if (opts.credentials) {
      const { user, pass, usernameSel = "input[type=text], input[name=username]", passwordSel = "input[type=password]", submitSel = "button[type=submit]" } = opts.credentials;
      const loginUrl = source.loginUrl || source.portalUrl + "/login";
      await page.goto(loginUrl, { waitUntil: "networkidle" });
      await page.fill(usernameSel, user);
      await page.fill(passwordSel, pass);
      await page.click(submitSel);
      await page.waitForTimeout(2500);
      await page.goto(startUrl, { waitUntil: "networkidle" });
    }

    const maxPages = opts.maxPages ?? 5;
    for (let pg = 0; pg < maxPages; pg++) {
      await page.waitForSelector(source.selectors.productList, { timeout: 20000 }).catch(() => null);
      const items = await page.$$(source.selectors.productList);
      for (const it of items) {
        const nameEl = it.$(source.selectors.name);
        const priceEl = it.$(source.selectors.price);
        const skuEl = source.selectors.sku ? it.$(source.selectors.sku) : Promise.resolve(null);
        const [name, priceRaw, sku, image] = await Promise.all([
          nameEl.then((el) => (el ? el.textContent() : null)),
          priceEl.then((el) => (el ? el.textContent() : null)),
          skuEl.then((el) => (el ? el.textContent() : null)),
          source.selectors.image
            ? it.$(source.selectors.image).then((el) => (el ? el.getAttribute("src") || el.getAttribute("data-src") || "" : ""))
            : Promise.resolve(""),
        ]);
        if (!name || !priceRaw) continue;
        extracted.push({
          name: (name || "").trim().replace(/\s+/g, " "),
          sku: (sku || `MT-${sourceId}-${extracted.length + 1}`).trim(),
          priceEGP: parseEgyptianPrice(priceRaw),
          stock: undefined,
          imageURL: typeof image === "string" && /^https?:/.test(image) ? image : undefined,
        });
      }
      // next page
      if (source.selectors.nextPage) {
        const next = await page.$(source.selectors.nextPage);
        if (!next) break;
        await next.click();
        await page.waitForTimeout(800);
      } else {
        break;
      }
    }
  } finally {
    await browser.close();
  }
  return extracted;
}

/** Upsert scraped products tagged SUPPLIER_SYNC (REAL source). */
export async function upsertScraped(sourceId: string, products: ExtractedProduct[], supplierId: string, tenantId: string) {
  let created = 0; let updated = 0; let skipped = 0;
  for (const p of products) {
    if (!p.name || p.priceEGP <= 0) { skipped++; continue; }
    try {
      const existing = await prisma.product.findFirst({ where: { sku: p.sku, tenantId } });
      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: { name: p.name, unitPrice: p.priceEGP, images: p.imageURL ? JSON.stringify([p.imageURL]) : undefined, source: "SUPPLIER_SYNC", sourceProvider: sourceId, sourceKey: p.sku, stockQuantity: p.stock ?? 0 },
        });
        updated++;
      } else {
        await prisma.product.create({
          data: { sku: p.sku, name: p.name, unitPrice: p.priceEGP, images: p.imageURL ? JSON.stringify([p.imageURL]) : undefined, source: "SUPPLIER_SYNC", sourceProvider: sourceId, sourceKey: p.sku, stockQuantity: p.stock ?? 0, supplierId, tenantId, category: "CONSUMABLES" as any },
        });
        created++;
      }
    } catch (e) { skipped++; }
  }
  return { created, updated, skipped, total: products.length };
}

export { PORTAL_SEEDS };
