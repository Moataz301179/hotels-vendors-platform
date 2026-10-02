import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { inquireAll } from "@/lib/fintech/factoring-bridge";
import { assessRisk } from "@/lib/fintech/risk-engine";
import { validateForFactoring } from "@/lib/eta/validator";
import { apiRoute, authenticate, success, error, audit, requirePermission } from "@/lib/api-utils";
import { z } from "zod";

const InquireSchema = z.object({
  invoiceId: z.string().cuid(),
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "factoring:inquire");
  const body = await request.json();
  const data = InquireSchema.parse(body);

  const invoice = await prisma.invoice.findUnique({
    where: { id: data.invoiceId },
    include: { hotel: true, supplier: true },
  });

  if (!invoice) {
    return error("Invoice not found", 404);
  }

  // Verify the user's entity matches the invoice
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

  const etaValid = await validateForFactoring(data.invoiceId);
  if (!etaValid.valid) {
    return error(`Factoring blocked: ${etaValid.message}`, 422);
  }

  const risk = await assessRisk(invoice.hotelId, auth.tenantId);

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

  await audit({
    entityType: "INVOICE",
    entityId: data.invoiceId,
    action: "FACTORING_INQUIRY",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: { bestOffer: bestOffer?.partnerId, offerCount: allOffers.length },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  return success({ bestOffer, allOffers, riskAssessment: risk });
});
