/**
 * Multi-Signal Trust Score Aggregator
 * Hotels Vendors Integrations Layer
 *
 * Combines 5 signals to create an instant Trust Score (0-1000):
 * 1. Platform Native Data (40%)
 * 2. ETA Registry (20%)
 * 3. Paymob Integration (15%, optional)
 * 4. Bank Statement Upload + AI Parsing (15%)
 * 5. External Credit Bureau (10%, optional)
 *
 * Daftra is NOT used — no reliable API.
 */

import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────
// 1. TYPES
// ─────────────────────────────────────────

export interface TrustScoreResult {
  entityId: string;
  entityType: "HOTEL" | "SUPPLIER";
  totalScore: number; // 0-1000
  tier: TrustTier;
  signals: TrustSignal[];
  preApprovedCreditLimit: number;
  confidence: number; // 0-100
  assessedAt: Date;
}

export interface TrustSignal {
  name: string;
  weight: number; // 0-1
  score: number; // 0-100
  rawValue: string;
  explanation: string;
  source: string;
}

export type TrustTier = "PLATINUM" | "GOLD" | "SILVER" | "BRONZE" | "UNTRUSTED";

// ─────────────────────────────────────────
// 2. SIGNAL WEIGHTS
// ─────────────────────────────────────────

const SIGNAL_WEIGHTS = {
  platform: 0.40,
  eta: 0.20,
  paymob: 0.15,
  bankStatement: 0.15,
  creditBureau: 0.10,
};

// ─────────────────────────────────────────
// 3. MAIN AGGREGATOR
// ─────────────────────────────────────────

/**
 * Calculate Trust Score for a hotel or supplier.
 */
export async function calculateTrustScore(
  entityId: string,
  entityType: "HOTEL" | "SUPPLIER"
): Promise<TrustScoreResult> {
  const signals: TrustSignal[] = [];

  // Signal 1: Platform Native Data (40%)
  const platformSignal = await calculatePlatformSignal(entityId, entityType);
  signals.push(platformSignal);

  // Signal 2: ETA Registry (20%)
  const etaSignal = await calculateEtaSignal(entityId, entityType);
  signals.push(etaSignal);

  // Signal 3: Paymob Integration (15%) — OPTIONAL, degrades gracefully
  const paymobSignal = await calculatePaymobSignal(entityId, entityType);
  if (paymobSignal) {
    signals.push(paymobSignal);
  }

  // Signal 4: Bank Statement (15%) — OPTIONAL
  const bankSignal = await calculateBankStatementSignal(entityId, entityType);
  if (bankSignal) {
    signals.push(bankSignal);
  }

  // Signal 5: External Credit Bureau (10%) — OPTIONAL
  const bureauSignal = await calculateCreditBureauSignal(entityId, entityType);
  if (bureauSignal) {
    signals.push(bureauSignal);
  }

  // Calculate weighted total
  let totalScore = 0;
  let totalWeight = 0;

  for (const signal of signals) {
    totalScore += signal.score * signal.weight;
    totalWeight += signal.weight;
  }

  // Normalize if some signals are missing
  const normalizedScore = totalWeight > 0 ? (totalScore / totalWeight) * 10 : 0; // Scale to 0-1000

  // Determine tier
  const tier = scoreToTier(normalizedScore);

  // Pre-approved credit limit
  const preApprovedCreditLimit = calculatePreApprovedLimit(normalizedScore, entityType);

  // Confidence based on number of signals
  const confidence = Math.round((signals.length / 5) * 100);

  return {
    entityId,
    entityType,
    totalScore: Math.round(normalizedScore),
    tier,
    signals,
    preApprovedCreditLimit,
    confidence,
    assessedAt: new Date(),
  };
}

// ─────────────────────────────────────────
// 4. SIGNAL CALCULATORS
// ─────────────────────────────────────────

