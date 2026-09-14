import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, success, error } from "@/lib/api-utils";
import { verifyInstaPayCallback } from "@/lib/payments/instapay";
import type { InstaPayCallbackPayload } from "@/lib/payments/instapay";
import { checkWebhookReplay, markWebhookProcessed } from "@/lib/security/webhook-idempotency";
import { releaseCredit } from "@/lib/credit-gate";

export const dynamic = "force-dynamic";

export const POST = apiRoute(async (request: NextRequest) => {
  const body = await request.text();
  const payload = JSON.parse(body) as InstaPayCallbackPayload;

  // Replay protection — reject duplicate webhook deliveries
  const { transactionId } = payload;
  const eventId = `${transactionId || Date.now()}`;
  const { isReplay } = await checkWebhookReplay("instapay", eventId);
  if (isReplay) {
    return success({ duplicate: true, message: "Webhook already processed" });
  }

  if (!verifyInstaPayCallback(payload)) {
    return error("Invalid callback signature", 400);
  }

  const { eventType, amount, status: callbackStatus } = payload;
  const isCompleted = eventType === "transfer.completed";
  const isFailed = eventType === "transfer.failed";

  const tx = await prisma.paymentTransaction.findFirst({
    where: { gatewayRef: transactionId },
  });

  if (!tx) {
    console.warn("[InstaPay Callback] Unmatched transaction:", transactionId);
    return success({ acknowledged: true, matched: false });
  }

  const newStatus = isCompleted ? "CONFIRMED" : isFailed ? "FAILED" : "PENDING";

  await prisma.paymentTransaction.update({
    where: { id: tx.id },
    data: {
      status: newStatus,
      metadata: JSON.stringify({
        eventType,
        callbackStatus,
        amount,
        transactionId,
        callbackAt: new Date().toISOString(),
      }),
    },
  });

  if (isCompleted) {
    const payment = await prisma.payment.findFirst({
      where: { referenceCode: tx.gatewayRef },
    });
    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", paidAt: new Date() },
      });
      // Release credit — payment received, free up hotel's credit limit
      await releaseCredit(payment.hotelId, Number(payment.amount ?? 0));
    }
  }

  const { appendAuditEntry: appendAuditEntryInstapay } = await import("@/lib/audit/tamper-proof");
  await appendAuditEntryInstapay({
    tenantId: tx.tenantId,
    entityName: "INVOICE",
    entityId: tx.id,
    actionType: isCompleted ? "UPDATE" : "UPDATE",
    actorId: "instapay",
    actorRole: "SYSTEM",
    changes: {
      transactionId,
      eventType,
      amount,
      status: newStatus,
    },
  });

  // Mark webhook as processed (replay protection)
  await markWebhookProcessed("instapay", eventId, `${newStatus}:${tx.id}`);

  return success({ acknowledged: true, matched: true, status: newStatus });
});
