/**
 * Risk Engine — Credit Scoring + Smart Fix System
 * Hotels Vendors Fintech Layer
 *
 * Computes composite risk scores for hotels and generates autonomous
 * "Smart Fixes" when credit limits or risk tiers block orders.
 */

import { prisma } from "@/lib/prisma";
import { checkCreditLimit } from "@/lib/credit-gate";
import { checkBiasInRiskAssessment } from "@/lib/ai/explainability";

// ─────────────────────────────────────────
// 1. TYPES
// ─────────────────────────────────────────

export type RiskTier = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskScoreFactors {
  paymentHistoryScore: number; // 0-100 (30% weight)
  creditUtilizationScore: number; // 0-100 (20% weight)
  disputeRateScore: number; // 0-100 (15% weight)
  etaComplianceScore: number; // 0-100 (15% weight)
  scaleScore: number; // 0-100 (10% weight)
  reputationScore: number; // 0-100 (10% weight)
}

export interface RiskAssessment {
  hotelId: string;
  compositeScore: number; // 0-100 (lower = better)
  riskTier: RiskTier;
  factors: RiskScoreFactors;
  creditAvailable: number;
  creditLimit: number;
  creditUsed: number;
  totalExposure: number;
  assessedAt: Date;
}

export type SmartFixType = "DEPOSIT_20" | "HIGH_RISK_FACTORING" | "SPLIT_50_50" | "AUTO_LIMIT_EXTENSION" | "FACTORING_STANDARD";

export interface SmartFix {
  type: SmartFixType;
  title: string;
  description: string;
  action: "HOLD_ORDER" | "ROUTE_PARTNER" | "SPLIT_PAYMENT" | "EXTEND_LIMIT" | "APPLY_FACTORING";
  orderId: string;
  hotelId: string;
  hotelRiskTier: RiskTier;
  
  // Fix-specific payload
  payload: DepositFixPayload | HighRiskFactoringPayload | SplitPaymentPayload | AutoLimitExtensionPayload | StandardFactoringPayload;
  
  // UI metadata
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  estimatedResolutionMinutes: number;
  requiresHotelAcceptance: boolean;
}

export interface DepositFixPayload {
  depositAmount: number;
  depositPercentage: number;
  gateway: "PAYMOB";
  releaseCondition: "DEPOSIT_RECEIVED";
  paymobOrderId?: string;
  paymentLink?: string;
}

export interface HighRiskFactoringPayload {
  partnerTier: "HIGH_RISK";
  eligiblePartners: string[];
  adjustedDiscountRate: number; // e.g. 0.03 = 3%
  advanceRate: number; // e.g. 0.85
  explanation: string;
}

export interface SplitPaymentPayload {
  deliveryAmount: number;
  creditAmount: number;
  deliveryPercentage: number;
  creditPercentage: number;
  creditTermsDays: number;
  factoringEligibleForCreditPortion: boolean;
}

export interface AutoLimitExtensionPayload {
  currentLimit: number;
  extensionAmount: number;
  newLimit: number;
  reason: string;
  requiresApproval: boolean;
}

export interface StandardFactoringPayload {
  advanceRate: number; // e.g. 0.90
  discountRate: number; // e.g. 0.02
  estimatedDisbursement: number;
  explanation: string;
}

// ─────────────────────────────────────────
// 2. RISK SCORING
// ─────────────────────────────────────────

const WEIGHTS = {
  paymentHistory: 0.30,
  creditUtilization: 0.20,
  disputeRate: 0.15,
  etaCompliance: 0.15,
  scale: 0.10,
  reputation: 0.10,
};

/**
 * Calculate composite risk score for a hotel.
 * Score: 0-100 (0 = lowest risk, 100 = highest risk)
 */
