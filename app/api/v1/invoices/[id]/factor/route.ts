import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { inquireAll } from "@/lib/fintech/factoring-bridge";
import { validateForFactoring } from "@/lib/eta/validator";
import { assessRisk } from "@/lib/fintech/risk-engine";
import { calculateHubRevenue } from "@/lib/fintech/hub-revenue";
import { apiRoute, authenticate, success, error, audit, requireIdempotencyKey, completeIdempotency, requirePermission } from "@/lib/api-utils";

export const POST = apiRoute(async (request: NextRequest, { params }: { params?: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "invoice:factor");
  const resolved = await params;
  if (!resolved?.id) return error("Missing parameter", 400);
  const { id } = resolved;

  const invoice = await prisma.invoice.findFirst({
    where: { id, tenantId: auth.tenantId, deletedAt: null, order: { tenantId: auth.tenantId, deletedAt: null } },
    include: {
      hotel: true,
      supplier: true,
      order: {
        include: {
          tripStops: {
            where: { tenantId: auth.tenantId, deletedAt: null },
            select: { deliveryProofs: { select: { id: true }, take: 1 } },
          },
          goodsReceiptNotes: {
            where: { tenantId: auth.tenantId, deletedAt: null },
            select: { status: true },
          },
        },
      },
    },
  });

  if (!invoice) return error("Invoice not found", 404);
  if (invoice.order.status !== "DELIVERED") return error("Factoring requires a fully delivered order", 409);
  if (!invoice.order.paymentGuaranteed) return error("Factoring requires a payment-guaranteed order", 409);
  if (!invoice.order.tripStops.some((stop) => stop.deliveryProofs.length > 0)) return error("Factoring requires carrier proof of delivery", 409);
  if (!invoice.order.goodsReceiptNotes.some((grn) => grn.status === "ACCEPTED" || grn.status === "PARTIALLY_ACCEPTED")) {
    return error("Factoring requires a hotel goods receipt", 409);
  }

  const idempotencyKey = await requireIdempotencyKey(request, { userId: auth.userId, action: "INVOICE_FACTOR", amount: Number(invoice.total ?? 0) });

  // Validate ETA compliance
  const etaValid = await validateForFactoring(id);
  if (!etaValid.valid) {
    return error(`Factoring blocked: ${etaValid.message}`, 422);
  }

  // Assess risk
  const risk = await assessRisk(invoice.hotelId, auth.tenantId);

  // Inquire partners
  const { bestOffer, allOffers } = await inquireAll({
    hotelTaxId: invoice.hotel.taxId,
    hotelName: invoice.hotel.name,
    hotelRiskScore: risk.compositeScore,
    hotelRiskTier: risk.riskTier,
    invoiceAmount: Number(invoice.total ?? 0),
    invoiceCurrency: "EGP",
    invoiceDueDate: invoice.dueDate || new Date(),
    etaUuid: invoice.etaUuid || "",
  });

  if (!bestOffer || !bestOffer.partnerId) {
    return error("No factoring partner eligible for this invoice", 422);
  }

  // Calculate hub revenue
  const hubRev = await calculateHubRevenue({
    invoiceId: id,
    partnerDiscountRate: bestOffer.discountRate,
    advanceRate: bestOffer.maxAdvanceRate,
  });

  const existingRequest = await prisma.factoringRequest.findFirst({
    where: { invoiceId: id, tenantId: auth.tenantId, deletedAt: null },
    select: { id: true, status: true },
  });
  if (existingRequest) return error("Factoring eligibility has already been requested for this invoice", 409);

  // Create an eligibility request. Funding remains a separate, explicitly
  // approved step after the partner offer is accepted.
  const factoringRequest = await prisma.factoringRequest.create({
    data: {
      tenantId: auth.tenantId,
      invoiceId: id,
      factoringCompanyId: bestOffer.partnerId,
      requestedAmount: invoice.total,
      status: "UNDER_REVIEW",
      riskScore: risk.compositeScore,
      riskTier: risk.riskTier,
      advanceRate: bestOffer.maxAdvanceRate,
      discountRate: bestOffer.discountRate,
      platformFeeRate: hubRev.platformFeeRate,
      grossAmount: invoice.total,
      platformFee: hubRev.netPlatformFee,
      factoringFee: hubRev.factoringFee,
      partnerResponse: JSON.stringify({ offers: allOffers, selectedPartnerId: bestOffer.partnerId }),
    },
  });

  // Mark that an offer is available, never as funded or accepted.
  await prisma.invoice.update({
    where: { id },
    data: {
      factoringStatus: "OFFERED",
      factoringCompanyId: bestOffer.partnerId,
    },
  });

  await audit({
    entityType: "INVOICE",
    entityId: id,
    action: "FACTORING_QUEUED",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: {
      partnerId: bestOffer.partnerId,
      factoringRequestId: factoringRequest.id,
      platformFee: hubRev.platformFee,
      factoringFee: hubRev.factoringFee,
    },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  await completeIdempotency(idempotencyKey, id);

  return success({
    message: "Factoring eligibility offer prepared; partner approval is required before funding",
    factoringRequestId: factoringRequest.id,
    hubRevenue: hubRev,
    offers: allOffers,
  });
}, { rateLimit: "financial" });
