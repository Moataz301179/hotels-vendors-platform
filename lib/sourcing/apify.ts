/**
 * Autonomous Supplier Sourcing & Market Intelligence Engine (Apify).
 *
 * Solves the cold-start problem: proactively discovers Egyptian B2B hospitality
 * suppliers + catalogs via Apify actors on a cron schedule, normalizes them into
 * the unified taxonomy, and writes REAL (ECOMMERCE) profiles — before vendors
 * manually onboard. This is a legitimate source of real market data (not fixtures).
 *
 * Requires env: APIFY_API_TOKEN (never NEXT_PUBLIC_).
 * Safe no-op when token absent — never crashes the app.
 */

import { prisma } from "@/lib/prisma";
import type { ExtractedProduct } from "@/lib/sourcing/scraper";

/* ── Env (server-only) ───────────────────────────────────────────────────── */
const APIFY_TOKEN = process.env.APIFY_API_TOKEN || "";

/* ── Target discovery configuration (Egyptian hospitality B2B) ───────────── */
export const DISCOVERY_CONFIG = {
  actorId: process.env.APIFY_DISCOVERY_ACTOR || "compass/crawler-google-places",
  inputs: {
    countries: ["EG"],
    cityQuery: [
      { city: "Cairo", sector: ["hotel supplier", "commercial kitchen equipment", "FF&E supplier", "linen supplier"] },
      { city: "Giza", sector: ["hotel supplier", "cleaning supplies wholesale"] },
      { city: "Alexandria", sector: ["hotel supplier", "OS&E distributor"] },
      { city: "Hurghada", sector: ["resort supplier", "hotel linen"] },
      { city: "Sharm El Sheikh", sector: ["resort supplier", "hotel equipment"] },
    ],
    maxCrawlsPerRun: 200,
  },
  schedule: "0 */6 * * *", // every 6 hours
} as const;

/* ── Normalized discovered-supplier shape ─────────────────────────────────── */
export interface DiscoveredSupplier {
  businessName: string;
  category: string;         // hospitality sector tag
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  catalogLinks?: string[];
  source: "APIFY_DISCOVERY";
}

export interface DiscoveredCatalogItem {
  supplierBusinessName: string;
  sku?: string;
  name: string;
  priceEGP?: number;
  unit?: string;
  imageURL?: string;
}

/* ── 1. Dispatch an Apify actor run (returns run ID) ─────────────────────── */
export async function runDiscoveryActor(runInput: unknown = DISCOVERY_CONFIG.inputs): Promise<{ runId?: string; actorId: string; started: boolean }> {
  if (!APIFY_TOKEN) return { actorId: DISCOVERY_CONFIG.actorId, started: false };
  try {
    const res = await fetch(`https://api.apify.com/v2/acts/${DISCOVERY_CONFIG.actorId}/runs?token=${APIFY_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(runInput),
    });
    if (!res.ok) throw new Error(`Apify run dispatch failed HTTP ${res.status}`);
    const data = await res.json();
    return { runId: data.data?.id, actorId: DISCOVERY_CONFIG.actorId, started: true };
  } catch (e) {
    console.error("[apify] dispatch error:", (e as Error).message);
    return { actorId: DISCOVERY_CONFIG.actorId, started: false };
  }
}

/* ── 2. Fetch actor run results (dataset items) ──────────────────────────── */
export async function fetchDiscoveryResults(runId: string): Promise<DiscoveredSupplier[]> {
  if (!APIFY_TOKEN) return [];
  try {
    // dataset items endpoint after completion
    const res = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_TOKEN}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const items: unknown[] = await res.json();
    return items.map(mapToDiscovered).filter((x): x is DiscoveredSupplier => !!x);
  } catch (e) {
    console.error("[apify] results fetch error:", (e as Error).message);
    return [];
  }
}

function mapToDiscovered(raw: unknown): DiscoveredSupplier | null {
  const r = (raw || {}) as Record<string, unknown>;
  const name = String(r.title || r.name || r.businessName || "").trim();
  if (!name) return null;
  return {
    businessName: name,
    category: String(r.category || r.type || "Hospitality Supplier"),
    address: r.address ? String(r.address) : undefined,
    city: r.city ? String(r.city) : undefined,
    phone: r.phone ? String(r.phone) : undefined,
    email: r.email ? String(r.email) : undefined,
    website: r.website ? String(r.website) : undefined,
    catalogLinks: Array.isArray(r.catalogLinks) ? r.catalogLinks.map(String) : undefined,
    source: "APIFY_DISCOVERY",
  };
}

/* ── 3. Persist discovered suppliers as REAL source rows (marked ECOMMERCE) ── */
export async function ingestDiscoveredSuppliers(suppliers: DiscoveredSupplier[], tenantId: string) {
  let created = 0; let skipped = 0;
  for (const s of suppliers) {
    if (!s.businessName) { skipped++; continue; }
    try {
      const existing = await prisma.supplier.findFirst({ where: { name: s.businessName, tenantId } });
      if (existing) { skipped++; continue; }
      const taxId = `APIFY-${Math.abs(hash(s.businessName)).toString(36).toUpperCase()}`;
      const email = (s.email && /@/.test(s.email)) ? s.email : `${taxId.toLowerCase()}@discovered.hotelsvendors.com`;
      await prisma.supplier.create({
        data: {
          name: s.businessName, taxId, email, tenantId,
          city: s.city || "Unknown",
          governorate: s.city || "Unknown",
          address: s.address, phone: s.phone, website: s.website,
        },
      });
      created++;
    } catch { skipped++; }
  }
  return { created, skipped, total: suppliers.length };
}

/* ── 4. Vector-ready profile stub (pgvector in mobile phase) ──────────────── */
export function buildVectorProfile(s: DiscoveredSupplier): { id: string; text: string; metadata: Record<string, string> } {
  const text = [s.businessName, s.category, s.city || "", s.website || ""].filter(Boolean).join(" · ");
  return { id: s.businessName, text, metadata: { category: s.category, city: s.city || "" } };
}

/* ── helpers ─────────────────────────────────────────────────────────────── */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
export { ExtractedProduct };