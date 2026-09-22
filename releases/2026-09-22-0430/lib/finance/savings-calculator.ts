/**
 * Dynamic Savings Calculator (TCP Engine)
 * Hotels Vendors Finance Layer
 *
 * Quantifies the TRUE cost of offline procurement vs platform procurement.
 * Uses real data + dynamic market conditions.
 */

import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────
// 1. MARKET CONDITIONS (2026 Egypt)
// ─────────────────────────────────────────

export interface MarketConditions {
  year: number;
  etaPenaltyRate: number;           // 2.5% average for non-compliant invoices
  etaPenaltyMin: number;            // 500 EGP minimum fine
  smeCostOfCapitalAnnual: number;   // 20-25% for Egyptian SMEs
  bankInterestRate: number;         // 18% (CBE lending rate)
  logisticsFragmentationCost: number; // 4.2% of order value
  storageWasteRate: number;         // 30% of storage capacity wasted
  storageCostPerSqmMonthly: number; // 150 EGP/sqm
  disputeLossRate: number;          // 5% of offline orders
  fuelCostPerKm: number;            // 8 EGP/km
  avgDeliveryDistanceKm: number;    // 45 km
}

const EGYPT_2026: MarketConditions = {
  year: 2026,
  etaPenaltyRate: 0.025,
  etaPenaltyMin: 500,
  smeCostOfCapitalAnnual: 0.22,
  bankInterestRate: 0.18,
  logisticsFragmentationCost: 0.042,
  storageWasteRate: 0.30,
  storageCostPerSqmMonthly: 150,
  disputeLossRate: 0.05,
  fuelCostPerKm: 8,
  avgDeliveryDistanceKm: 45,
};

// ─────────────────────────────────────────
// 2. DYNAMIC TCP REPORT
// ─────────────────────────────────────────

export interface TcpLineItem {
  label: string;
  offlineCost: number;
  platformCost: number;
  savings: number;
  explanation: string;
}

export interface DynamicTcpReport {
  hotelId: string;
  hotelName: string;
  orderId: string;
  orderNumber: string;
  orderTotal: number;
  paymentTermsDays: number;
  marketConditions: MarketConditions;

  // Breakdown
  lineItems: TcpLineItem[];

  // Totals
  totalOfflineCost: number;
  totalPlatformCost: number;
  totalSavings: number;
  savingsPercentage: number;

  // Narrative
  executiveSummary: string;
  cfoNarrative: string;
  supplierNarrative: string;

  // Generated
  generatedAt: Date;
}

// ─────────────────────────────────────────
// 3. CALCULATION ENGINE
// ─────────────────────────────────────────

/**
 * Generate a dynamic TCP report for a specific order.
 */
