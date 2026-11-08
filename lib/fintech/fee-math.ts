/**
 * Pure platform-fee mathematics — no server-only imports.
 *
 * This module is safe to import from client components. All money is handled as
 * integer cents and all rates as integer basis points, so every result is exact
 * and reproducible. No binary floating-point rounding is used for payable figures.
 *
 * Revenue streams:
 *   1. TRANSACTION FEE: 2.5% (CORE) / 2.0% (PREMIER) / 1.5% (COASTAL)  [approved tier structure]
 *   2. FACTORING REFERRAL: 0.5% flat on invoice value                   [hypothetical until confirmed]
 *   3. DOCUMENT PROCESSING: EGP 5 per ETA-compliant document             [hypothetical until confirmed]
 *
 * ⚠️  HotelsVendors does NOT hold cash. Calculating a fee is never an approval.
 */

import type { HotelTier } from "@prisma/client";

export type { HotelTier };

export type FeeType = "TRANSACTION" | "FACTORING_REFERRAL" | "DOCUMENT_PROCESSING";

export interface FeeCalculationResult {
  feeType: FeeType;
  amount: number;
  rate: number;
  baseAmount: number;
  breakdown: string;
  currency: string;
  /** Rates not confirmed by an approved commercial term are labelled hypothetical. */
  basis: "approved-tier-structure" | "hypothetical";
}

export interface FeeBreakdown {
  transactionFee: FeeCalculationResult;
  factoringReferralFee: FeeCalculationResult;
  documentProcessingFee: FeeCalculationResult;
  /**
   * Sum of components computed at the tier rates recorded in the internal
   * Decision Log. This is NOT traceable owner authorization: the log is an
   * internal summary label with no signed term sheet behind it. Treat as an
   * ESTIMATE only.
   */
  claimedRateTotal: number;
  /** Sum of components with no approval evidence at all. Never a payable figure. */
  hypotheticalTotal: number;
  /** claimedRateTotal + hypotheticalTotal — illustrative only, never a charge. */
  illustrativeTotal: number;
  /** No fee in this system is chargeable until owner authorization is evidenced. */
  chargeable: false;
}

export class FeeInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeeInputError";
  }
}

// ─────────────────────────────────────────
// RATE TABLE (basis points, integer)
// ─────────────────────────────────────────

const TRANSACTION_RATES_BPS: Record<HotelTier, number> = {
  CORE: 250, // 2.5%
  PREMIER: 200, // 2.0%
  COASTAL: 150, // 1.5%
};

const FACTORING_REFERRAL_BPS = 50; // 0.5%
const DOCUMENT_PROCESSING_FEE_CENTS = BigInt(500); // EGP 5.00
const BPS_DENOMINATOR = BigInt(10_000);
const CENTS_DENOMINATOR = BigInt(100);
const MAX_INVOICE_CENTS = BigInt("100000000000"); // EGP 1,000,000,000 ceiling

export const FEE_RATE_TABLE = {
  transactionBps: TRANSACTION_RATES_BPS,
  factoringReferralBps: FACTORING_REFERRAL_BPS,
  documentProcessingCents: DOCUMENT_PROCESSING_FEE_CENTS,
} as const;

// ─────────────────────────────────────────
// DECIMAL-SAFE PRIMITIVES
// ─────────────────────────────────────────

/** Convert a decimal EGP amount to integer cents. Rejects non-finite/negative values. */
export function toCents(amount: number): bigint {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new FeeInputError("Invoice total must be a finite number.");
  }
  if (amount < 0) throw new FeeInputError("Invoice total cannot be negative.");
  const cents = BigInt(Math.round(amount * 100));
  if (cents > MAX_INVOICE_CENTS) {
    throw new FeeInputError("Invoice total exceeds the supported ceiling.");
  }
  return cents;
}

/** Convert integer cents back to a 2-decimal EGP number. */
export function fromCents(cents: bigint): number {
  return Number(cents) / Number(CENTS_DENOMINATOR);
}

/** Multiply integer cents by a basis-point rate using exact integer arithmetic. */
function applyBps(cents: bigint, bps: number): bigint {
  if (!Number.isInteger(bps) || bps < 0) {
    throw new FeeInputError("Rate must be a non-negative integer basis-point value.");
  }
  return (cents * BigInt(bps)) / BPS_DENOMINATOR;
}

