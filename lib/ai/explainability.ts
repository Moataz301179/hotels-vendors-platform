/**
 * AI Explainability — Human-readable explanations for AI decisions
 * Hotels Vendors AI Governance Layer
 *
 * Generates transparent explanations for:
 * - Credit risk assessments
 * - Smart Fix recommendations
 * - Auto credit limit extensions
 * - Factoring routing decisions
 */

import type { RiskAssessment, SmartFix, RiskTier } from "@/lib/fintech/risk-engine";

// ── Risk Assessment Explanations ─────────────────────────────────

export interface RiskExplanation {
  summary: string;
  factors: Array<{
    name: string;
    score: number;
    weight: number;
    impact: "positive" | "negative" | "neutral";
    explanation: string;
  }>;
  recommendation: string;
}

const FACTOR_LABELS: Record<string, string> = {
  paymentHistoryScore: "Payment History",
  creditUtilizationScore: "Credit Utilization",
  disputeRateScore: "Dispute Rate",
  etaComplianceScore: "ETA Compliance",
  scaleScore: "Hotel Scale",
  reputationScore: "Reputation",
};

const FACTOR_WEIGHTS: Record<string, number> = {
  paymentHistoryScore: 0.30,
  creditUtilizationScore: 0.20,
  disputeRateScore: 0.15,
  etaComplianceScore: 0.15,
  scaleScore: 0.10,
  reputationScore: 0.10,
};

function describeFactorImpact(score: number, name: string): string {
  if (name === "paymentHistoryScore") {
    if (score <= 15) return "Excellent payment history — very few late payments.";
    if (score <= 40) return "Good payment history with minor delays.";
    if (score <= 60) return "Mixed payment history — some late payments detected.";
    return "Poor payment history — frequent late payments.";
  }
  if (name === "creditUtilizationScore") {
    if (score <= 25) return "Low credit utilization — plenty of available credit.";
    if (score <= 50) return "Moderate credit utilization.";
    if (score <= 75) return "High credit utilization — approaching credit limit.";
    return "Credit fully utilized — no additional credit available.";
  }
  if (name === "disputeRateScore") {
    if (score <= 10) return "No disputes recorded.";
    if (score <= 30) return "Low dispute rate.";
    return "Elevated dispute rate — multiple order disputes detected.";
  }
  if (name === "etaComplianceScore") {
    if (score <= 15) return "Full ETA e-invoicing compliance.";
    if (score <= 40) return "Mostly compliant with minor ETA submission issues.";
    return "ETA compliance issues detected — some invoices not properly submitted.";
  }
  if (name === "scaleScore") {
    if (score <= 25) return "Large property — lower risk profile.";
    if (score <= 50) return "Mid-size property.";
    return "Smaller property — higher relative risk.";
  }
  return "Score within normal range.";
}

/**
 * Generate a human-readable explanation for a risk assessment.
 */
export function explainRiskAssessment(assessment: RiskAssessment): RiskExplanation {
  const factors = Object.entries(assessment.factors).map(([key, score]) => {
    const name = FACTOR_LABELS[key] || key;
    const weight = FACTOR_WEIGHTS[key] || 0;
    const impact: "positive" | "negative" | "neutral" =
      score <= 30 ? "positive" : score >= 60 ? "negative" : "neutral";

    return {
      name,
      score,
      weight,
      impact,
      explanation: describeFactorImpact(score, key),
    };
  });

  const summary = generateRiskSummary(assessment.riskTier, assessment.compositeScore);
  const recommendation = generateRiskRecommendation(assessment.riskTier, factors);

  return { summary, factors, recommendation };
}

function generateRiskSummary(tier: RiskTier, score: number): string {
  switch (tier) {
    case "LOW":
      return `This hotel presents LOW risk (score: ${score}/100). Credit and procurement can proceed with standard terms.`;
    case "MEDIUM":
      return `This hotel presents MEDIUM risk (score: ${score}/100). Some restrictions may apply to credit and order approvals.`;
    case "HIGH":
      return `This hotel presents HIGH risk (score: ${score}/100). Enhanced credit controls and deposit requirements may be triggered.`;
    case "CRITICAL":
      return `This hotel presents CRITICAL risk (score: ${score}/100). Orders may be blocked pending deposit payment or manual review.`;
  }
}

