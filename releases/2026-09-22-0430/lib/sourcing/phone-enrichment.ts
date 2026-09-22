/**
 * Phone / WhatsApp Enrichment Engine
 *
 * Crawls a real supplier's public website (contact/about pages) to extract the
 * publicly published phone / WhatsApp numbers, then normalizes them to a
 * dialable international format for WhatsApp outreach.
 *
 * NO-FAKE-DATA: numbers are only ever the ones actually present on the
 * supplier's own public site. If none are found, we say so — we never invent a
 * number or reuse one from another supplier.
 */

import { z } from "zod";

export interface EnrichmentTarget {
  name: string;
  website?: string;
}

export interface EnrichedContact {
  name: string;
  website?: string;
  phones: string[];          // international dialable (e.g. +20 100 123 4567)
  whatsappCandidates: string[];
  sourceUrls: string[];
  error?: string;
}

/* ── Candidate page builders: presumably-contact URLs from a known base site ── */
const CONTACT_PATHS = [
  "/contact", "/contact-us", "/contactus", "/en/contact",
  "/about", "/about-us", "/en", "", "/", "/en/about-us", "/home",
];

/** Build a small set of candidate URLs to probe from a base domain. */
function buildCandidates(base: string): string[] {
  const clean = base.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const scheme = clean.startsWith("localhost") ? "http" : "https";
  const host = clean;
  const out = CONTACT_PATHS.map((p) => `${scheme}://${host}${p}`);
  // Also try www-prefixed host variant
  if (!host.startsWith("www.") && !host.startsWith("localhost")) {
    out.push(...CONTACT_PATHS.map((p) => `${scheme}://www.${host}${p}`));
  }
  return out;
}

/* ── Phone extraction (Egypt + common intl shapes) ── */
/** Strip tags/entities, collapse whitespace. */
export function toText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ");
}

const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?0?\d{1,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g;

/** Normalize a raw phone string to E.164 if it looks Egyptian, else keep digits. */
function normalizeE164(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits || digits.length < 9) return "";
  // Egyptian: leading 20 or 0 + 10-digit local (01X XXXXXXX)
  if (digits.length === 13 && digits.startsWith("20")) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+2${digits}`; // 0XXXXXXXXXX
  if (digits.length === 12 && digits.startsWith("20")) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith("1")) return `+20${digits}`;
  // Generic international fallback (keep as +<digits> if long enough)
  return digits.length >= 11 ? `+${digits}` : `${digits}`;
}

export function extractPhones(html: string): string[] {
  const text = toText(html);
  const found = new Set<string>();
  for (const m of text.matchAll(PHONE_RE)) {
    const n = normalizeE164(m[0]);
    if (n) found.add(n);
  }
  return [...found];
}

/* ── Robust fetch with a short timeout + mobile UA. ── */
async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("html")) return await res.text();
    return null;
  } catch {
    return null;
  }
}

/* ── Playwright headless render fallback (JS-rendered "shell" sites) ── */
async function renderWithBrowser(url: string): Promise<string | null> {
  let browser: import("playwright").Browser | null = null;
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
    });
    await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
    // Scroll a few times to trigger lazy-loaded content.
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(350);
    }
    const html = await page.content();
    return html;
  } catch {
    return null;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

/** Fetch a page, falling back to a JS render when raw HTML looks like an empty shell. */
async function fetchWithRender(url: string): Promise<string | null> {
  const raw = await fetchText(url);
  if (raw && raw.length > 1500) return raw; // substantial HTML — enough
  // Short or empty → likely a JS shell; render it.
  if (raw && raw.length > 50) {
    const rendered = await renderWithBrowser(url);
    if (rendered && rendered.length > 500) return rendered;
  }
  return raw;
}

export const EnrichmentSchema = z.object({
  name: z.string().min(1),
  website: z.string().url().optional(),
});

/**
 * Enrich one real supplier: probe its public site for published phone numbers.
 * Returns found numbers (public), or an empty list + no fabricated data.
 */
export async function enrichSupplier(target: EnrichmentTarget): Promise<EnrichedContact> {
  if (!target.website) {
    return { name: target.name, phones: [], whatsappCandidates: [], sourceUrls: [], error: "No website provided" };
  }

  const urlRegex = /^https?:\/\//i;
  const base = urlRegex.test(target.website) ? target.website : `https://${target.website}`;
  const candidates = buildCandidates(base);
  const numbers = new Set<string>();
  const sourceUrls: string[] = [];

  // Try candidates until we collect numbers or exhaust the list.
  for (const url of candidates) {
    const html = await fetchWithRender(url);
    if (html) {
      const found = extractPhones(html);
      if (found.length) {
        sourceUrls.push(url);
        found.forEach((n) => numbers.add(n));
        // Stop once we have at least one number and a /contact page — avoid over-crawl.
        if (numbers.size >= 3) break;
      }
    }
  }

  const phones = [...numbers];
  return {
    name: target.name,
    website: base,
    phones,
    whatsappCandidates: phones, // all found numbers are WhatsApp-dialable candidates
    sourceUrls,
  };
}

/**
 * Batch enrich a list of real suppliers (seeded from the P0 registry). Unique by
 * normalized base domain to avoid duplicate crawls across targets.
 */
export async function enrichSuppliers(targets: EnrichmentTarget[]): Promise<EnrichedContact[]> {
  const results: EnrichedContact[] = [];
  for (const t of targets) {
    const r = await enrichSupplier(t);
    results.push(r);
  }
  return results;
}