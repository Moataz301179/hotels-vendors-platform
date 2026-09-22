/**
 * Storefront Delivery-Quoting — links a hotel's location to a corridor
 * schedule so the quote shows cost + timing at checkout/listing.
 *
 * Reuses lib/logistics/cost-matrix (quoteCorridor / arbitrageBestRate) so the
 * storefront and the ops engine stay consistent. Adds:
 *   - Egypt governorate/city → corridor classification
 *   - schedule table (daily express vs scheduled regular runs per corridor)
 *   - ETA estimate in hours/days
 */

import { arbitrageBestRate, quoteCorridor, ConsolidationQuote } from "@/lib/logistics/cost-matrix";

/* ── Corridor classification ─────────────────────────────────────────────── */
export const RESORT_DESTINATIONS = [
  "hurghada", "sharm el sheikh", "sharm", "el gouna", "makadi", "sahl hasheesh",
  "marsa alam", "soma bay", "taba", "nuweiba", "dahab", "safaga", "quseir",
];

export const NORTH_COAST = [
  "alexandria", "alex", "borg el arab", "north coast", "sahel", "el alamein",
  "ras el hekma", "matrouh", "sidi abd el-rahman",
];

export function classifyCity(city: string): { corridor: string; zone: "resort" | "north-coast" | "national" } {
  const c = (city || "").toLowerCase().trim();
  if (RESORT_DESTINATIONS.some((r) => c.includes(r))) {
    return { corridor: "Red Sea / Sinai Corridor", zone: "resort" };
  }
  if (NORTH_COAST.some((r) => c.includes(r))) {
    return { corridor: "North Coast Corridor", zone: "north-coast" };
  }
  if (c.includes("cairo") || c.includes("giza") || c.includes("6th of october") || c.includes("new cairo") || c.includes("nasr city")) {
    return { corridor: "Greater Cairo Corridor", zone: "national" };
  }
  return { corridor: "National Corridor", zone: "national" };
}

/* ── Delivery schedule per service ───────────────────────────────────────── */
export interface DeliverySchedule {
  corridor: string;
  service: "EXPRESS" | "REGULAR";
  cutoff: string;
  scheduleText: string;
  etaHoursMin: number;
  etaHoursMax: number;
}

export function scheduleFor(corridor: string, service: "EXPRESS" | "REGULAR"): DeliverySchedule {
  const express = ["daily express runs", "cutoff 16:00", "next-cycle delivery"];
  const regular = ["scheduled regular runs", "2–3×/week consolidated", "full-container optimized"];
  if (corridor.includes("Cairo")) {
    return service === "EXPRESS"
      ? { corridor, service, cutoff: "16:00", scheduleText: express.join(" · "), etaHoursMin: 2, etaHoursMax: 6 }
      : { corridor, service, cutoff: "Thu 12:00", scheduleText: regular.join(" · "), etaHoursMin: 24, etaHoursMax: 72 };
  }
  if (corridor.includes("Red Sea") || corridor.includes("Sinai")) {
    return service === "EXPRESS"
      ? { corridor, service, cutoff: "12:00", scheduleText: express.join(" · "), etaHoursMin: 18, etaHoursMax: 30 }
      : { corridor, service, cutoff: "Sun 14:00", scheduleText: regular.join(" · "), etaHoursMin: 48, etaHoursMax: 96 };
  }
  if (corridor.includes("North Coast")) {
    return service === "EXPRESS"
      ? { corridor, service, cutoff: "13:00", scheduleText: express.join(" · "), etaHoursMin: 10, etaHoursMax: 20 }
      : { corridor, service, cutoff: "Mon 12:00", scheduleText: regular.join(" · "), etaHoursMin: 36, etaHoursMax: 72 };
  }
  return service === "EXPRESS"
    ? { corridor, service, cutoff: "15:00", scheduleText: express.join(" · "), etaHoursMin: 8, etaHoursMax: 24 }
    : { corridor, service, cutoff: "Wed 12:00", scheduleText: regular.join(" · "), etaHoursMin: 48, etaHoursMax: 120 };
}

/* ── Combined storefront quote ───────────────────────────────────────────── */
export interface StorefrontQuote {
  destinationCity: string;
  corridor: string;
  zone: string;
  service: "EXPRESS" | "REGULAR";
  quote: ConsolidationQuote;
  schedule: DeliverySchedule;
  estimatedCostEGP: number;
  etaText: string;
}

/* Connected provider ids available for arbitration (mirrors ops config). */
const CONNECTED_PROVIDERS = ["bosta", "mylerz", "1trolley", "naqla", "r2s", "sprint"];

export function quoteDelivery(
  destinationCity: string,
  parcels: number,
  totalWeightKg: number,
  service: "EXPRESS" | "REGULAR" = "EXPRESS",
  preferredProvider?: string
): StorefrontQuote {
  const { corridor, zone } = classifyCity(destinationCity);
  let raw: ConsolidationQuote;
  try {
    raw = arbitrageBestRate(destinationCity, parcels, totalWeightKg, service, CONNECTED_PROVIDERS, preferredProvider) as unknown as ConsolidationQuote;
  } catch {
    raw = quoteCorridor(destinationCity, parcels, totalWeightKg, service, "bosta");
  }
  const schedule = scheduleFor(corridor, service);
  const etaText = service === "EXPRESS"
    ? `~${Math.ceil(schedule.etaHoursMin / 24)}–${Math.max(1, raw.transitDays[0] || 1)} day${(raw.transitDays[0] || 1) > 1 ? "s" : ""} (${schedule.scheduleText})`
    : `~${Math.ceil(schedule.etaHoursMin / 24)}–${Math.ceil(schedule.etaHoursMax / 24)} days (${schedule.scheduleText})`;
  return {
    destinationCity,
    corridor,
    zone,
    service,
    quote: raw,
    schedule,
    estimatedCostEGP: raw.discountedTotal,
    etaText,
  };
}
