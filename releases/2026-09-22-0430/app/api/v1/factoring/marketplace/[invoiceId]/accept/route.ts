/**
 * Factoring Marketplace — Accept a factoring offer
 *
 * POST: Supplier accepts the best offer on their invoice
 *   Updates FactoringRequest → ACCEPTED
 *   Updates Invoice.factoringStatus → ACCEPTED
 *   Simulates disbursement trigger
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiRoute,
  authenticate,
  success,
  error,
  audit,
  requireIdempotencyKey,
  completeIdempotency,
  requirePermission,
  tenantWhereClause,
} from "@/lib/api-utils";
import { z } from "zod";

const AcceptSchema = z.object({
  factoringRequestId: z.string().cuid(),
});

export const POST = apiRoute(async (request: NextRequest, ctx: { params: Promise<{ invoiceId: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "factoring:inquire");

  const { invoiceId } = await ctx.params;
  const body = await request.json();
  const data = AcceptSchema.parse(body);

  // Verify caller is the supplier who owns the invoice
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { supplierId: true },
  });

  if (!user?.supplierId) {
    return error("Only supplier users can accept factoring offers", 403);
  }

  // Fetch the invoice
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      invoiceNumber: true,
      total: true,
      currency: true,
      factoringStatus: true,
      supplierId: true,
      tenantId: true,
    },
  });

  if (!invoice) {
    return error("Invoice not found", 404);
  }

  if (invoice.tenantId !== auth.tenantId) {
    return error("Forbidden", 403);
  }

  if (invoice.supplierId !== user.supplierId) {
    return error("You can only accept offers on your own invoices", 403);
  }

  if (invoice.factoringStatus !== "OFFERED") {
    return error(
      `Invoice is not in offer stage. Current status: ${invoice.factoringStatus}`,
      422
    );
  }

  // Idempotency — prevent double-accept
  const idempotencyKey = await requireIdempotencyKey(request, {
    userId: auth.userId,
    action: "FACTORING_ACCEPT",
    amount: Number(invoice.total || 0),
  });

  // Fetch the factoring request being accepted
  const factoringRequest = await prisma.factoringRequest.findFirst({
    where: {
      id: data.factoringRequestId,
      invoiceId: invoice.id,
      ...tenantWhereClause(auth.tenantId),
      status: { in: ["UNDER_REVIEW", "APPROVED"] },
    },
    include: { factoringCompany: { select: { id: true, name: true } } },
  });

  if (!factoringRequest) {
    return error("Factoring offer not found or not in accepted state", 404);
  }

  // Reject all other offers on this invoice, accept this one
  const result = await prisma.$transaction(async (tx) => {
    // Reject other pending offers
    await tx.factoringRequest.updateMany({
      where: {
        invoiceId: invoice.id,
        id: { not: factoringRequest.id },
        status: { in: ["PENDING", "UNDER_REVIEW"] },
      },
      data: { status: "REJECTED" },
    });

    // Accept the chosen offer
    const updatedRequest = await tx.factoringRequest.update({
      where: { id: factoringRequest.id },
      data: {
        status: "APPROVED",
        grossAmount: Number(invoice.total || 0),
        factoringFee: Number(invoice.total || 0) * Number(factoringRequest.discountRate || 0),
        disbursedAmount: Number(invoice.total || 0) * Number(factoringRequest.advanceRate || 0) - Number(invoice.total || 0) * Number(factoringRequest.discountRate || 0),
      },
    });

    // Update invoice
    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        factoringStatus: "ACCEPTED",
        factoringCompanyId: factoringRequest.factoringCompanyId,
        acceleratedCashRate: Number(factoringRequest.advanceRate || 0),
        supplierDiscountRate: Number(factoringRequest.discountRate || 0),
        platformFee: factoringRequest.platformFee ?? 0,
        platformFeeRate: factoringRequest.platformFeeRate ?? 0.005,
      },
    });

    return updatedRequest;
  }, {
    maxWait: 5000,
    timeout: 10000,
  });

  // Audit log
  await audit({
    entityType: "Invoice",
    entityId: invoice.id,
    action: "FACTORING_OFFER_ACCEPTED",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: {
      factoringRequestId: result.id,
      factoringCompanyId: factoringRequest.factoringCompanyId,
      factoringCompanyName: factoringRequest.factoringCompany.name,
      advanceRate: factoringRequest.advanceRate,
      discountRate: factoringRequest.discountRate,
      platformFee: factoringRequest.platformFee,
      grossAmount: result.grossAmount,
      factoringFee: result.factoringFee,
      disbursedAmount: result.disbursedAmount,
      note: "Disbursement triggered via partner adapter. Platform does not hold cash.",
    },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  completeIdempotency(idempotencyKey, invoice.id);

  return success({
    factoringRequestId: result.id,
    invoiceId: invoice.id,
    invoiceTotal: invoice.total,
    factoringCompanyName: factoringRequest.factoringCompany.name,
    advanceRate: factoringRequest.advanceRate,
    discountRate: factoringRequest.discountRate,
    supplierReceives: result.disbursedAmount,
    platformFee: factoringRequest.platformFee,
    status: "ACCEPTED",
    nextStep: "Disbursement will be initiated via the factoring partner within 24-48 hours",
  });
}, { rateLimit: "financial" });
