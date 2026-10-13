import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error, requirePermission } from "@/lib/api-utils";
import { z } from "zod";

const CashOutRequestSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().min(0).optional(),
  partnerId: z.string().min(1).optional(),
  reason: z.string().max(500).optional(),
});

/**
 * Request early 48h cash-out for an approved/delivered order.
 * Creates a FactoringRequest linked to the order's paid invoice.
 */
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "fintech:write");

  const body = await request.json();
  const data = CashOutRequestSchema.parse(body);

  // Find the order and its paid invoice
  const order = await prisma.order.findFirst({
    where: { id: data.orderId, tenantId: auth.tenantId, paymentGuaranteed: true },
    include: {
      invoices: {
        where: { paymentStatus: "PAID" },
        take: 1,
        orderBy: { paidDate: "desc" },
      },
    },
  });

  if (!order) return error("Order not found or not eligible for cash-out", 404);
  if (order.invoices.length === 0) return error("No paid invoice found for this order", 404);

  // Check for existing pending factoring request on this invoice
  const existingRequest = await prisma.factoringRequest.findFirst({
    where: {
      tenantId: auth.tenantId,
      invoiceId: order.invoices[0].id,
      status: { notIn: ["SETTLED", "REJECTED"] },
    },
  });

  if (existingRequest) {
    return error("Cash-out request already pending for this order", 409);
  }

  const targetInvoice = order.invoices[0];
  const partnerId = data.partnerId ?? "DEFAULT";
  const requestedAmount = data.amount ?? Number(order.total ?? 0);

  const factoringRequest = await prisma.factoringRequest.create({
    data: {
      tenantId: auth.tenantId,
      invoiceId: targetInvoice.id,
      factoringCompanyId: partnerId,
      requestedAmount,
      status: "PENDING",
      isNonRecourse: true,
      requestedAt: new Date(),
    },
  });

  return success({
    factoringRequestId: factoringRequest.id,
    orderId: order.id,
    invoiceId: factoringRequest.invoiceId,
    requestedAmount,
    status: "PENDING",
    message: "Cash-out request submitted. Partner will review and fund within the agreed term.",
  });
});
