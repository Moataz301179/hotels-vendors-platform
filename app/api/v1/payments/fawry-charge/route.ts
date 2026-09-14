import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createFawryCharge } from "@/lib/payments/fawry";
import { apiRoute, authenticate, validateBody, success, error, requirePermission, audit } from "@/lib/api-utils";
import { z } from "zod";

const FawryChargeSchema = z.object({
  orderId: z.string(),
  customerEmail: z.string().email(),
  customerMobile: z.string(),
  customerName: z.string(),
  amount: z.number().positive(),
  description: z.string().optional(),
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "order:read");
  const body = await request.json();
  const data = validateBody(FawryChargeSchema, body);

  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    select: { tenantId: true, paymentGuaranteed: true, paymentGuaranteeMethod: true },
  });

  if (!order || order.tenantId !== auth.tenantId) return error("Not found", 404);
  if (order.paymentGuaranteed) return error("Deposit already paid", 400);
  if (order.paymentGuaranteeMethod?.startsWith("FAWRY")) return error("Deposit already pending", 409);

  const charge = await createFawryCharge({
    merchantRefNum: data.orderId,
    customerProfileId: auth.userId,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerMobile: data.customerMobile,
    paymentMethod: "PayAtFawry",
    amount: data.amount,
    currencyCode: "EGP",
    description: data.description || "Deposit payment for order",
    chargeItems: [
      {
        itemId: data.orderId,
        description: "Order deposit",
        price: data.amount,
        quantity: 1,
      },
    ],
  });

  await prisma.paymentTransaction.create({
    data: {
      id: `FAWRY-${charge.referenceNumber}`,
      gatewayRef: charge.referenceNumber,
      transactionType: "FAWRY_CHARGE",
      amount: charge.paymentAmount,
      currency: "EGP",
      status: "PENDING",
      observedMethod: "FAWRY_B2B",
      metadata: JSON.stringify({
        merchantRefNum: data.orderId,
        expirationTime: charge.expirationTime,
        fawryFees: charge.fawryFees,
        statusCode: charge.statusCode,
        statusDescription: charge.statusDescription,
      }),
      tenantId: auth.tenantId,
      updatedAt: new Date(),
    },
  });

  await prisma.order.update({
    where: { id: data.orderId },
    data: {
      paymentGuaranteeMethod: `FAWRY:${charge.referenceNumber}`,
      paymentGuaranteeSetAt: new Date(),
    },
  });

  await audit({
    entityType: "Order",
    entityId: data.orderId,
    action: "FAWRY_CHARGE_CREATED",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    afterState: {
      referenceNumber: charge.referenceNumber,
      amount: charge.paymentAmount,
      expirationTime: charge.expirationTime,
    },
  });

  return success({
    referenceNumber: charge.referenceNumber,
    paymentAmount: charge.paymentAmount,
    expirationTime: charge.expirationTime,
  });
}, { rateLimit: "financial" });
