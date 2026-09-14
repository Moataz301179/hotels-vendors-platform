/**
 * /api/v1/analytics/market-share
 * Anonymized manufacturer category aggregation for Enterprise SaaS tiers.
 * GET  → per-category { GMV, avg unit price, brand share }.
 */

import { NextRequest } from "next/server";
import { apiRoute, authenticate, success } from "@/lib/api-utils";
import { marketShareByCategory } from "@/lib/data-lake/engine";

/* Anonymized brand × category volume feed (aggregated, no hotel PII). */
const FEED = [
  { category: "F_AND_B", brand: "BrandA", qty: 1200, priceEGP: 45 },
  { category: "F_AND_B", brand: "BrandB", qty: 800, priceEGP: 60 },
  { category: "F_AND_B", brand: "BrandC", qty: 400, priceEGP: 90 },
  { category: "CONSUMABLES", brand: "BrandA", qty: 2000, priceEGP: 12 },
  { category: "CONSUMABLES", brand: "BrandD", qty: 500, priceEGP: 20 },
  { category: "FFE", brand: "BrandE", qty: 150, priceEGP: 1450 },
  { category: "FFE", brand: "BrandA", qty: 60, priceEGP: 1800 },
  { category: "GUEST_SUPPLIES", brand: "BrandA", qty: 5000, priceEGP: 6 },
  { category: "GUEST_SUPPLIES", brand: "BrandF", qty: 1800, priceEGP: 9 },
];

export const GET = apiRoute(async (request: NextRequest) => {
  await authenticate(request);
  const rows = marketShareByCategory(FEED);
  const categories = [...new Set(rows.map((r) => r.category))];
  return success({ categories, rows, note: "Anonymized manufacturer aggregation — for Enterprise SaaS subscription tiers." });
});
