import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, success, error } from "@/lib/api-utils";
import { verifyFawryCallback } from "@/lib/payments/fawry";
import type { FawryCallbackPayload } from "@/lib/payments/fawry";
import { checkWebhookReplay, markWebhookProcessed, fawryEventId } from "@/lib/security/webhook-idempotency";
import { releaseCredit } from "@/lib/credit-gate";

export const dynamic = "force-dynamic";

export const POST = apiRoute(async (request: NextRequest) => {
  const body = await request.text();
  const payload = JSON.parse(body) as FawryCallbackPayload;

  // 0. Replay protection — reject duplicate webhook deliveries
  const eventId = fawryEventId(payload as unknown as Record<string, unknown>);
  const { isReplay } = await checkWebhookReplay("fawry", eventId);
  if (isReplay) {
    return success({ duplicate: true, message: "Webhook already processed" });
  }

  // 1. Verify HMAC signature
  if (!verifyFawryCallback(payload)) {
    return error("Invalid callback signature", 400);
  }

  const referenceNumber = payload.referenceNumber;
  const merchantRefNumber = payload.merchantRefNumber;
  const isPaid = payload.orderStatus === "PAID";

  // 2. Find the payment transaction by gateway reference
  const tx = await prisma.paymentTransaction.findFirst({
    where: { gatewayRef: referenceNumber },
    orderBy: { createdAt: "desc" },
  });

  if (!tx) {
    // Acknowledge webhook to stop retries, but log unmatched
    console.warn("[Fawry Callback] Unmatched reference:", referenceNumber);
    return success({ acknowledged: true, matched: false });
  }

  // 3. Update transaction status
  const newStatus = isPaid ? "CONFIRMED" : payload.orderStatus === "REFUNDED" ? "REVERSED" : "FAILED";

  await prisma.paymentTransaction.update({
    where: { id: tx.id },
    data: {
      status: newStatus,
      observedMethod: "PAYMOB_B2B", // closest mapped enum value
      metadata: JSON.stringify({
        merchantRefNumber,
        orderStatus: payload.orderStatus,
        paymentAmount: payload.paymentAmount,
        paymentMethod: payload.paymentMethod,
        fawryFees: payload.fawryFees,
        callbackAt: new Date().toISOString(),
      }),
    },
  });

  // 4. If confirmed, update linked Payment record and release credit
  if (isPaid) {
    const payment = await prisma.payment.findFirst({
      where: { referenceCode: merchantRefNumber },
    });
    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });
      // Release credit — payment received, free up hotel's credit limit
      await releaseCredit(payment.hotelId, Number(payment.amount ?? 0));
    }
  }

  // 5. Audit log (tamper-proof chain)
  const { appendAuditEntry } = await import("@/lib/audit/tamper-proof");
  await appendAuditEntry({
    tenantId: tx.tenantId,
    entityName: "INVOICE",
    entityId: tx.id,
    actionType: isPaid ? "UPDATE" : "UPDATE",
    actorId: "fawry",
    actorRole: "SYSTEM",
    changes: {
      referenceNumber,
      merchantRefNumber,
      orderStatus: payload.orderStatus,
      amount: payload.paymentAmount,
    },
  });

  // Mark webhook as processed (replay protection)
  await markWebhookProcessed("fawry", eventId, `${newStatus}:${tx.id}`);

  return success({ acknowledged: true, matched: true, status: newStatus });
});
