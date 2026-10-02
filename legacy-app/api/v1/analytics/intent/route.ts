/**
 * /api/v1/analytics/intent
 * Purchase-intent + procurement-cycle tracking.
 * GET  → reorder profiles + 14-day purchase intent alerts (per hotel group /* category).
 */

import { NextRequest } from "next/server";
import { apiRoute, authenticate, success } from "@/lib/api-utils";
import { computeReorderProfiles, purchaseIntentAlerts, OrderEvent } from "@/lib/data-lake/engine";

/* Demo feed of recent orders — production reads from OrderItem. */
const DEMO_ORDERS: OrderEvent[] = [
  { date: "2026-07-01", hotelGroupId: "meridian", category: "GUEST_SUPPLIES", sku: "ATT-0001", qty: 200, priceEGP: 7 },
  { date: "2026-06-15", hotelGroupId: "meridian", category: "GUEST_SUPPLIES", sku: "ATT-0001", qty: 200, priceEGP: 7 },
  { date: "2026-06-01", hotelGroupId: "meridian", category: "CONSUMABLES", sku: "ATT-0400", qty: 100, priceEGP: 45 },
  { date: "2026-07-10", hotelGroupId: "palm-hurghada", category: "F_AND_B", sku: "ATT-0500", qty: 50, priceEGP: 320 },
  { date: "2026-06-20", hotelGroupId: "palm-hurghada", category: "F_AND_B", sku: "ATT-0500", qty: 50, priceEGP: 320 },
  { date: "2026-07-05", hotelGroupId: "steigen-sharm", category: "FFE", sku: "ATT-0600", qty: 8, priceEGP: 1450 },
  { date: "2026-06-05", hotelGroupId: "steigen-sharm", category: "FFE", sku: "ATT-0600", qty: 8, priceEGP: 1450 },
];

export const GET = apiRoute(async (request: NextRequest) => {
  await authenticate(request);
  const profiles = computeReorderProfiles(DEMO_ORDERS);
  const alerts = purchaseIntentAlerts(profiles, 14);
  return success({ hotelGroups: [...new Set(DEMO_ORDERS.map((o) => o.hotelGroupId))], reorderProfiles: profiles, purchaseIntentAlerts: alerts });
});
