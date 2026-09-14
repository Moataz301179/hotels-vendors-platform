/**
 * Platform Fee Calculator — Centralized fee logic with idempotency
 * Hotels Vendors
 *
 * Revenue streams (aligned with COO strategy):
 *   1. TRANSACTION FEE: 2.5% (CORE) / 2.0% (PREMIER) / 1.5% (COASTAL)
 *   2. FACTORING REFERRAL: 0.5% flat on invoice value
 *   3. DOCUMENT PROCESSING: EGP 5 per ETA-compliant document
 *
 * ⚠️  Platform fee is deducted BEFORE factoring partner fee (G10: Hub-Revenue Priority).
 * ⚠️  HotelsVendors does NOT hold cash. Fees are invoiced separately.
 */

import type { HotelTier } from "@prisma/client";

// ─────────────────────────────────────────
// FEE TYPES
// ─────────────────────────────────────────

export type FeeType = "TRANSACTION" | "FACTORING_REFERRAL" | "DOCUMENT_PROCESSING";

export interface FeeCalculationResult {
  feeType: FeeType;
  amount: number;
  rate: number;
  baseAmount: number;
  breakdown: string;
  currency: string;
}

export interface FeeBreakdown {
  transactionFee: FeeCalculationResult;
  factoringReferralFee: FeeCalculationResult;
  documentProcessingFee: FeeCalculationResult;
  totalPlatformFees: number;
}

// ─────────────────────────────────────────
// TIER-BASED RATE TABLE
// ─────────────────────────────────────────

const TRANSACTION_RATES: Record<HotelTier, number> = {
  CORE: 0.025,      // 2.5%
  PREMIER: 0.020,   // 2.0%
  COASTAL: 0.015,   // 1.5%
};

const FACTORING_REFERRAL_RATE = 0.005; // 0.5% flat
const DOCUMENT_PROCESSING_FEE = 5.0;   // EGP 5 per document

// ─────────────────────────────────────────
// CORE CALCULATOR
// ─────────────────────────────────────────

/**
 * Calculate a single platform fee.
 *
 * @param invoiceTotal — The invoice gross amount in EGP
 * @param hotelTier — CORE | PREMIER | COASTAL (determines transaction fee rate)
 * @param feeType — The type of fee to calculate
 * @returns Fee calculation with amount, rate, and human-readable breakdown
 */
export function calculatePlatformFee(
  invoiceTotal: number,
  hotelTier: HotelTier,
  feeType: FeeType
): FeeCalculationResult {
  const currency = "EGP";

  switch (feeType) {
    case "TRANSACTION": {
      const rate = TRANSACTION_RATES[hotelTier];
      const amount = Math.round(invoiceTotal * rate * 100) / 100;
      return {
        feeType,
        amount,
        rate,
        baseAmount: invoiceTotal,
        breakdown: `Transaction fee: ${rate * 100}% of EGP ${invoiceTotal.toLocaleString()} (${hotelTier} tier) = EGP ${amount.toLocaleString()}`,
        currency,
      };
    }

    case "FACTORING_REFERRAL": {
      const amount = Math.round(invoiceTotal * FACTORING_REFERRAL_RATE * 100) / 100;
      return {
        feeType,
        amount,
        rate: FACTORING_REFERRAL_RATE,
        baseAmount: invoiceTotal,
        breakdown: `Factoring referral: ${FACTORING_REFERRAL_RATE * 100}% of EGP ${invoiceTotal.toLocaleString()} = EGP ${amount.toLocaleString()}`,
        currency,
      };
    }

    case "DOCUMENT_PROCESSING": {
      const quantity = Math.max(1, Math.ceil(invoiceTotal / invoiceTotal)); // 1 document per invoice
      const amount = DOCUMENT_PROCESSING_FEE * quantity;
      return {
        feeType,
        amount,
        rate: 0, // Flat fee, not percentage
        baseAmount: invoiceTotal,
        breakdown: `Document processing: EGP ${DOCUMENT_PROCESSING_FEE} × ${quantity} document(s) = EGP ${amount.toLocaleString()}`,
        currency,
      };
    }
  }
}