export async function assessRisk(hotelId: string, tenantId?: string): Promise<RiskAssessment> {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId, ...(tenantId ? { tenantId } : {}) },
    include: {
      properties: true,
      invoices: { orderBy: { issueDate: "desc" }, take: 24 },
      orders: true,
      creditFacilities: true,
    },
  });

  if (!hotel) {
    throw new Error(`Hotel not found: ${hotelId}`);
  }

  // Factor 1: Payment History (30%)
  // On-time payment rate over last 24 invoices
  const paymentHistoryScore = await calculatePaymentHistoryScore(hotel.invoices);

  // Factor 2: Credit Utilization (20%)
  const creditLimit = Number(hotel.creditLimit ?? 0);
  const creditUsed = Number(hotel.creditUsed ?? 0);
  const facilityUtilized = hotel.creditFacilities.reduce((sum, f) => sum + Number(f.utilized ?? 0), 0);
  const facilityLimit = hotel.creditFacilities.reduce((sum, f) => sum + Number(f.limit ?? 0), 0);
  const totalLimit = creditLimit + facilityLimit;
  const totalUtilized = creditUsed + facilityUtilized;
  const creditUtilizationScore = totalLimit > 0
    ? Math.min(100, (totalUtilized / totalLimit) * 100)
    : 50; // No credit = medium risk

  // Factor 3: Dispute Rate (15%)
  const disputeRateScore = calculateDisputeRateScore(hotel.orders);

  // Factor 4: ETA Compliance (15%)
  const etaComplianceScore = calculateEtaComplianceScore(hotel.invoices);

  // Factor 5: Scale (10%)
  const scaleScore = calculateScaleScore(hotel);

  // Factor 6: Reputation (10%)
  // Placeholder: future external data integration
  const reputationScore = 50; // Default medium

  // Composite score (0-100, higher = more risky)
  const compositeScore = Math.round(
    paymentHistoryScore * WEIGHTS.paymentHistory +
    creditUtilizationScore * WEIGHTS.creditUtilization +
    disputeRateScore * WEIGHTS.disputeRate +
    etaComplianceScore * WEIGHTS.etaCompliance +
    scaleScore * WEIGHTS.scale +
    reputationScore * WEIGHTS.reputation
  );

  const riskTier = scoreToTier(compositeScore);

  const assessment: RiskAssessment = {
    hotelId,
    compositeScore,
    riskTier,
    factors: {
      paymentHistoryScore,
      creditUtilizationScore,
      disputeRateScore,
      etaComplianceScore,
      scaleScore,
      reputationScore,
    },
    creditAvailable: Math.max(0, totalLimit - totalUtilized),
    creditLimit: totalLimit,
    creditUsed: totalUtilized,
    totalExposure: totalUtilized,
    assessedAt: new Date(),
  };

  // Bias detection: log fairness metrics for auditing
  const biasCheck = checkBiasInRiskAssessment(assessment);
  if (biasCheck.hasBias) {
    console.warn(
      `[FAIRNESS] Bias detected in risk assessment for hotel ${hotelId}:`,
      biasCheck.factors.map((f) => `[${f.severity}] ${f.factor}: ${f.concern}`).join("; ")
    );
  }

  return assessment;
}

function scoreToTier(score: number): RiskTier {
  if (score <= 25) return "LOW";
  if (score <= 50) return "MEDIUM";
  if (score <= 75) return "HIGH";
  return "CRITICAL";
}

async function calculatePaymentHistoryScore(invoices: { paidDate: Date | null; dueDate: Date | null; status: string }[]): Promise<number> {
  if (invoices.length === 0) return 50; // No history = medium risk

  const scoredInvoices = invoices.filter((inv) => inv.dueDate && inv.paidDate);
  if (scoredInvoices.length === 0) return 50;

  const onTimeCount = scoredInvoices.filter((inv) => {
    const daysLate = Math.floor((inv.paidDate!.getTime() - inv.dueDate!.getTime()) / (1000 * 60 * 60 * 24));
    return daysLate <= 3; // 3-day grace period
  }).length;

  const onTimeRate = onTimeCount / scoredInvoices.length;
  // Convert to risk score (higher = worse)
  return Math.round((1 - onTimeRate) * 100);
}

function calculateDisputeRateScore(orders: { status: string }[]): number {
  if (orders.length === 0) return 50;
  const disputed = orders.filter((o) => o.status === "DISPUTED").length;
  const rate = disputed / orders.length;
  return Math.round(rate * 100);
}

