/**
 * Transparency Fee Calculator
 * Hotels Vendors
 *
 * ⚠️  IMPORTANT: This module is for DISPLAY AND TRANSPARENCY only.
 * HotelsVendors does NOT collect fees from factoring disbursements.
 *
 * The factoring partner deducts their own fees and pays the supplier directly.
 * HotelsVendors shows the supplier exactly what they'll receive and what the partner charges.
 *
 * HotelsVendors' actual revenue comes from:
 *  1. INVO SaaS subscriptions (monthly, suppliers pay to be listed)
 *  2. Document processing fees (per ETA invoice submitted)
 *  3. Marketplace commission (small % on completed orders)
 *  4. Factoring partner referral fees (invoiced to partners off-chain)
 */

import type { RiskTier } from "./risk-engine";
import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────
// TRANSPARENCY TYPES
// What the supplier sees before accepting factoring
// ─────────────────────────────────────────

export interface FactoringTransparencyBreakdown {
  // Invoice details
  invoiceAmount: number;
  currency: string;

  // What the partner pays the supplier (partner deducts their own fee)
  grossDisbursement: number;      // advanceRate × invoiceAmount
  partnerFee: number;             // discountRate × invoiceAmount (collected by partner)
  supplierReceives: number;       // What supplier actually gets (via partner, not platform)

  // What the hotel owes the partner later
  hotelRepaymentAmount: number;   // Full invoice amount (hotel pays partner, not platform)
  hotelRepaymentDueDate: string;

  // Platform fees (separate from factoring — these are SaaS/doc processing fees already paid)
  platformSaaS: { alreadyPaid: boolean }; // INVO subscription
  documentProcessingFee: number;     // Already charged per doc

  // Summary
  effectiveCostToSupplier: number;  // Partner fee only — no platform cut
  effectiveCostToHotel: number;     // Full invoice + partner financing cost
}

/**
 * Calculate a transparent breakdown for the supplier showing exactly what they'll receive.
 * This is DISPLAY-ONLY. The platform does not deduct anything from the disbursement.
 */
export function calculateFactoringBreakdown(params: {
  invoiceAmount: number;
  currency: string;
  advanceRate: number;       // From partner offer (e.g. 0.90)
  partnerDiscountRate: number; // From partner offer (e.g. 0.02)
  supplierSubscriptionTier: "STARTER" | "GROWTH" | "PROFESSIONAL";
  documentProcessingFeeAlreadyPaid: number;
  hotelPaymentTermsDays: number; // How long hotel has to repay partner
}): FactoringTransparencyBreakdown {
  const {
    invoiceAmount,
    currency,
    advanceRate,
    partnerDiscountRate,
    documentProcessingFeeAlreadyPaid,
    hotelPaymentTermsDays,
  } = params;

  const grossDisbursement = invoiceAmount * advanceRate;
  const partnerFee = invoiceAmount * partnerDiscountRate;
  const supplierReceives = grossDisbursement - partnerFee;

  const hotelRepaymentDueDate = new Date();
  hotelRepaymentDueDate.setDate(hotelRepaymentDueDate.getDate() + hotelPaymentTermsDays);

  return {
    invoiceAmount,
    currency,
    grossDisbursement,
    partnerFee,
    supplierReceives,
    hotelRepaymentAmount: invoiceAmount,
    hotelRepaymentDueDate: hotelRepaymentDueDate.toISOString(),
    platformSaaS: { alreadyPaid: true },
    documentProcessingFee: documentProcessingFeeAlreadyPaid,
    effectiveCostToSupplier: partnerFee,
    effectiveCostToHotel: invoiceAmount + partnerFee,
  };
}

// ─────────────────────────────────────────
// TCP (TOTAL COST OF PROCUREMENT) REPORT
// Sales tool for hotel CFOs — proves platform value vs offline
// ─────────────────────────────────────────

export interface TcpReport {
  hotelId: string;
  hotelName: string;
  orderId: string;
  orderTotal: number;

  // Offline "cheaper" price
  offlinePrice: number;

  // Hidden costs
  costOfCapital: number;
  etaPenaltyRisk: number;
  logisticsFragmentation: number;
  storageWaste: number;
  disputeLosses: number;
  totalOfflineCost: number;

  // Platform price (transparent)
  platformOrderTotal: number;
  platformDocumentFee: number;
  factoringPartnerFee: number; // What the partner charges — shown for transparency
  totalPlatformCost: number;

  // Savings
  absoluteSavings: number;
  percentageSavings: number;

  narrative: string;
}

/**
 * Generate a "Total Cost of Procurement" report for a hesitant hotel CFO.
 * Proves that the platform is cheaper than "cheaper" offline deals.
 */