function generateRiskRecommendation(
  tier: RiskTier,
  factors: Array<{ name: string; score: number; impact: string }>
): string {
  const negativeFactors = factors.filter((f) => f.impact === "negative");
  if (negativeFactors.length === 0) {
    return "No corrective action required. Continue monitoring.";
  }

  const topFactor = negativeFactors.sort((a, b) => b.score - a.score)[0];
  return `Primary area for improvement: ${topFactor.name}. Addressing this factor would most improve the hotel's risk profile.`;
}

// ── Smart Fix Explanations ───────────────────────────────────────

export interface SmartFixExplanation {
  fixType: string;
  title: string;
  reason: string;
  whatHappens: string;
  beforeState: string;
  afterState: string;
}

/**
 * Generate a human-readable explanation for a Smart Fix decision.
 */
export function explainSmartFix(fix: SmartFix): SmartFixExplanation {
  const explanations: Record<string, SmartFixExplanation> = {
    AUTO_LIMIT_EXTENSION: {
      fixType: "AUTO_LIMIT_EXTENSION",
      title: "Automatic Credit Limit Extension",
      reason:
        "Based on your flawless payment history (>85% on-time payments), your credit limit has been automatically extended.",
      whatHappens:
        "Your credit limit has been increased to allow larger orders. This extension is based on your demonstrated payment reliability.",
      beforeState: `Credit limit: ${(fix.payload as any).currentLimit?.toLocaleString()} EGP`,
      afterState: `New credit limit: ${(fix.payload as any).newLimit?.toLocaleString()} EGP`,
    },
    FACTORING_STANDARD: {
      fixType: "FACTORING_STANDARD",
      title: "Standard Factoring Applied",
      reason:
        "This order qualifies for non-recourse factoring. The supplier will be paid early, and you maintain standard payment terms.",
      whatHappens:
        "A factoring partner will advance 90% of the invoice value to the supplier within 24-48 hours. You pay the factoring fee (2%) and platform fee (1.5%).",
      beforeState: "Order pending — no payment guarantee",
      afterState: "Order confirmed — supplier payment guaranteed via factoring",
    },
    DEPOSIT_20: {
      fixType: "DEPOSIT_20",
      title: "20% Digital Deposit Required",
      reason: `Due to elevated risk assessment (${fix.hotelRiskTier}), a 20% deposit is required to proceed.`,
      whatHappens:
        "You will be redirected to Paymob to complete a 20% deposit payment. The order will be confirmed once the deposit is received.",
      beforeState: "Order blocked — credit/risk constraint",
      afterState: "Order pending — awaiting deposit payment",
    },
    HIGH_RISK_FACTORING: {
      fixType: "HIGH_RISK_FACTORING",
      title: "High-Risk Factoring Partner",
      reason:
        "This order requires a specialized factoring partner due to elevated risk. The advance rate and fees are adjusted accordingly.",
      whatHappens:
        "A high-risk factoring partner will advance 85% of the invoice value at a 3% discount rate (vs. standard 2%).",
      beforeState: "Order blocked — standard factoring not available",
      afterState: "Order routed to high-risk factoring partner",
    },
    SPLIT_50_50: {
      fixType: "SPLIT_50_50",
      title: "50/50 Split Payment",
      reason:
        "Your credit utilization is high, but you qualify for a split payment arrangement.",
      whatHappens:
        "50% of the order value is paid on delivery via Paymob. The remaining 50% is placed on 30-day credit terms and can be factored later.",
      beforeState: "Order blocked — insufficient credit",
      afterState: "Order confirmed — split payment configured",
    },
  };

  return (
    explanations[fix.type] || {
      fixType: fix.type,
      title: fix.title,
      reason: fix.description,
      whatHappens: "The system has applied an automatic fix to resolve this order block.",
      beforeState: "Order blocked",
      afterState: "Order resolved",
    }
  );
}

// ── Credit Limit Extension Explanations ──────────────────────────