function calculateEtaComplianceScore(invoices: { etaStatus: string }[]): number {
  if (invoices.length === 0) return 50;
  const compliant = invoices.filter((inv) =>
    inv.etaStatus === "ACCEPTED" || inv.etaStatus === "VALIDATED"
  ).length;
  const rate = compliant / invoices.length;
  return Math.round((1 - rate) * 100);
}

function calculateScaleScore(hotel: { roomCount: number | null; properties: { roomCount: number | null }[] }): number {
  // Larger hotels = lower risk (more stable, harder to default)
  const totalRooms = hotel.roomCount ?? hotel.properties.reduce((sum, p) => sum + (p.roomCount ?? 0), 0);
  if (totalRooms >= 200) return 10; // Very low risk
  if (totalRooms >= 100) return 25;
  if (totalRooms >= 50) return 40;
  if (totalRooms >= 20) return 60;
  return 80; // Small hotel = higher risk
}

// ─────────────────────────────────────────
// 3. SMART FIX ENGINE
// ─────────────────────────────────────────

/**
 * Generate autonomous Smart Fixes when an order is blocked by credit/risk.
 * This is the core of the "Agentic Obstacle Removal" system.
 */
export async function generateSmartFixes(
  orderId: string,
  hotelId: string,
  orderTotal: number,
  tenantId?: string
): Promise<SmartFix[]> {
  const assessment = await assessRisk(hotelId, tenantId);
  const credit = await checkCreditLimit(hotelId, orderTotal);
  const fixes: SmartFix[] = [];

  // Fix Priority 1: CRITICAL risk → Deposit required
  if (assessment.riskTier === "CRITICAL") {
    fixes.push({
      type: "DEPOSIT_20",
      title: "20% Digital Deposit Required",
      description: `This hotel is rated CRITICAL risk. A 20% deposit (${(orderTotal * 0.20).toFixed(2)} EGP) via Paymob is required to proceed.`,
      action: "HOLD_ORDER",
      orderId,
      hotelId,
      hotelRiskTier: "CRITICAL",
      payload: {
        depositAmount: orderTotal * 0.20,
        depositPercentage: 20,
        gateway: "PAYMOB",
        releaseCondition: "DEPOSIT_RECEIVED",
      } as DepositFixPayload,
      urgency: "CRITICAL",
      estimatedResolutionMinutes: 15,
      requiresHotelAcceptance: true,
    });
  }

  // Fix Priority 2: HIGH risk → High-risk factoring OR deposit
  if (assessment.riskTier === "HIGH") {
    fixes.push({
      type: "HIGH_RISK_FACTORING",
      title: "High-Risk Factoring Partner",
      description: "Route this invoice through a specialized high-risk factoring partner at an adjusted rate (3% vs standard 2%). Advance rate: 85%.",
      action: "ROUTE_PARTNER",
      orderId,
      hotelId,
      hotelRiskTier: "HIGH",
      payload: {
        partnerTier: "HIGH_RISK",
        eligiblePartners: [], // TODO: Register high-risk factoring partners in factoring-bridge before enabling
        adjustedDiscountRate: 0.03,
        advanceRate: 0.85,
        explanation: "High-risk hotels require specialized factoring partners who price risk into their discount rate.",
      } as HighRiskFactoringPayload,
      urgency: "HIGH",
      estimatedResolutionMinutes: 30,
      requiresHotelAcceptance: true,
    });

    fixes.push({
      type: "DEPOSIT_20",
      title: "20% Digital Deposit",
      description: `Pay a 20% deposit (${(orderTotal * 0.20).toFixed(2)} EGP) to proceed with standard terms.`,
      action: "HOLD_ORDER",
      orderId,
      hotelId,
      hotelRiskTier: "HIGH",
      payload: {
        depositAmount: orderTotal * 0.20,
        depositPercentage: 20,
        gateway: "PAYMOB",
        releaseCondition: "DEPOSIT_RECEIVED",
      } as DepositFixPayload,
      urgency: "HIGH",
      estimatedResolutionMinutes: 15,
      requiresHotelAcceptance: true,
    });
  }

  // Fix Priority 3: MEDIUM risk + credit tight → Split payment
  if (assessment.riskTier === "MEDIUM" && (!credit.allowed || credit.available < orderTotal * 0.3)) {
    fixes.push({
      type: "SPLIT_50_50",
      title: "50/50 Split Payment",
      description: "Pay 50% on delivery via Paymob, 50% on standard 30-day credit terms. The credit portion can be factored later.",
      action: "SPLIT_PAYMENT",
      orderId,
      hotelId,
      hotelRiskTier: "MEDIUM",
      payload: {
        deliveryAmount: orderTotal * 0.50,
        creditAmount: orderTotal * 0.50,
        deliveryPercentage: 50,
        creditPercentage: 50,
        creditTermsDays: 30,
        factoringEligibleForCreditPortion: true,
      } as SplitPaymentPayload,
      urgency: "MEDIUM",
      estimatedResolutionMinutes: 10,
      requiresHotelAcceptance: true,
    });
  }

  // Fix Priority 4: Good payment history → Auto limit extension
  if (assessment.factors.paymentHistoryScore < 15 && !credit.allowed && assessment.riskTier !== "CRITICAL") {
    const extensionAmount = assessment.creditLimit * 0.10;
    fixes.push({
      type: "AUTO_LIMIT_EXTENSION",
      title: "Automatic Credit Extension",
      description: `Based on flawless payment history, your credit limit can be extended by ${extensionAmount.toFixed(2)} EGP (10%).`,
      action: "EXTEND_LIMIT",
      orderId,
      hotelId,
      hotelRiskTier: assessment.riskTier,
      payload: {
        currentLimit: assessment.creditLimit,
        extensionAmount,
        newLimit: assessment.creditLimit + extensionAmount,
        reason: "Flawless payment history (>95% on-time)",
        requiresApproval: false,
      } as AutoLimitExtensionPayload,
      urgency: "LOW",
      estimatedResolutionMinutes: 5,
      requiresHotelAcceptance: true,
    });
  }

  // Fix Priority 5: Standard factoring (always available for invoices > 10k)
  if (orderTotal >= 10000) {
    fixes.push({
      type: "FACTORING_STANDARD",
      title: "Standard Factoring",
      description: "Get 90% of invoice value within 24-48 hours. Platform fee: 1.5%. Factoring fee: 2%. You pay nothing upfront.",
      action: "APPLY_FACTORING",
      orderId,
      hotelId,
      hotelRiskTier: assessment.riskTier,
      payload: {
        advanceRate: 0.90,
        discountRate: 0.02,
        estimatedDisbursement: orderTotal * 0.90 - orderTotal * 0.015 - orderTotal * 0.02,
        explanation: "Non-recourse factoring: if hotel defaults, factoring partner absorbs loss.",
      } as StandardFactoringPayload,
      urgency: assessment.riskTier === "HIGH" ? "HIGH" : "LOW",
      estimatedResolutionMinutes: 20,
      requiresHotelAcceptance: true,
    });
  }

  return fixes;
}

