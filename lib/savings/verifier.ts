/**
 * Savings Verification Engine — HotelsVendors
 *
 * Closes the loop: predicted opportunity → action taken → actual transaction
 * → compare actual cost to baseline → verify savings.
 */

import { prisma } from "../../lib/prisma";
import { updateStatus } from "./ledger";

export interface TransactionData {
  orderId: string;
  total: number;
  unitCost: number;
  quantity: number;
  supplierId?: string;
  productId?: string;
  invoiceId?: string;
}

export interface VerificationResult {
  verified: boolean;
  verifiedAmount: number;
  discrepancy: boolean;
  reason?: string;
  baseline: number;
  actualUnitCost: number;
}

/**
 * Compute actual savings from baseline and actual transactions.
 * Returns the verified savings amount (baseline - actual) * quantity.
 * Returns 0 if actual >= baseline (no savings).
 */
export function computeActualSavings(
  baseline: number,
  actualTransactions: TransactionData[]
): number {
  if (!actualTransactions.length) return 0;

  const totalQuantity = actualTransactions.reduce(
    (sum, t) => sum + t.quantity,
    0
  );
  const totalSpend = actualTransactions.reduce(
    (sum, t) => sum + t.unitCost * t.quantity,
    0
  );

  if (totalQuantity === 0) return 0;

  const weightedAvgUnitCost = totalSpend / totalQuantity;

  if (weightedAvgUnitCost >= baseline) {
    return 0;
  }

  const savingsPerUnit = baseline - weightedAvgUnitCost;
  return savingsPerUnit * totalQuantity;
}

/**
 * Verify a savings record by comparing its baseline to actual orders/invoices.
 * Updates the SavingsLedger with the verification result.
 */