export interface ExtensionExplanation {
  eligible: boolean;
  reason: string;
  currentLimit: number;
  extensionAmount: number;
  newLimit: number;
  requiresApproval: boolean;
  approvalThreshold: number;
  factors: string[];
}

/**
 * Explain whether a credit limit extension is eligible and why.
 */
export function explainCreditExtension(params: {
  currentLimit: number;
  extensionAmount: number;
  paymentHistoryScore: number;
  riskTier: RiskTier;
  monthlyExtensions: number;
  maxMonthlyExtensions: number;
  extensionPercentage: number;
  approvalThreshold: number;
}): ExtensionExplanation {
  const {
    currentLimit,
    extensionAmount,
    paymentHistoryScore,
    riskTier,
    monthlyExtensions,
    maxMonthlyExtensions,
    extensionPercentage,
    approvalThreshold,
  } = params;

  const newLimit = currentLimit + extensionAmount;
  const factors: string[] = [];
  let eligible = true;
  let reason = "";

  // Check payment history
  if (paymentHistoryScore >= 15) {
    eligible = false;
    factors.push(`Payment history score (${paymentHistoryScore}) does not meet threshold (<15).`);
  } else {
    factors.push("Payment history meets the required threshold.");
  }

  // Check risk tier
  if (riskTier === "CRITICAL") {
    eligible = false;
    factors.push("CRITICAL risk tier disqualifies automatic extension.");
  }

  // Check monthly cap
  if (monthlyExtensions >= maxMonthlyExtensions) {
    eligible = false;
    factors.push(`Monthly extension limit reached (${monthlyExtensions}/${maxMonthlyExtensions}).`);
  }

  // Check extension percentage threshold
  const requiresApproval = extensionPercentage > approvalThreshold;
  if (requiresApproval) {
    factors.push(
      `Extension of ${extensionPercentage.toFixed(1)}% exceeds ${approvalThreshold}% threshold — requires human approval.`
    );
  }

  if (eligible && !requiresApproval) {
    reason = "Automatic extension approved based on payment history and risk profile.";
  } else if (eligible && requiresApproval) {
    reason = "Extension requires human approval due to the extension amount exceeding the threshold.";
  } else {
    reason = "Automatic extension is not eligible. Manual review required.";
  }

  return {
    eligible,
    reason,
    currentLimit,
    extensionAmount,
    newLimit,
    requiresApproval,
    approvalThreshold,
    factors,
  };
}

// ── Bias Detection Explan─────────────────────────────────────────

export interface BiasCheckResult {
  hasBias: boolean;
  factors: Array<{
    factor: string;
    concern: string;
    severity: "low" | "medium" | "high";
  }>;
  recommendation: string;
}

/**
 * Check a risk assessment for potential systemic bias.
 */
export function checkBiasInRiskAssessment(assessment: RiskAssessment): BiasCheckResult {
  const factors: BiasCheckResult["factors"] = [];

  // Scale bias: small hotels always score worse
  if (assessment.factors.scaleScore >= 60) {
    factors.push({
      factor: "Hotel Scale",
      concern:
        "Smaller hotels (<50 rooms) receive disproportionately higher risk scores. Size alone should not determine creditworthiness.",
      severity: "medium",
    });
  }

  // Check if payment history dominates too heavily
  if (assessment.factors.paymentHistoryScore > 70 && assessment.compositeScore > 50) {
    factors.push({
      factor: "Payment History Dominance",
      concern:
        "Payment history score is high, but other factors may be compensating. Ensure payment history is not the sole driver of risk tier.",
      severity: "low",
    });
  }

  // No compliance data = medium risk is unfair
  if (assessment.factors.etaComplianceScore === 50) {
    factors.push({
      factor: "ETA Compliance Default",
      concern:
        "Hotels with no ETA invoice data receive a default score of 50 (medium risk). New hotels on the platform are unfairly penalized.",
      severity: "medium",
    });
  }

  const hasBias = factors.some((f) => f.severity === "high" || f.severity === "medium");

  return {
    hasBias,
    factors,
    recommendation: hasBias
      ? "Consider adding alternative creditworthiness signals for hotels affected by systemic bias (e.g., owner guarantees, offline payment history)."
      : "No significant bias detected in this assessment.",
  };
}
