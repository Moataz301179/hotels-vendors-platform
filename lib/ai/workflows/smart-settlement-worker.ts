/**
 * Smart Settlement Worker
 * Hotels Vendors AI Workflows Layer
 *
 * Background worker for automated invoice settlement reconciliation.
 * Matches payments to invoices, handles factoring settlements, and reconciles credit facilities.
 */

import { prisma } from "@/lib/prisma";

export interface SettlementResult {
  processed: number;
  matched: number;
  errors: string[];
  details: SettlementDetail[];
}

export interface SettlementDetail {
  invoiceId: string;
  invoiceNumber: string;
  action: "FULLY_PAID" | "PARTIALLY_PAID" | "OVERPAID" | "FACTORING_SETTLED" | "CREDIT_APPLIED" | "DISPUTED";
  amount: number;
  paymentId?: string;
  factoringRequestId?: string;
  creditTransactionId?: string;
  timestamp: Date;
}

/**
 * Start the smart settlement worker as a continuous background process.
 * Processes pending settlements every 60 seconds.
 */
export async function startSmartSettlementWorker(): Promise<void> {
  console.log("[Smart Settlement Worker] Started - polling every 60s");

  // Run immediately once, then every 60s
  await processSettlement();

  setInterval(async () => {
    try {
      await processSettlement();
    } catch (err) {
      console.error("[Smart Settlement Worker] Cycle error:", err);
    }
  }, 60_000);
}

/**
 * Process all pending settlements:
 * 1. Match unmatched payments to invoices
 * 2. Process factoring settlements for ACCEPTED factoring requests
 * 3. Apply credit facility repayments
 * 4. Update invoice payment statuses
 */
export async function processSettlement(): Promise<SettlementResult> {
  console.log("[Smart Settlement Worker] Processing settlements...");

  const result: SettlementResult = {
    processed: 0,
    matched: 0,
    errors: [],
    details: [],
  };

  try {
    // 1. Match unmatched payments to invoices
    const paymentMatches = await matchPaymentsToInvoices();
    result.processed += paymentMatches.processed;
    result.matched += paymentMatches.matched;
    result.details.push(...paymentMatches.details);
    result.errors.push(...paymentMatches.errors);

    // 2. Process factoring settlements (invoice funded, awaiting supplier repayment)
    const factoringSettlements = await processFactoringSettlements();
    result.processed += factoringSettlements.processed;
    result.matched += factoringSettlements.matched;
    result.details.push(...factoringSettlements.details);
    result.errors.push(...factoringSettlements.errors);

    // 3. Apply credit facility repayments
    const creditRepayments = await applyCreditRepayments();
    result.processed += creditRepayments.processed;
    result.matched += creditRepayments.matched;
    result.details.push(...creditRepayments.details);
    result.errors.push(...creditRepayments.errors);

    // 4. Reconcile invoice payment statuses
    const reconciliations = await reconcileInvoiceStatuses();
    result.processed += reconciliations.processed;
    result.matched += reconciliations.matched;
    result.details.push(...reconciliations.details);
    result.errors.push(...reconciliations.errors);

    console.log(
      `[Smart Settlement Worker] Cycle complete: ${result.matched}/${result.processed} matched, ${result.errors.length} errors`
    );

    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    result.errors.push(msg);
    console.error("[Smart Settlement Worker] Fatal error:", err);
    return result;
  }
}

/**
 * Match unmatched payments to their invoices
 */