export async function verifySavings(
  savingsId: string,
  verifiedById?: string
): Promise<VerificationResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const record = await (prisma as any).savingsLedger.findFirst({
    where: { id: savingsId, deletedAt: null },
    include: {
      opportunity: true,
      supplier: { select: { id: true } },
      product: { select: { id: true } },
    },
  });

  if (!record) {
    throw new Error("Savings record not found");
  }

  const baseline = record.baseline ? Number(record.baseline) : null;
  if (baseline === null || baseline <= 0) {
    throw new Error("Savings record has no valid baseline to verify against");
  }

  // Gather actual transactions after the savings record was created
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders = await (prisma as any).order.findMany({
    where: {
      tenantId: record.tenantId,
      deletedAt: null,
      status: { in: ["CONFIRMED", "DELIVERED", "COMPLETED"] },
      ...(record.supplierId ? { supplierId: record.supplierId } : {}),
      createdAt: { gte: record.createdAt },
    },
    include: {
      items: {
        where: {
          deletedAt: null,
          ...(record.productId ? { productId: record.productId } : {}),
        },
      },
      invoices: {
        where: {
          deletedAt: null,
          paymentStatus: { in: ["PAID", "PARTIALLY_PAID"] },
        },
      },
    },
  });

  // Build transaction data from order items
  const actualTransactions: TransactionData[] = [];
  for (const order of orders) {
    for (const item of order.items) {
      const unitCost = item.unitPrice ? Number(item.unitPrice) : 0;
      const quantity = item.quantity;
      if (unitCost > 0 && quantity > 0) {
        actualTransactions.push({
          orderId: order.id,
          total: item.total ? Number(item.total) : unitCost * quantity,
          unitCost,
          quantity,
          supplierId: order.supplierId,
          productId: item.productId,
        });
      }
    }
  }

  // If no completed orders, check invoices directly
  if (actualTransactions.length === 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoices = await (prisma as any).invoice.findMany({
      where: {
        tenantId: record.tenantId,
        deletedAt: null,
        paymentStatus: { in: ["PAID", "PARTIALLY_PAID"] },
        ...(record.supplierId ? { supplierId: record.supplierId } : {}),
        createdAt: { gte: record.createdAt },
      },
    });

    if (invoices.length > 0) {
      const invoiceTotal = invoices.reduce(
        (sum: number, inv: any) => sum + Number(inv.total ?? inv.subtotal ?? 0),
        0
      );
      actualTransactions.push({
        orderId: invoices[0].orderId,
        total: invoiceTotal,
        unitCost: invoiceTotal,
        quantity: 1,
        supplierId: record.supplierId ?? undefined,
        productId: record.productId ?? undefined,
        invoiceId: invoices[0].id,
      });
    }
  }

  // Compute actual savings
  const verifiedAmount = computeActualSavings(baseline, actualTransactions);

  let discrepancy = false;
  let verified = false;
  let reason: string | undefined;

  if (actualTransactions.length === 0) {
    discrepancy = true;
    reason = "No completed transactions found after action date";
    await flagDiscrepancy(savingsId, reason);
  } else {
    const potentialSaving = record.potentialSaving
      ? Number(record.potentialSaving)
      : 0;

    if (verifiedAmount > 0) {
      verified = true;
    } else if (verifiedAmount === 0) {
      discrepancy = true;
      reason = "Actual cost met or exceeded baseline — no savings realized";
      await flagDiscrepancy(savingsId, reason);
    } else {
      discrepancy = true;
      reason = `Actual cost exceeded baseline by ${Math.abs(verifiedAmount).toFixed(2)}`;
      await flagDiscrepancy(savingsId, reason);
    }

    if (verified && potentialSaving > 0) {
      const ratio = verifiedAmount / potentialSaving;
      if (ratio < 0.5) {
        reason = `Verified amount (${verifiedAmount.toFixed(2)}) is significantly below potential (${potentialSaving.toFixed(2)})`;
      }
    }
  }

  // Compute actual unit cost for reporting
  const totalQty = actualTransactions.reduce((s, t) => s + t.quantity, 0);
  const totalSpend = actualTransactions.reduce(
    (s, t) => s + t.unitCost * t.quantity,
    0
  );
  const actualUnitCost = totalQty > 0 ? totalSpend / totalQty : 0;

  // Update the savings record
  if (verified && !discrepancy) {
    await updateStatus(savingsId, "VERIFIED", {
      verifiedAmount,
      verifiedById: verifiedById || undefined,
      verifiedAt: new Date().toISOString(),
      evidence: {
        actualTransactions: actualTransactions.map((t) => ({
          orderId: t.orderId,
          total: t.total,
          unitCost: t.unitCost,
          quantity: t.quantity,
          invoiceId: t.invoiceId,
        })),
        baseline,
        actualUnitCost,
        computedAt: new Date().toISOString(),
      },
    });
  } else if (!discrepancy) {
    await updateStatus(savingsId, record.status, {
      verifiedAmount,
      verifiedById: verifiedById || undefined,
      verifiedAt: new Date().toISOString(),
    });
  }

  return {
    verified,
    verifiedAmount,
    discrepancy,
    reason,
    baseline,
    actualUnitCost,
  };
}

/**
 * Verify savings by finding the savings record linked to an opportunity.
 */
export async function verifyByOpportunity(
  opportunityId: string,
  verifiedById?: string
): Promise<VerificationResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const record = await (prisma as any).savingsLedger.findFirst({
    where: { opportunityId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new Error("No savings record found for this opportunity");
  }

  return verifySavings(record.id, verifiedById);
}

/**
 * Check if a savings record's verified amount matches or exceeds its potential saving.
 */
export async function isVerified(savingsId: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const record = await (prisma as any).savingsLedger.findFirst({
    where: { id: savingsId, deletedAt: null },
    select: {
      verifiedAmount: true,
      potentialSaving: true,
      status: true,
    },
  });

  if (!record) {
    throw new Error("Savings record not found");
  }

  if (record.status !== "VERIFIED") return false;

  const verifiedAmount = record.verifiedAmount ? Number(record.verifiedAmount) : 0;
  const potentialSaving = record.potentialSaving
    ? Number(record.potentialSaving)
    : 0;

  if (potentialSaving <= 0) return verifiedAmount > 0;

  return verifiedAmount >= potentialSaving;
}

/**
 * Flag a discrepancy on a savings record for manual review.
 */
export async function flagDiscrepancy(
  savingsId: string,
  reason: string
): Promise<void> {
  await updateStatus(savingsId, "DISPUTED", {
    disputeReason: reason,
  });
}
