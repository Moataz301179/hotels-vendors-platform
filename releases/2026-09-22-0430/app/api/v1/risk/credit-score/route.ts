/**
 * /api/v1/risk/credit-score
 * B2B credit risk — HotelsVendors Reliability Index (0-100) per hotel TRN.
 * Licensed to financial partners (Oliv, Suez Canal Bank, FRA funders).
 *
 * GET { trn } → reliability index + factor breakdown.
 */

import { NextRequest } from "next/server";
import { apiRoute, authenticate, success, error } from "@/lib/api-utils";
import { computeReliabilityIndex } from "@/lib/data-lake/engine";

/* Demo hotel credit profiles keyed by TRN (Tax Registration Number). */
const HOTEL_CREDIT: Record<string, { onTimePaymentPct: number; dockDisputeRate: number; etaClearanceDays: number; orderVolume: number }> = {
  "382-910-112": { onTimePaymentPct: 98, dockDisputeRate: 0.02, etaClearanceDays: 2, orderVolume: 340 },
  "512-889-003": { onTimePaymentPct: 88, dockDisputeRate: 0.08, etaClearanceDays: 4, orderVolume: 210 },
  "441-220-778": { onTimePaymentPct: 72, dockDisputeRate: 0.15, etaClearanceDays: 6, orderVolume: 96 },
};

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const trn = new URL(request.url).searchParams.get("trn") || "";
  if (!trn) return error("trn query param required (hotel Tax Registration Number)", 400);
  const profile = HOTEL_CREDIT[trn];
  if (!profile) return error("No credit profile found for this TRN", 404);
  const index = computeReliabilityIndex(trn, profile);
  return success({ index, note: "Reliability Index licensed to financial partners. 0-100; AAA=90+." });
});
