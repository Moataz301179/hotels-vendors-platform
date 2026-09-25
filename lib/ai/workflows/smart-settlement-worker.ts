/**
 * Smart Settlement Worker
 * Hotels Vendors AI Workflows Layer
 *
 * Background worker for automated invoice settlement reconciliation.
 * Matches payments to invoices, handles factoring settlements, and reconciles credit facilities.
 *
 * SECURITY HARDENING (2026-09-23):
 * - setInterval commented out — worker MUST NOT run autonomously in production
 * - All mutations require explicit authorization context
 * - All queries are tenant-scoped
 * - Audit logging added before every financial state change
 * - Idempotency keys prevent double-processing
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

/** Authorization context required for every financial mutation */
export interface SettlementAuth {
  /** User/admin who authorized this settlement batch */
  authorizedBy: string;
  /** User ID (actorId) */
  authorizedByUserId: string;
  /** Explicit approval reference (ticket, order, or approval ID) */
  approvalReference: string;
  /** Tenant scope — all queries MUST filter by this */
  tenantId: string;
  /** Idempotency key to prevent double-processing */
  idempotencyKey: string;
}

/**
 * Start the smart settlement worker as a continuous background process.
 * PRODUCTION HARDENED: setInterval disabled — settlements require explicit human approval.
 */
export async function startSmartSettlementWorker(): Promise<void> {
  console.log("[Smart Settlement Worker] BLOCKED: Autonomous background processing disabled. Use processSettlement(auth) with explicit authorization.");

  // HARDENED: setInterval commented out — no autonomous financial mutations
  // setInterval(async () => {
  //   try {
  //     await processSettlement();
  //   } catch (err) {
  //     console.error("[Smart Settlement Worker] Cycle error:", err);
  //   }
  // }, 60_000);
}

/**
 * Process all pending settlements — REQUIRES explicit authorization.
 */
