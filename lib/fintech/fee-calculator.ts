/**
 * Platform Fee Calculator — server write path.
 *
 * All arithmetic lives in `lib/fintech/fee-math.ts` (pure, client-safe).
 * This module only persists a calculated fee and is permission-gated:
 * calculating a fee is never an approval, and no mutation happens without
 * the caller already holding `invoice:update`.
 *
 * ⚠️  Platform fee is deducted BEFORE factoring partner fee (G10: Hub-Revenue Priority).
 * ⚠️  HotelsVendors does NOT hold cash. Fees are invoiced separately.
 */

import {
  calculateFullFeeBreakdown,
  calculatePlatformFee,
  fromCents,
  transactionRateBps,
  type FeeBreakdown,
  type HotelTier,
} from "./fee-math";

export * from "./fee-math";

export interface ApplyFeesArgs {
  invoiceId: string;
  hotelTier: HotelTier;
  documentCount?: number;
  /** Tenant that must own the invoice; a mismatch is refused before any write. */
  tenantId: string;
  /**
   * Reference to traceable owner authorization for the applied rate.
   * Without it the write is REFUSED — the internal Decision Log is a summary
   * label, not authorization, so no live fee may be posted.
   */
  authorizationEvidence?: string;
  /** Caller must already hold this permission; enforced before any write. */
  requirePermission: (permission: string) => Promise<void> | void;
}

export class FeeApplicationBlockedError extends Error {
  constructor() {
    super("Fee application is blocked: no traceable owner authorization for the rate.");
    this.name = "FeeApplicationBlockedError";
  }
}

/**
 * Calculate and persist platform fees for an invoice, idempotently.
 *
 * Guards, in order: permission, then record ownership/tenant. A generic
 * `invoice:update` check alone is not sufficient — the invoice must belong to
 * the caller's tenant or no mutation occurs.
 */
export async function applyPlatformFees(args: ApplyFeesArgs): Promise<
  FeeBreakdown & { alreadyApplied: boolean }
> {
  const { invoiceId, hotelTier, documentCount = 1, tenantId, authorizationEvidence, requirePermission } = args;

  // Permission is enforced before the tenant-scoped lookup.
  await requirePermission("invoice:update");

  // No live fee may be posted without traceable owner authorization for the rate.
  if (!authorizationEvidence || authorizationEvidence.trim().length === 0) {
    throw new FeeApplicationBlockedError();
  }

  const { prisma } = await import("@/lib/prisma");

  const existing = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId, deletedAt: null },
    select: { platformFee: true, platformFeeRate: true, total: true },
  });

  if (!existing) throw new Error(`Invoice ${invoiceId} not found in tenant ${tenantId}`);

  const platformFee = Number(existing.platformFee);
  const platformFeeRate = Number(existing.platformFeeRate ?? transactionRateBps("CORE") / 10_000);
  const invoiceTotal = Number(existing.total);

  if (platformFee > 0) {
    return {
      transactionFee: {
        feeType: "TRANSACTION",
        amount: platformFee,
        rate: platformFeeRate,
        baseAmount: invoiceTotal,
        breakdown: `Already applied: EGP ${platformFee.toLocaleString()}`,
        currency: "EGP",
        basis: "approved-tier-structure",
      },
      factoringReferralFee: calculatePlatformFee(invoiceTotal, hotelTier, "FACTORING_REFERRAL"),
      documentProcessingFee: {
        feeType: "DOCUMENT_PROCESSING",
        amount: fromCents(BigInt(500) * BigInt(documentCount)),
        rate: 0,
        baseAmount: invoiceTotal,
        breakdown: `Document processing (hypothetical flat fee): EGP 5.00 × ${documentCount}`,
        currency: "EGP",
        basis: "hypothetical",
      },
      claimedRateTotal: platformFee,
      hypotheticalTotal: fromCents(BigInt(500) * BigInt(documentCount)) + calculatePlatformFee(invoiceTotal, hotelTier, "FACTORING_REFERRAL").amount,
      illustrativeTotal: platformFee,
      chargeable: false,
      alreadyApplied: true,
    };
  }

  const breakdown = calculateFullFeeBreakdown(invoiceTotal, hotelTier, documentCount);

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      platformFee: breakdown.claimedRateTotal,
      platformFeeRate: transactionRateBps(hotelTier) / 10_000,
    },
  });

  return { ...breakdown, alreadyApplied: false };
}