// ─────────────────────────────────────────
// 4. RISK DASHBOARD DATA
// ─────────────────────────────────────────

export interface RiskHeatmapData {
  hotelId: string;
  hotelName: string;
  city: string;
  governorate: string;
  riskScore: number;
  riskTier: RiskTier;
  creditLimit: number;
  creditUsed: number;
  totalExposure: number;
  propertyCount: number;
  roomCount: number;
}

/**
 * Generate data for the admin Credit Heatmap dashboard.
 */
export async function getRiskHeatmapData(tenantId?: string): Promise<RiskHeatmapData[]> {
  const hotels = await prisma.hotel.findMany({
    where: tenantId ? { tenantId } : {},
    include: {
      properties: true,
      invoices: { orderBy: { issueDate: "desc" }, take: 12 },
      orders: true,
      creditFacilities: true,
    },
  });

  const results: RiskHeatmapData[] = [];

  for (const hotel of hotels) {
    const assessment = await assessRisk(hotel.id, hotel.tenantId);
    results.push({
      hotelId: hotel.id,
      hotelName: hotel.name,
      city: hotel.city,
      governorate: hotel.governorate,
      riskScore: assessment.compositeScore,
      riskTier: assessment.riskTier,
      creditLimit: assessment.creditLimit,
      creditUsed: assessment.creditUsed,
      totalExposure: assessment.totalExposure,
      propertyCount: hotel.properties.length,
      roomCount: hotel.roomCount ?? hotel.properties.reduce((s, p) => s + (p.roomCount ?? 0), 0),
    });
  }

  return results;
}

