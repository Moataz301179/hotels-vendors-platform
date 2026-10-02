/**
 * Factoring Disbursement Handler
 *
 * Submits a factoring instruction to a licensed partner and atomically
 * increments the CreditFacility.utilized amount to enforce credit limits.
 *
 * ⚠️  Hotels Vendors does NOT transfer funds.
 * This endpoint sends invoice data to the factoring partner.
 * The partner pays the supplier directly and collects from the hotel later.
 *
 * Hotels Vendors earns a referral fee from the partner (invoiced off-chain).
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { submitFactoringInstruction } from "@/lib/fintech/factoring-bridge";
import {
  apiRoute,
  authenticate,
  success,
  error,
  audit,
  requireIdempotencyKey,
  completeIdempotency,
  requirePermission,
} from "@/lib/api-utils";
import { z } from "zod";

const FundSchema = z.object({
  invoiceId: z.string().cuid(),
  partnerId: z.string().min(1),
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "factoring:fund");
  const body = await request.json();
  const data = FundSchema.parse(body);

  // Fetch invoice with hotel and supplier details
  const invoice = await prisma.invoice.findUnique({
    where: { id: data.invoiceId },
    include: { hotel: true, supplier: true, order: true },
  });

  if (!invoice) {
    return error("Invoice not found", 404);
  }

  // Verify the user's entity matches the invoice (tenant isolation)
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { hotelId: true, supplierId: true },
  });
  if (auth.platformRole === "HOTEL" && invoice.hotelId !== user?.hotelId) {
    return error("Forbidden", 403);
  }
  if (auth.platformRole === "SUPPLIER" && invoice.supplierId !== user?.supplierId) {
    return error("Forbidden", 403);
  }

  // Idempotency — prevent duplicate factoring submissions
  const idempotencyKey = await requireIdempotencyKey(request, {
    userId: auth.userId,
    action: "FACTORING_INSTRUCTION",
    amount: Number(invoice.total || 0),
  });

  // ── CREDIT FACILITY CHECK ──────────────────────────────────
  // Find the active credit facility for this hotel + factoring partner
  const facility = await prisma.creditFacility.findFirst({
    where: {
      hotelId: invoice.hotelId,
      factoringCompanyId: data.partnerId,
      status: "ACTIVE",
    },
  });

  if (!facility) {
    return error(
      "No active credit facility found for this hotel and factoring partner. " +
      "The hotel must have an approved credit line before factoring.",
      422
    );
  }

  // Check available credit before submitting to partner
  const availableCredit = Number(facility.limit || 0) - Number(facility.utilized || 0);
  if (availableCredit < Number(invoice.total || 0)) {
    return error(
      `Insufficient credit line. Available: EGP ${availableCredit.toLocaleString()}, ` +
      `Required: EGP ${Number(invoice.total || 0).toLocaleString()}. ` +
      `The hotel may request a limit increase from the factoring partner.`,
      422
    );
  }

  // ── PREPARE & SUBMIT TO PARTNER ────────────────────────────
  const invoiceData = {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    etaUuid: invoice.etaUuid || "",
    grossAmount: Number(invoice.total || 0),
    currency: invoice.currency,
    supplier: {
      name: invoice.supplier.name,
      taxId: invoice.supplier.taxId,
      bankAccount: invoice.supplier.bankAccount || "",
      bankName: invoice.supplier.bankName || "",
    },
    hotel: {
      name: invoice.hotel.name,
      taxId: invoice.hotel.taxId,
    },
    orderId: invoice.orderId,
    deliveryConfirmedAt: invoice.order?.createdAt?.toISOString() || new Date().toISOString(),
  };

  const result = await submitFactoringInstruction(data.partnerId, invoiceData);

  if (!result.success) {
    return error(result.error || "Partner rejected the instruction", 502);
  }

  // ── ATOMIC TRANSACTION: Invoice update + CreditFacility increment ──
  // If the server crashes mid-way, the entire transaction rolls back —
  // the invoice stays unfactored and the credit facility is not consumed.
  let factoringRequest;
  try {
    const txResult = await prisma.$transaction(async (tx) => {
      // Update invoice status
      await tx.invoice.update({
        where: { id: data.invoiceId },
        data: {
          factoringStatus: "ACCEPTED",
          factoringCompanyId: data.partnerId,
          paymentStatus: "FACTORED",
        },
      });

      // Atomically increment the credit facility utilized amount
      const updatedFacility = await tx.creditFacility.update({
        where: { id: facility.id },
        data: {
          utilized: { increment: Number(invoice.total || 0) },
        },
      });

      // Guard: if increment pushed utilized over limit, throw to roll back
      if (Number(updatedFacility.utilized || 0) > Number(updatedFacility.limit || 0)) {
        throw new Error(
          `Credit facility limit exceeded after increment. ` +
          `Limit: EGP ${Number(updatedFacility.limit || 0).toLocaleString()}, ` +
          `Would be utilized: EGP ${Number(updatedFacility.utilized || 0).toLocaleString()}. ` +
          `Transaction rolled back.`
        );
      }

      // Create factoring request record (tracking only — no cash handled)
      const fr = await tx.factoringRequest.create({
        data: {
          tenantId: auth.tenantId,
          invoiceId: data.invoiceId,
          factoringCompanyId: data.partnerId,
          requestedAmount: invoice.total,
          status: "DISBURSED",
          disbursedAt: new Date(),
          partnerResponse: JSON.stringify({
            instructionId: result.instructionId,
            partnerFundingId: result.partnerFundingId,
            estimatedDisbursementDate: result.estimatedDisbursementDate,
            note: "Funds disbursed directly by partner to supplier",
          }),
        },
      });

      return { factoringRequest: fr, updatedFacility };
    }, {
      maxWait: 5000,
      timeout: 10000,
    });

    factoringRequest = txResult.factoringRequest;
  } catch (txErr) {
    const message = txErr instanceof Error ? txErr.message : "Transaction failed";
    return error(`Factoring failed: ${message}`, 500);
  }

  // ── AUDIT LOG ──────────────────────────────────────────────
  await audit({
    entityType: "INVOICE",
    entityId: data.invoiceId,
    action: "FACTORING_INSTRUCTION_SUBMITTED",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: {
      partnerId: data.partnerId,
      instructionId: result.instructionId,
      partnerFundingId: result.partnerFundingId,
      factoringRequestId: factoringRequest.id,
          creditFacilityUtilized: Number(facility.utilized || 0) + Number(invoice.total || 0),
          creditFacilityLimit: Number(facility.limit || 0),
      note: "Partner handles all fund transfers. Platform does not hold cash.",
    },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  completeIdempotency(idempotencyKey, data.invoiceId);

  return success({
    instructionId: result.instructionId,
    partnerFundingId: result.partnerFundingId,
    estimatedDisbursementDate: result.estimatedDisbursementDate,
    factoringRequestId: factoringRequest.id,
  });
}, { rateLimit: "financial" });