function formatEgp(cents: bigint): string {
  return fromCents(cents).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function bpsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(2).replace(/\.00$/, "")}%`;
}

export function transactionRateBps(tier: HotelTier): number {
  if (!(tier in TRANSACTION_RATES_BPS)) {
    throw new FeeInputError(`Unknown hotel tier: ${String(tier)}`);
  }
  return TRANSACTION_RATES_BPS[tier];
}

// ─────────────────────────────────────────
// CORE CALCULATOR
// ─────────────────────────────────────────

/**
 * Calculate a single platform fee.
 *
 * @param invoiceTotal — invoice gross amount in EGP (finite, non-negative)
 * @param hotelTier — CORE | PREMIER | COASTAL
 * @param feeType — fee to calculate
 */
export function calculatePlatformFee(
  invoiceTotal: number,
  hotelTier: HotelTier,
  feeType: FeeType
): FeeCalculationResult {
  const cents = toCents(invoiceTotal);
  const currency = "EGP";

  switch (feeType) {
    case "TRANSACTION": {
      const bps = transactionRateBps(hotelTier);
      const feeCents = applyBps(cents, bps);
      return {
        feeType,
        amount: fromCents(feeCents),
        rate: bps / 10_000,
        baseAmount: fromCents(cents),
        breakdown: `Transaction fee: ${bpsToPercent(bps)} of EGP ${formatEgp(cents)} (${hotelTier} tier) = EGP ${formatEgp(feeCents)}`,
        currency,
        basis: "approved-tier-structure",
      };
    }

    case "FACTORING_REFERRAL": {
      const feeCents = applyBps(cents, FACTORING_REFERRAL_BPS);
      return {
        feeType,
        amount: fromCents(feeCents),
        rate: FACTORING_REFERRAL_BPS / 10_000,
        baseAmount: fromCents(cents),
        breakdown: `Factoring referral (hypothetical rate): ${bpsToPercent(FACTORING_REFERRAL_BPS)} of EGP ${formatEgp(cents)} = EGP ${formatEgp(feeCents)}`,
        currency,
        basis: "hypothetical",
      };
    }

    case "DOCUMENT_PROCESSING": {
      const feeCents = DOCUMENT_PROCESSING_FEE_CENTS;
      return {
        feeType,
        amount: fromCents(feeCents),
        rate: 0,
        baseAmount: fromCents(cents),
        breakdown: `Document processing (hypothetical flat fee): EGP ${formatEgp(feeCents)} × 1 document = EGP ${formatEgp(feeCents)}`,
        currency,
        basis: "hypothetical",
      };
    }
  }
}

/**
 * Calculate all platform fees for an invoice.
 */
export function calculateFullFeeBreakdown(
  invoiceTotal: number,
  hotelTier: HotelTier,
  documentCount = 1
): FeeBreakdown {
  if (!Number.isInteger(documentCount) || documentCount < 0) {
    throw new FeeInputError("Document count must be a non-negative integer.");
  }

  const transactionFee = calculatePlatformFee(invoiceTotal, hotelTier, "TRANSACTION");
  const factoringReferralFee = calculatePlatformFee(invoiceTotal, hotelTier, "FACTORING_REFERRAL");

  const cents = toCents(invoiceTotal);
  const docCents = DOCUMENT_PROCESSING_FEE_CENTS * BigInt(documentCount);
  const documentProcessingFee: FeeCalculationResult = {
    feeType: "DOCUMENT_PROCESSING",
    amount: fromCents(docCents),
    rate: 0,
    baseAmount: fromCents(cents),
    breakdown: `Document processing (hypothetical flat fee): EGP ${formatEgp(DOCUMENT_PROCESSING_FEE_CENTS)} × ${documentCount} document(s) = EGP ${formatEgp(docCents)}`,
    currency: "EGP",
    basis: "hypothetical",
  };

  const approvedCents = toCents(transactionFee.amount);
  const hypotheticalCents = toCents(factoringReferralFee.amount) + docCents;

  return {
    transactionFee,
    factoringReferralFee,
    documentProcessingFee,
    claimedRateTotal: fromCents(approvedCents),
    hypotheticalTotal: fromCents(hypotheticalCents),
    illustrativeTotal: fromCents(approvedCents + hypotheticalCents),
    chargeable: false,
  };
}

export { CENTS_DENOMINATOR };