export async function processSettlement(auth?: SettlementAuth): Promise<SettlementResult> {
  const result: SettlementResult = {
    processed: 0,
    matched: 0,
    errors: [],
    details: [],
  };

  if (!auth) {
    result.errors.push("BLOCKED: processSettlement requires authorization context");
    return result;
  }

  // Validate authorization
  if (!auth.authorizedBy || !auth.approvalReference || !auth.tenantId || !auth.idempotencyKey) {
    result.errors.push("BLOCKED: Incomplete authorization — requires authorizedBy, approvalReference, tenantId, idempotencyKey");
    return result;
  }

  // Idempotency check — prevent double-processing via audit log
  const existingBatch = await prisma.auditLog.findFirst({
    where: {
      entityName: "SETTLEMENT_BATCH",
      entityId: auth.idempotencyKey,
      tenantId: auth.tenantId,
    },
  });
  if (existingBatch) {
    result.errors.push(`BLOCKED: Duplicate idempotency key ${auth.idempotencyKey} — batch already processed`);
    return result;
  }

  // Create audit record for this batch (idempotency marker)
  await prisma.auditLog.create({
    data: {
      entityName: "SETTLEMENT_BATCH",
      entityId: auth.idempotencyKey,
      actionType: "CREATE",
      actorId: auth.authorizedByUserId,
      actorRole: "ADMIN",
      tenantId: auth.tenantId,
      changes: {
        authorizedBy: auth.authorizedBy,
        approvalReference: auth.approvalReference,
        startedAt: new Date().toISOString(),
      },
    },
  });

  try {
    // 1. Match unmatched payments to invoices (TENANT-SCOPED)
    const paymentMatches = await matchPaymentsToInvoices(auth);
    result.processed += paymentMatches.processed;
    result.matched += paymentMatches.matched;
    result.details.push(...paymentMatches.details);
    result.errors.push(...paymentMatches.errors);

    // 2. Process factoring settlements (TENANT-SCOPED)
    const factoringSettlements = await processFactoringSettlements(auth);
    result.processed += factoringSettlements.processed;
    result.matched += factoringSettlements.matched;
    result.details.push(...factoringSettlements.details);
    result.errors.push(...factoringSettlements.errors);

    // 3. Apply credit facility repayments (TENANT-SCOPED)
    const creditRepayments = await applyCreditRepayments(auth);
    result.processed += creditRepayments.processed;
    result.matched += creditRepayments.matched;
    result.details.push(...creditRepayments.details);
    result.errors.push(...creditRepayments.errors);

    // 4. Reconcile invoice payment statuses (TENANT-SCOPED)
    const reconciliations = await reconcileInvoiceStatuses(auth);
    result.processed += reconciliations.processed;
    result.matched += reconciliations.matched;
    result.details.push(...reconciliations.details);
    result.errors.push(...reconciliations.errors);

    console.log(
      `[Smart Settlement Worker] Cycle complete: ${result.matched}/${result.processed} matched, ${result.errors.length} errors (auth: ${auth.authorizedBy}, ref: ${auth.approvalReference})`
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
 * Match unmatched payments to their invoices — REQUIRES authorization + tenant scope.
 */
async function matchPaymentsToInvoices(auth: SettlementAuth): Promise<SettlementResult> {
  const result: SettlementResult = { processed: 0, matched: 0, errors: [], details: [] };

  // TENANT-SCOPED: Only process payments within authorized tenant
  const unmatchedPayments = await prisma.payment.findMany({
    where: {
      status: "PENDING",
      invoiceId: { not: null },
      deletedAt: null,
      tenantId: auth.tenantId, // TENANT SCOPING
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

      // TENANT VERIFICATION: Ensure invoice belongs to same tenant
      if (invoice.tenantId !== auth.tenantId) {
        result.errors.push(`Payment ${payment.paymentNumber}: cross-tenant access blocked`);
        continue;
      }

      const invoiceTotal = Number(invoice.total ?? 0);

      // AUDIT LOG: Before payment status change
      await prisma.auditLog.create({
        data: {
          entityName: "PAYMENT",
          entityId: payment.id,
          actionType: "UPDATE",
          actorId: auth.authorizedByUserId,
          actorRole: "ADMIN",
          tenantId: auth.tenantId,
          changes: {
            previousStatus: payment.status,
            newStatus: "PAID",
            paidAt: new Date().toISOString(),
            approvedBy: auth.authorizedBy,
            approvalReference: auth.approvalReference,
          },
        },
      });

      // AUTHORIZED MUTATION: payment.status → PAID
      await prisma.payment.update({
        where: { id: payment.id, tenantId: auth.tenantId }, // TENANT-SCOPED update
        data: { status: "PAID", paidAt: new Date() },
      });

      // Check if fully paid
      const existingPayments = await prisma.payment.aggregate({
        where: { invoiceId: invoice.id, status: "PAID", tenantId: auth.tenantId }, // TENANT-SCOPED
        _sum: { amount: true },
      });

      const totalPaid = Number(existingPayments._sum?.amount ?? 0);

      const newPaymentStatus = totalPaid >= invoiceTotal ? "PAID" : "PARTIALLY_PAID";

      // AUDIT LOG: Before invoice status change
      await prisma.auditLog.create({
        data: {
          entityName: "INVOICE",
          entityId: invoice.id,
          actionType: "UPDATE",
          actorId: auth.authorizedByUserId,
          actorRole: "ADMIN",
          tenantId: auth.tenantId,
          changes: {
            previousPaymentStatus: invoice.paymentStatus,
            newPaymentStatus: newPaymentStatus,
            paidDate: newPaymentStatus === "PAID" ? new Date().toISOString() : null,
            approvedBy: auth.authorizedBy,
            approvalReference: auth.approvalReference,
          },
        },
      });

      // AUTHORIZED MUTATION: invoice.paymentStatus → PAID/PARTIALLY_PAID
      await prisma.invoice.update({
        where: { id: invoice.id, tenantId: auth.tenantId }, // TENANT-SCOPED update
        data: { paymentStatus: newPaymentStatus, paidDate: newPaymentStatus === "PAID" ? new Date() : null },
      });

      result.details.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        action: totalPaid >= invoiceTotal ? "FULLY_PAID" : "PARTIALLY_PAID",
        amount: totalPaid,
        paymentId: payment.id,
        timestamp: new Date(),
      });

      result.matched++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      result.errors.push(`Payment ${payment.paymentNumber}: ${msg}`);
    }
  }

  return result;
}

/**
 * Process factoring settlements — REQUIRES authorization + tenant scope.
 */
async function processFactoringSettlements(auth: SettlementAuth): Promise<SettlementResult> {
  const result: SettlementResult = { processed: 0, matched: 0, errors: [], details: [] };

  // TENANT-SCOPED: Only process invoices within authorized tenant
  const factoredInvoices = await prisma.invoice.findMany({
    where: {
      factoringStatus: "PAID",
      paymentStatus: "PAID",
      deletedAt: null,
      tenantId: auth.tenantId, // TENANT SCOPING
      factoringRequests: { isNot: { status: "SETTLED" } },
    },
    take: 50,
  });

  for (const invoice of factoredInvoices) {
    try {
      result.processed++;

      const factoringRequest = await prisma.factoringRequest.findFirst({
        where: { invoiceId: invoice.id, tenantId: auth.tenantId }, // TENANT-SCOPED
        include: { factoringCompany: true },
      });

      if (!factoringRequest) {
        result.errors.push(`Invoice ${invoice.invoiceNumber}: no factoring request found`);
        continue;
      }

      const settlementAmount = Number(
        factoringRequest.disbursedAmount ?? factoringRequest.requestedAmount ?? 0
      );

      // AUDIT LOG: Before payment creation
      await prisma.auditLog.create({
        data: {
          entityName: "FACTORING_REQUEST",
          entityId: factoringRequest.id,
          actionType: "CREATE",
          actorId: auth.authorizedByUserId,
          actorRole: "ADMIN",
          tenantId: auth.tenantId,
          changes: {
            previousStatus: factoringRequest.status,
            newStatus: "SETTLED",
            settlementAmount: settlementAmount,
            approvedBy: auth.authorizedBy,
            approvalReference: auth.approvalReference,
          },
        },
      });

      // AUTHORIZED MUTATION: Create settlement payment
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

      // AUTHORIZED MUTATION: factoringRequest.status → SETTLED
      await prisma.factoringRequest.update({
        where: { id: factoringRequest.id, tenantId: auth.tenantId }, // TENANT-SCOPED
        data: { status: "SETTLED", settledAt: new Date() },
      });

      // AUTHORIZED MUTATION: Create credit transaction (audit trail)
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
 * Apply credit facility repayments — REQUIRES authorization + tenant scope.
 */
async function applyCreditRepayments(auth: SettlementAuth): Promise<SettlementResult> {
  const result: SettlementResult = { processed: 0, matched: 0, errors: [], details: [] };

  // TENANT-SCOPED: Only process facilities within authorized tenant
  const facilities = await prisma.creditFacility.findMany({
    where: { status: "ACTIVE", deletedAt: null, tenantId: auth.tenantId }, // TENANT SCOPING
    take: 50,
  });

  for (const facility of facilities) {
    try {
      const paidInvoices = await prisma.invoice.findMany({
        where: {
          hotelId: facility.hotelId,
          paymentStatus: "PAID",
          creditTransactions: { none: { type: "CREDIT_REPAY" } },
          tenantId: auth.tenantId, // TENANT SCOPING
        },
        take: 20,
      });

      for (const invoice of paidInvoices) {
        result.processed++;

        const invoiceTotal = Number(invoice.total ?? 0);

        // AUDIT LOG: Before credit facility repayment
        await prisma.auditLog.create({
          data: {
            entityName: "CREDIT_FACILITY",
            entityId: facility.id,
            actionType: "UPDATE",
            actorId: auth.authorizedByUserId,
            actorRole: "ADMIN",
            tenantId: auth.tenantId,
            changes: {
              operation: "decrement_utilized",
              amount: invoiceTotal,
              invoiceId: invoice.id,
              approvedBy: auth.authorizedBy,
              approvalReference: auth.approvalReference,
            },
          },
        });

        // AUTHORIZED MUTATION: Create credit transaction
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

        // AUTHORIZED MUTATION: Reduce facility utilized amount
        await prisma.creditFacility.update({
          where: { id: facility.id, tenantId: auth.tenantId }, // TENANT-SCOPED
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
            where: { invoiceId: invoice.id, type: "CREDIT_REPAY", tenantId: auth.tenantId },
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
 * Reconcile invoice payment statuses — REQUIRES authorization + tenant scope.
 */
async function reconcileInvoiceStatuses(auth: SettlementAuth): Promise<SettlementResult> {
  const result: SettlementResult = { processed: 0, matched: 0, errors: [], details: [] };

  // TENANT-SCOPED: Only reconcile invoices within authorized tenant
  const invoices = await prisma.invoice.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["DRAFT", "CREDIT_NOTE"] },
      tenantId: auth.tenantId, // TENANT SCOPING
    },
    take: 200,
  });

  for (const invoice of invoices) {
    try {
      result.processed++;

      const payments = await prisma.payment.aggregate({
        where: { invoiceId: invoice.id, status: "PAID", tenantId: auth.tenantId }, // TENANT-SCOPED
        _sum: { amount: true },
      });

      const totalPaid = Number(payments._sum?.amount ?? 0);
      const invoiceTotal = Number(invoice.total ?? 0);

      let newStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID" = "UNPAID";

      if (totalPaid === 0) {
        newStatus = "UNPAID";
      } else if (totalPaid >= invoiceTotal) {
        newStatus = "PAID";
      } else {
        newStatus = "PARTIALLY_PAID";
      }

      if (invoice.paymentStatus !== newStatus) {
        // AUDIT LOG: Before status reconciliation
        await prisma.auditLog.create({
          data: {
            entityName: "INVOICE",
            entityId: invoice.id,
            actionType: "UPDATE",
            actorId: auth.authorizedByUserId,
            actorRole: "ADMIN",
            tenantId: auth.tenantId,
            changes: {
              previousPaymentStatus: invoice.paymentStatus,
              newPaymentStatus: newStatus,
              totalPaid: totalPaid,
              invoiceTotal: invoiceTotal,
              approvedBy: auth.authorizedBy,
              approvalReference: auth.approvalReference,
            },
          },
        });

        // AUTHORIZED MUTATION: Reconcile invoice payment status
        await prisma.invoice.update({
          where: { id: invoice.id, tenantId: auth.tenantId }, // TENANT-SCOPED
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
 * Manual trigger for processing a specific invoice settlement — REQUIRES authorization.
 */
export async function processInvoiceSettlement(
  invoiceId: string,
  auth: SettlementAuth
): Promise<SettlementDetail | null> {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return null;

  // TENANT VERIFICATION
  if (invoice.tenantId !== auth.tenantId) {
    throw new Error("Cross-tenant access blocked");
  }

  const payments = await prisma.payment.aggregate({
    where: { invoiceId: invoice.id, status: "PAID", tenantId: auth.tenantId }, // TENANT-SCOPED
    _sum: { amount: true },
  });

  const totalPaid = Number(payments._sum?.amount ?? 0);
  const invoiceTotal = Number(invoice.total ?? 0);

  if (totalPaid >= invoiceTotal) {
    // AUDIT LOG
    await prisma.auditLog.create({
      data: {
        entityName: "INVOICE",
        entityId: invoice.id,
        actionType: "UPDATE",
        actorId: auth.authorizedByUserId,
        actorRole: "ADMIN",
        tenantId: auth.tenantId,
        changes: {
          previousPaymentStatus: invoice.paymentStatus,
          newPaymentStatus: "PAID",
          paidDate: new Date().toISOString(),
          approvedBy: auth.authorizedBy,
          approvalReference: auth.approvalReference,
          settlementType: "MANUAL",
        },
      },
    });

    // AUTHORIZED MUTATION
    await prisma.invoice.update({
      where: { id: invoice.id, tenantId: auth.tenantId },
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
