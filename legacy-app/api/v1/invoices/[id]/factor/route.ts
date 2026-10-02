import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { inquireAll } from "@/lib/fintech/factoring-bridge";
import { validateForFactoring } from "@/lib/eta/validator";
import { assessRisk } from "@/lib/fintech/risk-engine";
import { calculateHubRevenue } from "@/lib/fintech/hub-revenue";
import { addFactoringJob } from "@/lib/factoring/queue";
import { apiRoute, authenticate, success, error, audit, requireIdempotencyKey, completeIdempotency, requirePermission } from "@/lib/api-utils";

export const POST = apiRoute(async (request: NextRequest, { params }: { params?: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "invoice:factor");
  const resolved = await params;
  if (!resolved) return error("Missing parameter", 400);
  const { id } = resolved;

  const record = await prisma.invoice.findUnique({ where: { id }, select: { tenantId: true } });
  if (!record || record.tenantId !== auth.tenantId) return error("Not found", 404);

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { hotel: true, supplier: true, order: true },
  });

  if (!invoice) return error("Invoice not found", 404);

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

  // Create factoring request record (queued for background processing)
  const factoringRequest = await prisma.factoringRequest.create({
    data: {
      tenantId: auth.tenantId,
      invoiceId: id,
      factoringCompanyId: bestOffer.partnerId,
      requestedAmount: invoice.total,
      status: "APPROVED",
      riskScore: risk.compositeScore,
      riskTier: risk.riskTier,
      advanceRate: bestOffer.maxAdvanceRate,
      discountRate: bestOffer.discountRate,
      platformFeeRate: hubRev.platformFeeRate,
      grossAmount: invoice.total,
      platformFee: hubRev.netPlatformFee,
      factoringFee: hubRev.factoringFee,
    },
  });

  // Queue funding execution
  const job = await addFactoringJob({
    factoringRequestId: factoringRequest.id,
    tenantId: auth.tenantId,
    userId: auth.userId,
    action: "FUND",
  });

  // Update invoice
  await prisma.invoice.update({
    where: { id },
    data: {
      factoringStatus: "ACCEPTED",
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
      jobId: job.id,
      platformFee: hubRev.platformFee,
      factoringFee: hubRev.factoringFee,
    },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  completeIdempotency(idempotencyKey, id);

  return success({
    message: "Factoring queued for disbursement",
    factoringRequestId: factoringRequest.id,
    jobId: job.id,
    hubRevenue: hubRev,
    offers: allOffers,
  });
}, { rateLimit: "financial" });