async function matchPaymentsToInvoices(): Promise<SettlementResult> {
  const result: SettlementResult = { processed: 0, matched: 0, errors: [], details: [] };

  // Find payments without invoice or with PENDING status
  const unmatchedPayments = await prisma.payment.findMany({
    where: {
      status: "PENDING",
      invoiceId: { not: null },
      deletedAt: null,
    },
    take: 100,
  });

  for (const payment of unmatchedPayments) {
    try {
      result.processed++;

      const invoice = await prisma.invoice.findUnique({
        where: { id: payment.invoiceId! },
      });

      if (!invoice) {
        result.errors.push(`Payment ${payment.paymentNumber}: invoice not found`);
        continue;
      }

      const invoiceTotal = Number(invoice.total ?? 0);

      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", paidAt: new Date() },
      });

      // Check if fully paid
      const existingPayments = await prisma.payment.aggregate({
        where: { invoiceId: invoice.id, status: "PAID" },
        _sum: { amount: true },
      });

      const totalPaid = Number(existingPayments._sum?.amount ?? 0);

      if (totalPaid >= invoiceTotal) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { paymentStatus: "PAID", paidDate: new Date() },
        });
        result.details.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          action: "FULLY_PAID",
          amount: totalPaid,
          paymentId: payment.id,
          timestamp: new Date(),
        });
      } else {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { paymentStatus: "PARTIALLY_PAID" },
        });
        result.details.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          action: "PARTIALLY_PAID",
          amount: totalPaid,
          paymentId: payment.id,
          timestamp: new Date(),
        });
      }

      result.matched++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      result.errors.push(`Payment ${payment.paymentNumber}: ${msg}`);
    }
  }

  return result;
}

/**
 * Process factoring settlements:
 * - Invoices funded by factoring company
 * - Supplier receives accelerated cash
 * - When hotel pays, funds go to factoring company (not supplier)
 */
