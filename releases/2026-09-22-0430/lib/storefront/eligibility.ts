/**
 * SME / "Factory-Direct" Tier — eligibility + route-to-market policy.
 *
 * Oliv factoring requires ~EGP 10M annual supplier revenue. Underrated SME
 * makers below that threshold can't access 48h factoring, but they still win a
 * route into hotel procurement. Their catalog is sold CASH-BASIS via two paths:
 *
 *   PATH A — Direct cash sale: any buyer (hotel OR supplier) buys COD /
 *            InstaPay / Paymob prepaid. No 90-day wait, no factoring needed.
 *   PATH B — Trade-desk resale: a FACTORING-ELIGIBLE supplier (>=10M, well
 *            scored) claims/aggregates the SME catalog, buys at wholesale cash,
 *            and re-sells into its own hotel channel with 48h factoring. The SME
 *            is paid cash up-front; the eligible vendor earns the route margin.
 *
 * Pure functions, no I/O — unit-testable.
 */

export const FACTORING_REVENUE_THRESHOLD = 10_000_000; // EGP, Oliv <10M ineligible

export type CreditBand = "sme-cash" | "factoring-eligible";
export type TradePath = "cash-direct" | "trade-desk-resale";

export interface SupplierEligibilityInput {
  annualRevenue?: number | null;
  rating?: number | null;
  tier?: string;
}

export interface BuyerEligibilityInput {
  annualRevenue?: number | null;
  rating?: number | null;
  isSupplier?: boolean;
  isHotel?: boolean;
}

/** Supplier credit band: factoring-eligible only if >=10M revenue. */
export function creditBandOf(s: SupplierEligibilityInput): CreditBand {
  const rev = Number(s.annualRevenue ?? 0);
  return rev >= FACTORING_REVENUE_THRESHOLD ? "factoring-eligible" : "sme-cash";
}

/** Can an SME product be sold cash-basis to any buyer? Always — that's Path A. */
export function isCashBasisProduct(band: CreditBand): boolean {
  return band === "sme-cash";
}

/** Path B: is this buyer eligible to be a trade-desk reseller (claim + re-sell)? */
export function canResellViaTradeDesk(b: BuyerEligibilityInput): boolean {
  if (!b.isSupplier) return false;
  const rev = Number(b.annualRevenue ?? 0);
  const rating = Number(b.rating ?? 0);
  return rev >= FACTORING_REVENUE_THRESHOLD && rating >= 4;
}

/** The two allowed trade paths for an SME (cash) product. */
export function allowedTradePaths(productBand: CreditBand, buyer: BuyerEligibilityInput): TradePath[] {
  if (productBand !== "sme-cash") return ["cash-direct"];
  const paths: TradePath[] = ["cash-direct"];
  if (canResellViaTradeDesk(buyer)) paths.push("trade-desk-resale");
  return paths;
}

export const SME_TIER_MESSAGE = {
  badging: "SME · Factory-Direct · Cash basis",
  pathA: "Buy cash — COD/InstaPay/Paymob prepaid. No 90-day wait, no factoring needed.",
  pathB: "Resell: eligible suppliers (≥EGP 10M, rating ≥4) can aggregate this catalog, buy wholesale cash, and re-sell to hotels with 48h factoring.",
};
