/**
 * Cost Opportunity Engine — HotelsVendors
 *
 * Deterministic service that analyzes persisted procurement data
 * (SpendUploadRecord) to detect cost-reduction opportunities.
 *
 * All calculations are traceable to specific transactions. No AI/ML.
 */

import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface OpportunityInput {
  type:
    | "PRICE_DRIFT"
    | "SUPPLIER_CONCENTRATION"
    | "VOLUME_OPPORTUNITY"
    | "ALTERNATIVE_SOURCE"
    | "MAVERICK_SPEND"
    | "CONSOLIDATION"
    | "CONTRACT_VIOLATION"
    | "INVENTORY_LINKED";
  title: string;
  description?: string;
  baseline?: number;
  currentValue?: number;
  potentialImpact?: number;
  confidence?: number;
  recommendedAction?: string;
  affectedSupplierId?: string;
  affectedProductId?: string;
  affectedCategory?: string;
  evidence: Record<string, unknown>;
  idempotencyKey: string;
}

export interface AnalysisSummary {
  tenantId: string;
  detected: number;
  priceDrift: number;
  supplierConcentration: number;
  volumeOpportunity: number;
  duplicatePurchases: number;
  totalPotentialSavings: number;
  errors: string[];
}

// ────────────────────────────────────────────────────────────────────────────
// Idempotency helper
// ────────────────────────────────────────────────────────────────────────────