async function processFactoringSettlements(): Promise<SettlementResult> {
  const result: SettlementResult = { processed: 0, matched: 0, errors: [], details: [] };

  // Find invoices that were factored and are now paid by hotel.
  // "PAID" = factoring company disbursed the advance (current FactoringStatus value).
  // Skip requests already SETTLED so each invoice is processed only once.
  const factoredInvoices = await prisma.invoice.findMany({
    where: {
      factoringStatus: "PAID",
      paymentStatus: "PAID",
      deletedAt: null,
      factoringRequests: { isNot: { status: "SETTLED" } },
    },
    take: 50,
  });

  for (const invoice of factoredInvoices) {
    try {
      result.processed++;

      // Find the factoring request
      const factoringRequest = await prisma.factoringRequest.findFirst({
        where: { invoiceId: invoice.id },
        include: { factoringCompany: true },
      });

      if (!factoringRequest) {
        result.errors.push(`Invoice ${invoice.invoiceNumber}: no factoring request found`);
        continue;
      }

      // Create settlement transaction for factoring company
      const settlementAmount = Number(
        factoringRequest.disbursedAmount ?? factoringRequest.requestedAmount ?? 0
      );
      const payment = await prisma.payment.create({
        data: {
          paymentNumber: `SETL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          currency: invoice.currency || "EGP",
          method: "BANK_TRANSFER",
          status: "PAID",
          hotelId: invoice.hotelId,
          invoiceId: invoice.id,
          tenantId: invoice.tenantId,
          amount: settlementAmount,
          paidAt: new Date(),
          referenceCode: `FACTORING_SETTLEMENT_${factoringRequest.id}`,
        },
      });

      // Mark the factoring request settled (source of truth; the invoice
      // factoringStatus stays "PAID" since FactoringStatus has no SETTLED value).
      await prisma.factoringRequest.update({
        where: { id: factoringRequest.id },
        data: { status: "SETTLED", settledAt: new Date() },
      });

      // Create credit transaction for audit trail
      await prisma.creditTransaction.create({
        data: {
          hotelId: invoice.hotelId,
          factoringCompanyId: factoringRequest.factoringCompanyId,
          invoiceId: invoice.id,
          type: "FACTORING_COLLECTION",
          amount: settlementAmount,
          description: `Factoring settlement for invoice ${invoice.invoiceNumber}`,
          tenantId: invoice.tenantId,
        },
      });

      result.details.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        action: "FACTORING_SETTLED",
        amount: settlementAmount,
        paymentId: payment.id,
        factoringRequestId: factoringRequest.id,
        timestamp: new Date(),
      });

      result.matched++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      result.errors.push(`Factoring settlement ${invoice.invoiceNumber}: ${msg}`);
    }
  }

  return result;
}

/**
 * Apply credit facility repayments:
 * When hotel pays an invoice that was funded via credit facility,
 * apply the repayment to the facility's utilized amount
 */
async function applyCreditRepayments(): Promise<SettlementResult> {
  const result: SettlementResult = { processed: 0, matched: 0, errors: [], details: [] };

  // Find active credit facilities
  const facilities = await prisma.creditFacility.findMany({
    where: { status: "ACTIVE", deletedAt: null },
    take: 50,
  });

  for (const facility of facilities) {
    try {
      // Find invoices for this hotel that were paid but not yet applied to facility
      const paidInvoices = await prisma.invoice.findMany({
        where: {
          hotelId: facility.hotelId,
          paymentStatus: "PAID",
          creditTransactions: { none: { type: "CREDIT_REPAY" } },
        },
        take: 20,
      });

      for (const invoice of paidInvoices) {
        result.processed++;

        const invoiceTotal = Number(invoice.total ?? 0);

        // Create credit transaction
        await prisma.creditTransaction.create({
          data: {
            hotelId: facility.hotelId,
            factoringCompanyId: facility.factoringCompanyId,
            invoiceId: invoice.id,
            type: "CREDIT_REPAY",
            amount: invoiceTotal,
            description: `Credit facility repayment for invoice ${invoice.invoiceNumber}`,
            tenantId: invoice.tenantId,
          },
        });

        // Reduce facility utilized amount
        await prisma.creditFacility.update({
          where: { id: facility.id },
          data: {
            utilized: { decrement: invoiceTotal },
            updatedAt: new Date(),
          },
        });

        result.details.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          action: "CREDIT_APPLIED",
          amount: invoiceTotal,
          creditTransactionId: (await prisma.creditTransaction.findFirst({
            where: { invoiceId: invoice.id, type: "CREDIT_REPAY" },
            orderBy: { createdAt: "desc" },
            select: { id: true },
          }))?.id || "",
          timestamp: new Date(),
        });

        result.matched++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      result.errors.push(`Credit facility ${facility.id}: ${msg}`);
    }
  }

  return result;
}

/**
 * Reconcile invoice payment statuses:
 * Ensure paymentStatus matches actual payment records
 */
async function reconcileInvoiceStatuses(): Promise<SettlementResult> {
  const result: SettlementResult = { processed: 0, matched: 0, errors: [], details: [] };

  // Find invoices where payment status might be wrong.
  // InvoiceStatus has no CANCELLED/VOID — skip drafts and credit notes instead.
  const invoices = await prisma.invoice.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["DRAFT", "CREDIT_NOTE"] },
    },
    take: 200,
  });

  for (const invoice of invoices) {
    try {
      result.processed++;

      const payments = await prisma.payment.aggregate({
        where: { invoiceId: invoice.id, status: "PAID" },
        _sum: { amount: true },
      });

      const totalPaid = Number(payments._sum?.amount ?? 0);
      const invoiceTotal = Number(invoice.total ?? 0);

      // PaymentStatus has no PARTIAL/OVERPAID — map to closest valid values.
      let newStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID" = "UNPAID";

      if (totalPaid === 0) {
        newStatus = "UNPAID";
      } else if (totalPaid >= invoiceTotal) {
        newStatus = "PAID";
      } else {
        newStatus = "PARTIALLY_PAID";
      }

      if (invoice.paymentStatus !== newStatus) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { paymentStatus: newStatus },
        });

        result.details.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          action: newStatus === "PAID" ? (totalPaid > invoiceTotal ? "OVERPAID" : "FULLY_PAID") : "PARTIALLY_PAID",
          amount: totalPaid,
          timestamp: new Date(),
        });

        result.matched++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      result.errors.push(`Invoice ${invoice.invoiceNumber}: ${msg}`);
    }
  }

  return result;
}

/**
 * Manual trigger for processing a specific invoice settlement
 */
export async function processInvoiceSettlement(invoiceId: string): Promise<SettlementDetail | null> {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return null;

  const payments = await prisma.payment.aggregate({
    where: { invoiceId: invoice.id, status: "PAID" },
    _sum: { amount: true },
  });

  const totalPaid = Number(payments._sum?.amount ?? 0);
  const invoiceTotal = Number(invoice.total ?? 0);

  if (totalPaid >= invoiceTotal) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { paymentStatus: "PAID", paidDate: new Date() },
    });
    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      action: "FULLY_PAID",
      amount: totalPaid,
      timestamp: new Date(),
    };
  }

  return null;
}