/**
 * Calculate all platform fees for an invoice.
 * Returns the complete fee breakdown with total.
 */
export function calculateFullFeeBreakdown(
  invoiceTotal: number,
  hotelTier: HotelTier,
  documentCount: number = 1
): FeeBreakdown {
  const transactionFee = calculatePlatformFee(invoiceTotal, hotelTier, "TRANSACTION");
  const factoringReferralFee = calculatePlatformFee(invoiceTotal, hotelTier, "FACTORING_REFERRAL");

  // Override document processing for multiple documents
  const docFeeRate = DOCUMENT_PROCESSING_FEE;
  const docAmount = docFeeRate * documentCount;
  const documentProcessingFee: FeeCalculationResult = {
    feeType: "DOCUMENT_PROCESSING",
    amount: docAmount,
    rate: 0,
    baseAmount: invoiceTotal,
    breakdown: `Document processing: EGP ${docFeeRate} × ${documentCount} document(s) = EGP ${docAmount.toLocaleString()}`,
    currency: "EGP",
  };

  const totalPlatformFees =
    transactionFee.amount + factoringReferralFee.amount + documentProcessingFee.amount;

  return {
    transactionFee,
    factoringReferralFee,
    documentProcessingFee,
    totalPlatformFees: Math.round(totalPlatformFees * 100) / 100,
  };
}

// ─────────────────────────────────────────
// IDEMPOTENT FEE APPLICATION
// ─────────────────────────────────────────

/**
 * Calculate and apply platform fees to an invoice record.
 * Uses the invoice ID as idempotency key — calling twice with the same
 * invoice ID returns the same fee without double-charging.
 *
 * Returns the fee breakdown that was applied (or already applied).
 */
export async function applyPlatformFees(
  invoiceId: string,
  hotelTier: HotelTier,
  documentCount: number = 1
): Promise<FeeBreakdown & { alreadyApplied: boolean }> {
  const { prisma } = await import("@/lib/prisma");

  // Check if fees already applied (idempotent)
  const existing = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { platformFee: true, platformFeeRate: true, total: true },
  });

  if (!existing) {
    throw new Error(`Invoice ${invoiceId} not found`);
  }

  const platformFee = Number(existing.platformFee);
  const platformFeeRate = Number(existing.platformFeeRate ?? 0.025);
  const invoiceTotal = Number(existing.total);

  // If platformFee already set and > 0, return existing breakdown
  if (platformFee > 0) {
    return {
      transactionFee: {
        feeType: "TRANSACTION",
        amount: platformFee,
        rate: platformFeeRate,
        baseAmount: invoiceTotal,
        breakdown: `Already applied: EGP ${platformFee.toLocaleString()}`,
        currency: "EGP",
      },
      factoringReferralFee: calculatePlatformFee(invoiceTotal, hotelTier, "FACTORING_REFERRAL"),
      documentProcessingFee: {
        feeType: "DOCUMENT_PROCESSING",
        amount: DOCUMENT_PROCESSING_FEE * documentCount,
        rate: 0,
        baseAmount: invoiceTotal,
        breakdown: `Document processing: EGP ${DOCUMENT_PROCESSING_FEE} × ${documentCount}`,
        currency: "EGP",
      },
      totalPlatformFees: platformFee,
      alreadyApplied: true,
    };
  }

  // Calculate and persist
  const breakdown = calculateFullFeeBreakdown(invoiceTotal, hotelTier, documentCount);

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      platformFee: breakdown.totalPlatformFees,
      platformFeeRate: TRANSACTION_RATES[hotelTier],
    },
  });

  return { ...breakdown, alreadyApplied: false };
}

// ─────────────────────────────────────────
// RATE TABLE EXPORT (for admin dashboards)
// ─────────────────────────────────────────

export const FEE_RATE_TABLE = {
  transaction: TRANSACTION_RATES,
  factoringReferral: FACTORING_REFERRAL_RATE,
  documentProcessing: DOCUMENT_PROCESSING_FEE,
} as const;