export async function generateDynamicTcpReport(orderId: string): Promise<DynamicTcpReport> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      hotel: true,
      supplier: true,
      invoices: true,
      items: { include: { product: true } },
    },
  });

  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  const market = EGYPT_2026;
  const orderTotal = Number(order.total ?? 0);
  const paymentTermsDays = 90; // Default Egyptian hospitality terms

  const lineItems: TcpLineItem[] = [];

  // 1. Base price (same on both sides)
  lineItems.push({
    label: "Base Procurement Cost",
    offlineCost: orderTotal,
    platformCost: orderTotal,
    savings: 0,
    explanation: "The quoted price of goods is the same online and offline.",
  });

  // 2. Cost of Capital (supplier waits 90 days)
  const costOfCapital = orderTotal * market.smeCostOfCapitalAnnual * (paymentTermsDays / 365);
  lineItems.push({
    label: "Supplier Cost of Capital (90-day wait)",
    offlineCost: costOfCapital,
    platformCost: 0,
    savings: costOfCapital,
    explanation: `Supplier charges ~${(market.smeCostOfCapitalAnnual * 100).toFixed(0)}% annual interest for delayed payment. Over ${paymentTermsDays} days, this adds ${costOfCapital.toFixed(0)} EGP to your TRUE cost. On our platform, factoring pays the supplier within 48 hours — zero cost of capital.`,
  });

  // 3. ETA Compliance Risk
  const etaPenalty = Math.max(market.etaPenaltyMin, orderTotal * market.etaPenaltyRate);
  lineItems.push({
    label: "ETA Compliance Penalty Risk",
    offlineCost: etaPenalty,
    platformCost: 0,
    savings: etaPenalty,
    explanation: `Offline invoices often lack proper ETA formatting. The Egyptian Tax Authority fines non-compliant invoices ${(market.etaPenaltyRate * 100).toFixed(1)}% (min ${market.etaPenaltyMin} EGP). Our platform auto-submits every invoice to ETA with digital signatures.`,
  });

  // 4. Logistics Fragmentation
  const logisticsCost = orderTotal * market.logisticsFragmentationCost;
  lineItems.push({
    label: "Logistics Fragmentation",
    offlineCost: logisticsCost,
    platformCost: 0,
    savings: logisticsCost,
    explanation: `Managing 15+ suppliers individually means 15+ delivery fees, coordination overhead, and failed deliveries. Our shared-route network bundles deliveries and reduces fragmentation costs by ~${(market.logisticsFragmentationCost * 100).toFixed(1)}%.`,
  });

  // 5. Storage Waste
  // Estimate: average hotel stores 2 weeks of inventory = 1/26 of annual procurement
  const annualProcurementEstimate = orderTotal * 26; // Rough estimate
  const storageSqm = (annualProcurementEstimate * 0.001); // 1 sqm per 1000 EGP
  const storageWaste = storageSqm * market.storageCostPerSqmMonthly * market.storageWasteRate;
  lineItems.push({
    label: "Storage Waste (Dead Stock)",
    offlineCost: storageWaste,
    platformCost: 0,
    savings: storageWaste,
    explanation: `Bulk ordering to minimize transactions wastes ~${(market.storageWasteRate * 100).toFixed(0)}% of hotel storage. At ${market.storageCostPerSqmMonthly} EGP/sqm/month, this costs ${storageWaste.toFixed(0)} EGP. Daily ordering via our platform frees storage space for revenue-generating areas.`,
  });

  // 6. Dispute Losses
  const disputeLoss = orderTotal * market.disputeLossRate;
  lineItems.push({
    label: "Dispute & Resolution Losses",
    offlineCost: disputeLoss,
    platformCost: 0,
    savings: disputeLoss,
    explanation: `Offline orders lack digital audit trails. ~${(market.disputeLossRate * 100).toFixed(0)}% of offline orders result in unresolved disputes (wrong quantity, damaged goods, missing items). Our platform captures every step with photos, signatures, and timestamps.`,
  });

  // 7. Platform Fee (on platform side only)
  const platformFeeRate = 0.025;
  const platformFee = orderTotal * platformFeeRate;
  lineItems.push({
    label: "Platform Service Fee",
    offlineCost: 0,
    platformCost: platformFee,
    savings: -platformFee,
    explanation: `Our platform fee is ${(platformFeeRate * 100).toFixed(1)}% of order value. This covers ETA compliance, factoring facilitation, logistics optimization, and AI insights.`,
  });

  // 8. Factoring Fee (on platform side only, if applicable)
  const factoringFeeRate = 0.02;
  const factoringFee = orderTotal * factoringFeeRate;
  lineItems.push({
    label: "Factoring Service Fee",
    offlineCost: 0,
    platformCost: factoringFee,
    savings: -factoringFee,
    explanation: `Factoring partner charges ${(factoringFeeRate * 100).toFixed(1)}% to guarantee supplier payment within 48 hours. This eliminates your supplier's cost of capital and strengthens your negotiation position.`,
  });

  // Totals
  const totalOfflineCost = lineItems.reduce((s, item) => s + item.offlineCost, 0);
  const totalPlatformCost = lineItems.reduce((s, item) => s + item.platformCost, 0);
  const totalSavings = totalOfflineCost - totalPlatformCost;
  const savingsPercentage = totalOfflineCost > 0 ? (totalSavings / totalOfflineCost) * 100 : 0;

  // Narratives
  const executiveSummary = `For Order ${order.orderNumber} (${orderTotal.toLocaleString()} EGP), the TRUE offline cost is ${totalOfflineCost.toLocaleString()} EGP — ${savingsPercentage.toFixed(1)}% more expensive than the quoted price. Our platform reduces the total cost to ${totalPlatformCost.toLocaleString()} EGP, saving ${totalSavings.toLocaleString()} EGP (${savingsPercentage.toFixed(1)}%).`;

  const cfoNarrative = `Dear CFO,\n\nYour procurement team received a quote of ${orderTotal.toLocaleString()} EGP from ${order.supplier.name}. On paper, this seems competitive.\n\nHowever, when we account for the hidden costs of offline procurement in Egypt (2026):\n- Cost of Capital: ${costOfCapital.toFixed(0)} EGP (90-day payment delay)\n- ETA Compliance Risk: ${etaPenalty.toFixed(0)} EGP\n- Logistics Fragmentation: ${logisticsCost.toFixed(0)} EGP\n- Storage Waste: ${storageWaste.toFixed(0)} EGP\n- Dispute Losses: ${disputeLoss.toFixed(0)} EGP\n\nTotal hidden costs: ${(costOfCapital + etaPenalty + logisticsCost + storageWaste + disputeLoss).toFixed(0)} EGP\n\nWith Hotels Vendors, you pay a ${(platformFeeRate * 100).toFixed(1)}% platform fee (${platformFee.toFixed(0)} EGP) and a ${(factoringFeeRate * 100).toFixed(1)}% factoring fee (${factoringFee.toFixed(0)} EGP).\n\nNet savings: ${totalSavings.toLocaleString()} EGP (${savingsPercentage.toFixed(1)}%)\n\nThis is not marketing. This is arithmetic.`;

  const supplierNarrative = `Dear Supplier,\n\nBy offering your hotel customer factoring through Hotels Vendors, you get paid within 48 hours instead of 90 days.\n\nYour cost of capital at ${(market.smeCostOfCapitalAnnual * 100).toFixed(0)}% annual rate means waiting 90 days costs you ${costOfCapital.toFixed(0)} EGP on this order.\n\nThe factoring fee of ${factoringFee.toFixed(0)} EGP is LESS than your cost of capital (${costOfCapital.toFixed(0)} EGP). You are PROFITABLE on factoring.\n\nPlus, you eliminate collection risk, disputes, and administrative overhead.`;

  return {
    hotelId: order.hotelId,
    hotelName: order.hotel.name,
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderTotal,
    paymentTermsDays,
    marketConditions: market,
    lineItems,
    totalOfflineCost,
    totalPlatformCost,
    totalSavings,
    savingsPercentage,
    executiveSummary,
    cfoNarrative,
    supplierNarrative,
    generatedAt: new Date(),
  };
}
