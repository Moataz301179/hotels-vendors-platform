import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDepositPayment } from "@/lib/payments/paymob";
import { apiRoute, authenticate, validateBody, success, error, requirePermission } from "@/lib/api-utils";
import { z } from "zod";

const DepositSchema = z.object({
  orderId: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  customerFirstName: z.string().min(1),
  customerLastName: z.string().min(1),
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "order:read");
  const body = await request.json();
  const data = validateBody(DepositSchema, body);

  const record = await prisma.order.findUnique({ where: { id: data.orderId }, select: { tenantId: true } });
  if (!record || record.tenantId !== auth.tenantId) return error("Not found", 404);

  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: { hotel: true },
  });

  if (!order) return error("Order not found", 404);
  if (order.paymentGuaranteed) return error("Deposit already paid", 400);
  if (order.paymentGuaranteeMethod?.startsWith("DEPOSIT_PAYMOB")) return error("Deposit already pending", 409);

  const depositAmount = Math.round(Number(order.total || 0) * 0.2 * 100); // 20% in cents

  const { paymentUrl, paymobOrderId } = await createDepositPayment({
    orderId: order.id,
    amountCents: depositAmount,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    customerFirstName: data.customerFirstName,
    customerLastName: data.customerLastName,
  });

  // Store Paymob order ID for callback matching
  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentGuaranteeMethod: `DEPOSIT_PAYMOB:${paymobOrderId}`,
      paymentGuaranteeSetAt: new Date(),
    },
  });

  return success({
    paymentUrl,
    paymobOrderId,
    depositAmount: depositAmount / 100,
    currency: order.currency,
  });
}, { rateLimit: "financial" });