export function generateTcpReport(params: {
  hotelId: string;
  hotelName: string;
  orderId: string;
  orderTotal: number;
  paymentTermsDays: number;
  hotelStorageCostMonthly: number;
  averageDisputeRate: number;
  etaPenaltyRate: number;
  supplierCostOfCapitalAnnual: number;
  factoringPartnerRate: number; // The partner's discount rate
  documentProcessingFee: number;
}): TcpReport {
  const {
    hotelId,
    hotelName,
    orderId,
    orderTotal,
    paymentTermsDays,
    hotelStorageCostMonthly,
    averageDisputeRate,
    etaPenaltyRate,
    supplierCostOfCapitalAnnual,
    factoringPartnerRate,
    documentProcessingFee,
  } = params;

  const offlinePrice = orderTotal;

  const costOfCapital = orderTotal * supplierCostOfCapitalAnnual * (paymentTermsDays / 365);
  const etaPenaltyRisk = orderTotal * etaPenaltyRate;
  const logisticsFragmentation = orderTotal * 0.042;
  const storageWaste = hotelStorageCostMonthly * 0.3;
  const disputeLosses = orderTotal * averageDisputeRate;

  const totalOfflineCost = offlinePrice + costOfCapital + etaPenaltyRisk + logisticsFragmentation + storageWaste + disputeLosses;

  const platformDocumentFee = documentProcessingFee;
  const factoringPartnerFee = orderTotal * factoringPartnerRate;
  const totalPlatformCost = orderTotal + platformDocumentFee + factoringPartnerFee;

  const absoluteSavings = totalOfflineCost - totalPlatformCost;
  const percentageSavings = totalOfflineCost > 0 ? (absoluteSavings / totalOfflineCost) * 100 : 0;

  const narrative = `
Your offline supplier quotes ${offlinePrice.toLocaleString()} EGP.
But when you factor in the ${paymentTermsDays}-day payment delay, your supplier is paying
${costOfCapital.toFixed(0)} EGP in cost of capital — which they silently pass
back to you through higher future prices. Add ETA compliance fines
(${etaPenaltyRisk.toFixed(0)} EGP risk), fragmented delivery costs
(${logisticsFragmentation.toFixed(0)} EGP), and storage waste
(${storageWaste.toFixed(0)} EGP/month), and your TRUE offline cost is
${totalOfflineCost.toLocaleString()} EGP.

With Hotels Vendors, you pay ${totalPlatformCost.toLocaleString()} EGP total
(order + ${platformDocumentFee} EGP document processing + ${factoringPartnerFee.toFixed(0)} EGP financing via our partner).
That is a ${percentageSavings.toFixed(1)}% savings — and your supplier gets paid
within 24-48 hours, strengthening your relationship and future pricing power.
  `.trim();

  return {
    hotelId,
    hotelName,
    orderId,
    orderTotal,
    offlinePrice,
    costOfCapital,
    etaPenaltyRisk,
    logisticsFragmentation,
    storageWaste,
    disputeLosses,
    totalOfflineCost,
    platformOrderTotal: orderTotal,
    platformDocumentFee,
    factoringPartnerFee,
    totalPlatformCost,
    absoluteSavings,
    percentageSavings,
    narrative,
  };
}

// ─────────────────────────────────────────
// BACKWARD-COMPATIBLE WRAPPER
// ─────────────────────────────────────────

export interface HubRevenueParams {
  invoiceId: string;
  partnerDiscountRate: number;
  advanceRate: number;
}

/**
 * Calculate hub revenue breakdown for a factoring operation.
 * Backward-compatible wrapper used by the legacy invoice factor route.
 */
export interface HubRevenueResult {
  grossAmount: number;
  platformFeeRate: number;
  netPlatformFee: number;
  platformFee: number;
  factoringFee: number;
  advanceRate: number;
  partnerDiscountRate: number;
  disbursementToSupplier: number;
  supplierDisbursement: number;
  note: string;
}

export async function calculateHubRevenue(params: HubRevenueParams): Promise<HubRevenueResult> {
  const { invoiceId, partnerDiscountRate, advanceRate } = params;

  // Fetch actual invoice amount from database
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { total: true },
  });
  const grossAmount = Number(invoice?.total ?? 0);

  const platformFeeRate = 0.025;
  const factoringFee = grossAmount * partnerDiscountRate;
  const netPlatformFee = grossAmount * platformFeeRate;

  const disbursementToSupplier = grossAmount * advanceRate - factoringFee;
  return {
    grossAmount,
    platformFeeRate,
    netPlatformFee,
    platformFee: netPlatformFee,
    factoringFee,
    advanceRate,
    partnerDiscountRate,
    disbursementToSupplier,
    supplierDisbursement: disbursementToSupplier,
    note: "Platform does not deduct from disbursement. Partner collects their own fee.",
  };
}