export interface LiquidityMonitorData {
  totalDeployedToday: number;
  totalDeployedThisWeek: number;
  totalDeployedThisMonth: number;
  activeRequests: number;
  disbursementVelocity: number; // EGP per hour
  defaultRate: number; // Percentage
  platformRevenueYTD: number;
  partnerBreakdown: {
    partnerId: string;
    partnerName: string;
    deployed: number;
    activeRequests: number;
    defaultRate: number;
  }[];
}

/**
 * Generate data for the admin Liquidity Monitor dashboard.
 */
export async function getLiquidityMonitorData(): Promise<LiquidityMonitorData> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Note: Using existing schema fields. In production, add FactoringRequest model.
  // For now, we aggregate from invoices with an accepted factoring status
  const factoredInvoices = await prisma.invoice.findMany({
    where: { factoringStatus: { in: ["ACCEPTED", "PAID"] } },
    include: { factoringCompany: true },
  });

  const todayInvoices = factoredInvoices.filter((inv) => inv.paidDate && inv.paidDate >= startOfDay);
  const weekInvoices = factoredInvoices.filter((inv) => inv.paidDate && inv.paidDate >= startOfWeek);
  const monthInvoices = factoredInvoices.filter((inv) => inv.paidDate && inv.paidDate >= startOfMonth);

  const totalDeployedToday = todayInvoices.reduce((s, inv) => s + Number(inv.total ?? 0), 0);
  const totalDeployedThisWeek = weekInvoices.reduce((s, inv) => s + Number(inv.total ?? 0), 0);
  const totalDeployedThisMonth = monthInvoices.reduce((s, inv) => s + Number(inv.total ?? 0), 0);

  // Active requests: invoices with OFFERED or ACCEPTED factoring status
  const activeRequests = await prisma.invoice.count({
    where: { factoringStatus: { in: ["OFFERED", "ACCEPTED"] } },
  });

  // Partner breakdown
  const partners = await prisma.factoringCompany.findMany();
  const partnerBreakdown = partners.map((partner) => {
    const partnerInvoices = factoredInvoices.filter((inv) => inv.factoringCompanyId === partner.id);
    const partnerTotal = partnerInvoices.reduce((s, inv) => s + Number(inv.total ?? 0), 0);
    const defaults = partnerInvoices.filter((inv) => inv.paymentStatus === "OVERDUE").length;
    return {
      partnerId: partner.id,
      partnerName: partner.name,
      deployed: partnerTotal,
      activeRequests: partnerInvoices.filter((inv) =>
        inv.factoringStatus === "OFFERED" || inv.factoringStatus === "ACCEPTED"
      ).length,
      defaultRate: partnerInvoices.length > 0 ? (defaults / partnerInvoices.length) * 100 : 0,
    };
  });

  // Platform revenue YTD (approximated from invoice totals * 1.5%)
  const ytdInvoices = factoredInvoices.filter((inv) => inv.createdAt >= startOfYear);
  const platformRevenueYTD = ytdInvoices.reduce((s, inv) => s + Number(inv.total ?? 0) * 0.015, 0);

  // Velocity: last 7 days average per hour
  const last7Days = factoredInvoices.filter(
    (inv) => inv.paidDate && inv.paidDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  );
  const velocityTotal = last7Days.reduce((s, inv) => s + Number(inv.total ?? 0), 0);
  const disbursementVelocity = velocityTotal / (7 * 24);

  // Default rate
  const defaulted = factoredInvoices.filter((inv) => inv.paymentStatus === "OVERDUE").length;
  const defaultRate = factoredInvoices.length > 0 ? (defaulted / factoredInvoices.length) * 100 : 0;

  return {
    totalDeployedToday,
    totalDeployedThisWeek,
    totalDeployedThisMonth,
    activeRequests,
    disbursementVelocity,
    defaultRate,
    platformRevenueYTD,
    partnerBreakdown,
  };
}