async function idempotencyKeyExists(
  tenantId: string,
  key: string,
  prisma: PrismaClient
): Promise<boolean> {
  // We store the idempotency key inside evidence JSON.
  // Evidence is stored as JSON; we use raw query for portability.
  const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "Opportunity"
    WHERE "tenantId" = ${tenantId}
      AND "deletedAt" IS NULL
      AND "evidence" IS NOT NULL
      AND "evidence"->>'idempotencyKey' = ${key}
  `;
  return Number(result[0]?.count ?? 0) > 0;
}

// ────────────────────────────────────────────────────────────────────────────
// Opportunity persister
// ────────────────────────────────────────────────────────────────────────────

async function persistOpportunity(
  tenantId: string,
  input: OpportunityInput,
  prisma: PrismaClient
): Promise<boolean> {
  const exists = await idempotencyKeyExists(tenantId, input.idempotencyKey, prisma);
  if (exists) return false;

  await prisma.opportunity.create({
    data: {
      tenantId,
      type: input.type,
      status: "DETECTED",
      title: input.title,
      description: input.description,
      evidence: input.evidence as Prisma.InputJsonValue,
      baseline: input.baseline != null ? new Prisma.Decimal(input.baseline) : undefined,
      currentValue: input.currentValue != null ? new Prisma.Decimal(input.currentValue) : undefined,
      potentialImpact: input.potentialImpact != null ? new Prisma.Decimal(input.potentialImpact) : undefined,
      confidence: input.confidence,
      recommendedAction: input.recommendedAction,
      affectedSupplierId: input.affectedSupplierId,
      affectedProductId: input.affectedProductId,
      affectedCategory: input.affectedCategory,
    },
  });
  return true;
}

// ────────────────────────────────────────────────────────────────────────────
// 1. PRICE DRIFT DETECTOR
// Find products where price increased >15% over 3+ months
// ────────────────────────────────────────────────────────────────────────────

export async function detectPriceDrift(
  tenantId: string,
  prisma: PrismaClient = defaultPrisma
): Promise<number> {
  // Fetch all spend records with valid productId, unitPrice, and date
  const records = await prisma.spendUploadRecord.findMany({
    where: {
      tenantId,
      productId: { not: null },
      unitPrice: { not: null },
      normalizedDate: { not: null },
    },
    orderBy: { normalizedDate: "asc" },
  });

  // Group by productId
  const byProduct = new Map<string, typeof records>();
  for (const r of records) {
    const pid = r.productId!;
    if (!byProduct.has(pid)) byProduct.set(pid, []);
    byProduct.get(pid)!.push(r);
  }

  let count = 0;
  for (const [productId, productRecords] of byProduct) {
    if (productRecords.length < 2) continue;

    // Check if we have 3+ months of data
    const firstDate = productRecords[0].normalizedDate!;
    const lastDate = productRecords[productRecords.length - 1].normalizedDate!;
    const monthsDiff =
      (lastDate.getFullYear() - firstDate.getFullYear()) * 12 +
      (lastDate.getMonth() - firstDate.getMonth());

    if (monthsDiff < 3) continue;

    // Calculate early average (first 25% of records) and late average (last 25%)
    const quarterLen = Math.max(1, Math.floor(productRecords.length / 4));
    const earlyRecords = productRecords.slice(0, quarterLen);
    const lateRecords = productRecords.slice(-quarterLen);

    const earlyAvg =
      earlyRecords.reduce((s, r) => s + (r.unitPrice?.toNumber() ?? 0), 0) /
      earlyRecords.length;
    const lateAvg =
      lateRecords.reduce((s, r) => s + (r.unitPrice?.toNumber() ?? 0), 0) /
      lateRecords.length;

    if (earlyAvg <= 0) continue;

    const increasePct = ((lateAvg - earlyAvg) / earlyAvg) * 100;

    if (increasePct > 15) {
      // Calculate annual impact: projected annual spend at new price minus at old price
      const totalQty =
        productRecords.reduce((s, r) => s + (r.quantity ?? 0), 0) || 1;
      const spendPerUnitLate = lateAvg;
      const annualQtyEstimate = totalQty * (12 / Math.max(monthsDiff, 1));
      const potentialImpact = (spendPerUnitLate - earlyAvg) * annualQtyEstimate;

      // Confidence: based on data points and consistency
      const confidence = Math.min(0.95, 0.4 + productRecords.length * 0.05);

      const recentTransactions = lateRecords.slice(-5).map((r) => ({
        date: r.normalizedDate?.toISOString(),
        unitPrice: r.unitPrice?.toNumber(),
        quantity: r.quantity,
        invoiceNumber: r.invoiceNumber,
        poNumber: r.poNumber,
      }));

      const supplierName =
        productRecords[productRecords.length - 1].supplierName ?? "Unknown";
      const productName =
        productRecords[productRecords.length - 1].productName ?? productId;

      const created = await persistOpportunity(
        tenantId,
        {
          type: "PRICE_DRIFT",
          title: `Price drift: ${productName} (+${increasePct.toFixed(1)}%)`,
          description: `Unit price increased from ${earlyAvg.toFixed(2)} to ${lateAvg.toFixed(2)} EGP over ${monthsDiff} months. Supplier: ${supplierName}.`,
          baseline: earlyAvg,
          currentValue: lateAvg,
          potentialImpact: Math.max(0, potentialImpact),
          confidence,
          recommendedAction: `Negotiate price back to ${earlyAvg.toFixed(2)} EGP or source alternative. Volume: ~${Math.round(annualQtyEstimate)} units/year.`,
          affectedSupplierId: productRecords[productRecords.length - 1].supplierId ?? undefined,
          affectedProductId: productId,
          affectedCategory: productRecords[productRecords.length - 1].category ?? undefined,
          idempotencyKey: `price-drift:${productId}:${tenantId}`,
          evidence: {
            idempotencyKey: `price-drift:${productId}:${tenantId}`,
            increasePct: Number(increasePct.toFixed(2)),
            monthsDiff,
            earlyAvg: Number(earlyAvg.toFixed(2)),
            lateAvg: Number(lateAvg.toFixed(2)),
            dataPoints: productRecords.length,
            annualQtyEstimate: Math.round(annualQtyEstimate),
            supplierName,
            productName,
            recentTransactions,
          },
        },
        prisma
      );
      if (created) count++;
    }
  }
  return count;
}

// ────────────────────────────────────────────────────────────────────────────
// 2. SUPPLIER CONCENTRATION DETECTOR
// Find categories where >60% of spend is with one supplier
// ────────────────────────────────────────────────────────────────────────────

export async function detectSupplierConcentration(
  tenantId: string,
  prisma: PrismaClient = defaultPrisma
): Promise<number> {
  // Aggregate spend by category and supplier
  const records = await prisma.spendUploadRecord.findMany({
    where: {
      tenantId,
      category: { not: null },
      totalAmount: { not: null },
    },
  });

  // Group by category → supplier → total spend
  const byCategory = new Map<string, Map<string, number>>();
  const categorySupplierNames = new Map<string, Map<string, string>>();
  const categorySupplierIds = new Map<string, Map<string, string>>();

  for (const r of records) {
    const cat = r.category!;
    if (!byCategory.has(cat)) {
      byCategory.set(cat, new Map());
      categorySupplierNames.set(cat, new Map());
      categorySupplierIds.set(cat, new Map());
    }
    const supplierKey = r.supplierId ?? r.supplierName ?? "unknown";
    const current = byCategory.get(cat)!.get(supplierKey) ?? 0;
    byCategory.get(cat)!.set(supplierKey, current + (r.totalAmount?.toNumber() ?? 0));
    categorySupplierNames.get(cat)!.set(supplierKey, r.supplierName ?? "Unknown");
    if (r.supplierId) {
      categorySupplierIds.get(cat)!.set(supplierKey, r.supplierId);
    }
  }

  let count = 0;
  for (const [category, supplierSpend] of byCategory) {
    const totalSpend = Array.from(supplierSpend.values()).reduce((a, b) => a + b, 0);
    if (totalSpend <= 0) continue;

    // Find dominant supplier
    for (const [supplierKey, spend] of supplierSpend) {
      const concentrationPct = (spend / totalSpend) * 100;

      if (concentrationPct > 60) {
        // Estimate savings: assume 10% reduction possible with competitive bidding
        const potentialImpact = spend * 0.10;
        const supplierCount = supplierSpend.size;
        // Confidence higher with more data (suppliers and transactions)
        const confidence = Math.min(0.9, 0.5 + supplierCount * 0.1);

        const supplierName = categorySupplierNames.get(category)!.get(supplierKey) ?? "Unknown";
        const supplierId = categorySupplierIds.get(category)!.get(supplierKey);

        // Get specific transaction references
        const transactions = records
          .filter((r) => {
            const key = r.supplierId ?? r.supplierName ?? "unknown";
            return r.category === category && key === supplierKey;
          })
          .slice(-5)
          .map((r) => ({
            date: r.normalizedDate?.toISOString(),
            totalAmount: r.totalAmount?.toNumber(),
            invoiceNumber: r.invoiceNumber,
            poNumber: r.poNumber,
          }));

        const created = await persistOpportunity(
          tenantId,
          {
            type: "SUPPLIER_CONCENTRATION",
            title: `Supplier concentration: ${category} (${concentrationPct.toFixed(1)}% with ${supplierName})`,
            description: `${concentrationPct.toFixed(1)}% of ${category} spend (${spend.toFixed(2)} EGP) is with ${supplierName}. ${supplierCount - 1} alternative supplier(s) identified.`,
            baseline: totalSpend,
            currentValue: concentrationPct,
            potentialImpact,
            confidence,
            recommendedAction: `Diversify ${category} sourcing. Issue RFQ to alternative suppliers for estimated ${potentialImpact.toFixed(2)} EGP annual savings.`,
            affectedSupplierId: supplierId,
            affectedCategory: category,
            idempotencyKey: `supplier-conc:${category}:${supplierKey}:${tenantId}`,
            evidence: {
              idempotencyKey: `supplier-conc:${category}:${supplierKey}:${tenantId}`,
              category,
              supplierName,
              supplierId,
              concentrationPct: Number(concentrationPct.toFixed(2)),
              totalSpend: Number(totalSpend.toFixed(2)),
              supplierSpend: Number(spend.toFixed(2)),
              supplierCount,
              transactions,
            },
          },
          prisma
        );
        if (created) count++;
      }
    }
  }
  return count;
}

// ────────────────────────────────────────────────────────────────────────────
// 3. VOLUME OPPORTUNITY DETECTOR
// Find products bought frequently in small quantities (could bulk-order)
// ────────────────────────────────────────────────────────────────────────────

export async function detectVolumeOpportunity(
  tenantId: string,
  prisma: PrismaClient = defaultPrisma
): Promise<number> {
  const records = await prisma.spendUploadRecord.findMany({
    where: {
      tenantId,
      productId: { not: null },
      quantity: { not: null },
      unitPrice: { not: null },
      normalizedDate: { not: null },
    },
  });

  // Group by productId
  const byProduct = new Map<string, typeof records>();
  for (const r of records) {
    const pid = r.productId!;
    if (!byProduct.has(pid)) byProduct.set(pid, []);
    byProduct.get(pid)!.push(r);
  }

  let count = 0;
  for (const [productId, productRecords] of byProduct) {
    // Need at least 3 purchases to be "frequent"
    if (productRecords.length < 3) continue;

    const quantities = productRecords
      .map((r) => r.quantity ?? 0)
      .filter((q) => q > 0);
    if (quantities.length < 3) continue;

    const avgQty = quantities.reduce((a, b) => a + b, 0) / quantities.length;
    const maxQty = Math.max(...quantities);

    // Opportunity: if average order is small relative to max single order
    // AND frequent (3+ times in period)
    const frequency = productRecords.length;
    const price =
      productRecords[productRecords.length - 1].unitPrice?.toNumber() ?? 0;
    if (price <= 0) continue;

    // If avg order is less than 40% of max order, consolidation could save
    const consolidationRatio = avgQty / maxQty;

    if (consolidationRatio < 0.4 && frequency >= 3) {
      // Estimate: consolidate into bulk orders, assume 8% bulk discount
      const annualQty =
        quantities.reduce((a, b) => a + b, 0) *
        (12 /
          Math.max(
            (productRecords[productRecords.length - 1].normalizedDate!.getTime() -
              productRecords[0].normalizedDate!.getTime()) /
              (1000 * 60 * 60 * 24 * 30),
            1
          ));
      const potentialImpact = annualQty * price * 0.08;

      const confidence = Math.min(0.85, 0.4 + frequency * 0.08);
      const supplierName =
        productRecords[productRecords.length - 1].supplierName ?? "Unknown";
      const productName =
        productRecords[productRecords.length - 1].productName ?? productId;

      const transactions = productRecords.slice(-5).map((r) => ({
        date: r.normalizedDate?.toISOString(),
        quantity: r.quantity,
        unitPrice: r.unitPrice?.toNumber(),
        invoiceNumber: r.invoiceNumber,
        poNumber: r.poNumber,
      }));

      const created = await persistOpportunity(
        tenantId,
        {
          type: "VOLUME_OPPORTUNITY",
          title: `Volume consolidation: ${productName} (${frequency} orders, avg ${avgQty.toFixed(0)} units)`,
          description: `Product ordered ${frequency} times at avg ${avgQty.toFixed(0)} units/order. Consolidating to bulk orders (~${maxQty} units) could yield bulk discounts.`,
          baseline: avgQty,
          currentValue: frequency,
          potentialImpact,
          confidence,
          recommendedAction: `Consolidate ${productName} orders to bulk quantities. Estimated annual savings: ${potentialImpact.toFixed(2)} EGP via 8% bulk discount.`,
          affectedSupplierId:
            productRecords[productRecords.length - 1].supplierId ?? undefined,
          affectedProductId: productId,
          affectedCategory:
            productRecords[productRecords.length - 1].category ?? undefined,
          idempotencyKey: `volume:${productId}:${tenantId}`,
          evidence: {
            idempotencyKey: `volume:${productId}:${tenantId}`,
            productId,
            productName,
            supplierName,
            frequency,
            avgQty: Number(avgQty.toFixed(2)),
            maxQty,
            annualQtyEstimate: Math.round(annualQty),
            currentPrice: price,
            transactions,
          },
        },
        prisma
      );
      if (created) count++;
    }
  }
  return count;
}

// ────────────────────────────────────────────────────────────────────────────
// 4. DUPLICATE PURCHASE DETECTOR
// Find same product bought multiple times per month
// ────────────────────────────────────────────────────────────────────────────

export async function detectDuplicatePurchases(
  tenantId: string,
  prisma: PrismaClient = defaultPrisma
): Promise<number> {
  const records = await prisma.spendUploadRecord.findMany({
    where: {
      tenantId,
      productId: { not: null },
      normalizedDate: { not: null },
      totalAmount: { not: null },
    },
  });

  // Group by productId + year-month
  const byProductMonth = new Map<string, typeof records>();
  for (const r of records) {
    const pid = r.productId!;
    const date = r.normalizedDate!;
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const key = `${pid}:${monthKey}`;
    if (!byProductMonth.has(key)) byProductMonth.set(key, []);
    byProductMonth.get(key)!.push(r);
  }

  // Aggregate: products with 3+ purchases in a single month, repeated across months
  const productMonthCounts = new Map<string, number>();
  for (const [, monthRecords] of byProductMonth) {
    if (monthRecords.length >= 3) {
      const pid = monthRecords[0].productId!;
      productMonthCounts.set(pid, (productMonthCounts.get(pid) ?? 0) + 1);
    }
  }

  let count = 0;
  for (const [productId, monthsWithDuplicates] of productMonthCounts) {
    if (monthsWithDuplicates < 2) continue; // Need pattern across 2+ months

    const productRecords = records
      .filter((r) => r.productId === productId)
      .sort(
        (a, b) =>
          (a.normalizedDate?.getTime() ?? 0) - (b.normalizedDate?.getTime() ?? 0)
      );

    if (productRecords.length === 0) continue;

    const totalSpend = productRecords.reduce(
      (s, r) => s + (r.totalAmount?.toNumber() ?? 0),
      0
    );
    const avgOrderValue = totalSpend / productRecords.length;

    // Savings: consolidating duplicate orders reduces admin + shipping costs (~5% of spend)
    const potentialImpact = totalSpend * 0.05;
    const confidence = Math.min(0.9, 0.5 + monthsWithDuplicates * 0.1);

    const supplierName =
      productRecords[productRecords.length - 1].supplierName ?? "Unknown";
    const productName =
      productRecords[productRecords.length - 1].productName ?? productId;

    const transactions = productRecords.slice(-8).map((r) => ({
      date: r.normalizedDate?.toISOString(),
      totalAmount: r.totalAmount?.toNumber(),
      invoiceNumber: r.invoiceNumber,
      poNumber: r.poNumber,
    }));

    const created = await persistOpportunity(
      tenantId,
      {
        type: "CONSOLIDATION",
        title: `Duplicate purchases: ${productName} (${productRecords.length} orders, ${monthsWithDuplicates} months with 3+)`,
        description: `Same product ordered ${productRecords.length} times across ${monthsWithDuplicates} months with 3+ orders each. Indicates poor purchase planning.`,
        baseline: productRecords.length,
        currentValue: monthsWithDuplicates,
        potentialImpact,
        confidence,
        recommendedAction: `Implement scheduled ordering for ${productName}. Reducing duplicate orders saves ~5% (${potentialImpact.toFixed(2)} EGP) in admin/shipping costs annually.`,
        affectedSupplierId:
          productRecords[productRecords.length - 1].supplierId ?? undefined,
        affectedProductId: productId,
        affectedCategory:
          productRecords[productRecords.length - 1].category ?? undefined,
        idempotencyKey: `duplicate:${productId}:${tenantId}`,
        evidence: {
          idempotencyKey: `duplicate:${productId}:${tenantId}`,
          productId,
          productName,
          supplierName,
          totalOrders: productRecords.length,
          monthsWithDuplicates,
          totalSpend: Number(totalSpend.toFixed(2)),
          avgOrderValue: Number(avgOrderValue.toFixed(2)),
          transactions,
        },
      },
      prisma
    );
    if (created) count++;
  }
  return count;
}

// ────────────────────────────────────────────────────────────────────────────
// MASTER ANALYSIS ORCHESTRATOR
// ────────────────────────────────────────────────────────────────────────────

export async function analyzeSpend(
  tenantId: string,
  prisma: PrismaClient = defaultPrisma
): Promise<AnalysisSummary> {
  const errors: string[] = [];
  let priceDrift = 0;
  let supplierConcentration = 0;
  let volumeOpportunity = 0;
  let duplicatePurchases = 0;

  try {
    priceDrift = await detectPriceDrift(tenantId, prisma);
  } catch (err) {
    errors.push(`priceDrift: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    supplierConcentration = await detectSupplierConcentration(tenantId, prisma);
  } catch (err) {
    errors.push(
      `supplierConcentration: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  try {
    volumeOpportunity = await detectVolumeOpportunity(tenantId, prisma);
  } catch (err) {
    errors.push(
      `volumeOpportunity: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  try {
    duplicatePurchases = await detectDuplicatePurchases(tenantId, prisma);
  } catch (err) {
    errors.push(
      `duplicatePurchases: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const detected =
    priceDrift + supplierConcentration + volumeOpportunity + duplicatePurchases;

  // Calculate total potential savings from newly detected opportunities
  const newOpportunities = await prisma.opportunity.findMany({
    where: {
      tenantId,
      status: "DETECTED",
      createdAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
      },
    },
    select: { potentialImpact: true },
  });

  let totalPotentialSavings = 0;
  for (const o of newOpportunities) {
    totalPotentialSavings += o.potentialImpact?.toNumber() ?? 0;
  }

  return {
    tenantId,
    detected,
    priceDrift,
    supplierConcentration,
    volumeOpportunity,
    duplicatePurchases,
    totalPotentialSavings,
    errors,
  };
}

// Alias for clarity in route handler
export const runFullAnalysis = analyzeSpend;