async function calculatePlatformSignal(entityId: string, entityType: "HOTEL" | "SUPPLIER"): Promise<TrustSignal> {
  let score = 50; // Start neutral
  let rawValue = "No data";

  if (entityType === "HOTEL") {
    const hotel = await prisma.hotel.findUnique({
      where: { id: entityId },
      include: {
        invoices: { orderBy: { issueDate: "desc" }, take: 24 },
        orders: true,
        properties: true,
      },
    });

    if (hotel) {
      const invoices = hotel.invoices;
      const orders = hotel.orders;

      // Payment history (on-time %)
      const paidInvoices = invoices.filter((inv) => inv.paidDate && inv.dueDate);
      const onTime = paidInvoices.filter((inv) => {
        const daysLate = Math.floor((inv.paidDate!.getTime() - inv.dueDate!.getTime()) / (1000 * 60 * 60 * 24));
        return daysLate <= 3;
      }).length;
      const onTimeRate = paidInvoices.length > 0 ? onTime / paidInvoices.length : 0.5;

      // Order frequency
      const orderCount = orders.length;
      const orderFrequency = Math.min(1, orderCount / 10); // Normalize to 10+ orders

      // ETA compliance
      const compliantInvoices = invoices.filter((inv) => inv.etaStatus === "ACCEPTED").length;
      const etaRate = invoices.length > 0 ? compliantInvoices / invoices.length : 0;

      // Dispute rate
      const disputed = orders.filter((o) => o.status === "DISPUTED").length;
      const disputeRate = orders.length > 0 ? disputed / orders.length : 0;

      // Scale
      const propertyCount = hotel.properties.length;
      const roomCount = hotel.roomCount || hotel.properties.reduce((s, p) => s + (p.roomCount || 0), 0);

      score = Math.round(
        onTimeRate * 30 +
        orderFrequency * 15 +
        etaRate * 20 +
        (1 - disputeRate) * 15 +
        Math.min(1, propertyCount / 5) * 10 +
        Math.min(1, roomCount / 100) * 10
      );

      rawValue = `${onTimeRate.toFixed(0)}% on-time, ${orderCount} orders, ${propertyCount} properties`;
    }
  } else {
    const supplier = await prisma.supplier.findUnique({
      where: { id: entityId },
      include: {
        orders: true,
        products: true,
        audits: true,
      },
    });

    if (supplier) {
      const orders = supplier.orders;
      const products = supplier.products;
      const audits = supplier.audits;

      // On-time delivery
      const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
      const onTimeRate = orders.length > 0 ? deliveredOrders.length / orders.length : 0.5;

      // Product catalog depth
      const catalogDepth = Math.min(1, products.length / 20);

      // Audit score
      const passedAudits = audits.filter((a) => a.status === "PASSED").length;
      const auditRate = audits.length > 0 ? passedAudits / audits.length : 0;

      // Order volume
      const orderVolume = Math.min(1, orders.length / 50);

      score = Math.round(
        onTimeRate * 30 +
        catalogDepth * 15 +
        auditRate * 25 +
        orderVolume * 20 +
        (supplier.tier === "PREMIER" ? 10 : supplier.tier === "VERIFIED" ? 5 : 0)
      );

      rawValue = `${onTimeRate.toFixed(0)}% on-time delivery, ${products.length} products, ${audits.length} audits`;
    }
  }

  return {
    name: "Platform Native Data",
    weight: SIGNAL_WEIGHTS.platform,
    score: Math.min(100, score),
    rawValue,
    explanation: "Based on payment history, order frequency, ETA compliance, and dispute rate from platform data.",
    source: "platform",
  };
}

async function calculateEtaSignal(entityId: string, entityType: "HOTEL" | "SUPPLIER"): Promise<TrustSignal> {
  const invoices = await prisma.invoice.findMany({
    where: entityType === "HOTEL" ? { hotelId: entityId } : { supplierId: entityId },
    select: { etaStatus: true, etaUuid: true },
  });

  const totalInvoices = invoices.length;
  const validatedInvoices = invoices.filter((inv) => inv.etaStatus === "ACCEPTED").length;
  const withUuid = invoices.filter((inv) => inv.etaUuid !== null).length;

  let score = 50;
  if (totalInvoices > 0) {
    const validationRate = validatedInvoices / totalInvoices;
    const uuidRate = withUuid / totalInvoices;
    score = Math.round(validationRate * 70 + uuidRate * 30);
  }

  return {
    name: "ETA Registry Compliance",
    weight: SIGNAL_WEIGHTS.eta,
    score,
    rawValue: `${validatedInvoices}/${totalInvoices} invoices validated, ${withUuid} with UUID`,
    explanation: "Tax compliance is a strong signal of legitimacy. Hotels/suppliers with validated ETA invoices are provably real businesses.",
    source: "eta",
  };
}

async function calculatePaymobSignal(entityId: string, entityType: "HOTEL" | "SUPPLIER"): Promise<TrustSignal | null> {
  // TODO: Implement Paymob API integration
  // For now, return null (graceful degradation)
  return null;
}

async function calculateBankStatementSignal(entityId: string, entityType: "HOTEL" | "SUPPLIER"): Promise<TrustSignal | null> {
  // TODO: Implement bank statement upload + AI parsing
  // For now, return null (graceful degradation)
  return null;
}

async function calculateCreditBureauSignal(entityId: string, entityType: "HOTEL" | "SUPPLIER"): Promise<TrustSignal | null> {
  // TODO: Implement I-Score integration when available
  // For now, return null (graceful degradation)
  return null;
}

// ─────────────────────────────────────────
// 5. HELPERS
// ─────────────────────────────────────────

function scoreToTier(score: number): TrustTier {
  if (score >= 800) return "PLATINUM";
  if (score >= 650) return "GOLD";
  if (score >= 500) return "SILVER";
  if (score >= 350) return "BRONZE";
  return "UNTRUSTED";
}

function calculatePreApprovedLimit(score: number, entityType: "HOTEL" | "SUPPLIER"): number {
  if (entityType === "SUPPLIER") return 0; // Only hotels get credit

  if (score >= 800) return 2_000_000; // Platinum: 2M EGP
  if (score >= 650) return 1_000_000; // Gold: 1M EGP
  if (score >= 500) return 500_000;   // Silver: 500K EGP
  if (score >= 350) return 200_000;   // Bronze: 200K EGP
  return 50_000;                      // Untrusted: 50K EGP
}
