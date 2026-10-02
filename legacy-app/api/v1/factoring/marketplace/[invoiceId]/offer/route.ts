/**
 * Factoring Marketplace — Submit an offer on an invoice
 *
 * POST: A factoring company submits a bid on an invoice
 *   Body: { advanceRate, discountRate, terms }
 *   Creates a FactoringRequest with platform referral fee (0.5% of invoice value)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiRoute,
  authenticate,
  success,
  error,
  audit,
  requirePermission,
  tenantWhereClause,
} from "@/lib/api-utils";
import { z } from "zod";

const OfferSchema = z.object({
  advanceRate: z.number().min(0.5).max(0.95),
  discountRate: z.number().min(0.005).max(0.15),
  terms: z.string().min(1).max(500).optional(),
});

export const POST = apiRoute(async (request: NextRequest, ctx: { params: Promise<{ invoiceId: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "factoring:inquire");

  const { invoiceId } = await ctx.params;
  const body = await request.json();
  const data = OfferSchema.parse(body);

  // Verify caller is a factoring company user
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { factoringCompanyId: true },
  });

  if (!user?.factoringCompanyId) {
    return error("Only factoring company users can submit offers", 403);
  }

  // Fetch the target invoice
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      invoiceNumber: true,
      total: true,
      currency: true,
      factoringStatus: true,
      tenantId: true,
      etaUuid: true,
      etaStatus: true,
      hotel: { select: { id: true, name: true, taxId: true, tier: true } },
      supplier: { select: { id: true, name: true, taxId: true } },
    },
  });

  if (!invoice) {
    return error("Invoice not found", 404);
  }

  // Tenant isolation check
  if (invoice.tenantId !== auth.tenantId) {
    return error("Forbidden", 403);
  }

  if (invoice.factoringStatus !== "AVAILABLE") {
    return error(
      `Invoice is not available for factoring. Current status: ${invoice.factoringStatus}`,
      422
    );
  }

  // Platform referral fee: 0.5% of invoice value
  const PLATFORM_REFERRAL_RATE = 0.005;
  const platformFee = Number(invoice.total || 0) * PLATFORM_REFERRAL_RATE;

  // Check if an offer already exists from this company for this invoice
  const existingRequest = await prisma.factoringRequest.findFirst({
    where: {
      invoiceId: invoice.id,
      factoringCompanyId: user.factoringCompanyId,
      ...tenantWhereClause(auth.tenantId),
      status: { in: ["PENDING", "UNDER_REVIEW"] },
    },
  });

  let factoringRequest;

  if (existingRequest) {
    // Update existing offer with new terms
    factoringRequest = await prisma.factoringRequest.update({
      where: { id: existingRequest.id },
      data: {
        advanceRate: data.advanceRate,
        discountRate: data.discountRate,
        platformFee,
        platformFeeRate: PLATFORM_REFERRAL_RATE,
        requestedAmount: invoice.total,
        grossAmount: invoice.total,
        factoringFee: Number(invoice.total || 0) * data.discountRate,
        status: "UNDER_REVIEW",
      },
    });
  } else {
    // Create new factoring request
    factoringRequest = await prisma.factoringRequest.create({
      data: {
        tenantId: auth.tenantId,
        invoiceId: invoice.id,
        factoringCompanyId: user.factoringCompanyId,
        requestedAmount: invoice.total,
        grossAmount: invoice.total,
        advanceRate: data.advanceRate,
        discountRate: data.discountRate,
        factoringFee: Number(invoice.total || 0) * data.discountRate,
        platformFee,
        platformFeeRate: PLATFORM_REFERRAL_RATE,
        status: "UNDER_REVIEW",
        partnerResponse: data.terms
          ? JSON.stringify({ terms: data.terms })
          : undefined,
      },
    });
  }

  // Update invoice factoring status to OFFERED
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { factoringStatus: "OFFERED" },
  });

  // Audit log
  await audit({
    entityType: "FactoringRequest",
    entityId: factoringRequest.id,
    action: existingRequest ? "FACTORING_OFFER_UPDATED" : "FACTORING_OFFER_SUBMITTED",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceTotal: invoice.total,
      advanceRate: data.advanceRate,
      discountRate: data.discountRate,
      platformFee,
      platformFeeRate: PLATFORM_REFERRAL_RATE,
    },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  return success({
    factoringRequestId: factoringRequest.id,
    invoiceId: invoice.id,
    invoiceTotal: invoice.total,
    advanceRate: data.advanceRate,
    discountRate: data.discountRate,
    supplierReceives: Number(invoice.total || 0) * data.advanceRate - Number(invoice.total || 0) * data.discountRate,
    platformFee,
    platformFeeRate: PLATFORM_REFERRAL_RATE,
  });
}, { rateLimit: "financial" });
