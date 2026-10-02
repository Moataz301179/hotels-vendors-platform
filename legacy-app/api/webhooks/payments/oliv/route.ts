import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, error, success, audit } from "@/lib/api-utils";
import { handleOlivWebhook } from "@/lib/payments/oliv/index";
import { isWebhookIpAllowed, getClientIp } from "@/lib/security/webhook-whitelist";

/**
 * Oliv Webhook Receiver — Phase 2 Placeholder
 *
 * This endpoint will receive payment confirmation webhooks from Oliv
 * once Phase 2 (embedded payment) is implemented.
 *
 * Phase 1 (current): No webhooks — referral redirect only.
 * Phase 2 (planned): Oliv sends payment status updates here.
 */

export const POST = apiRoute(async (request: NextRequest) => {
  // IP whitelisting — reject webhooks from untrusted sources
  const clientIp = getClientIp(request);
  if (!isWebhookIpAllowed(clientIp, "oliv")) {
    return error("Forbidden: untrusted webhook source", 403);
  }

  const body = await request.json();

  // Phase 2: Verify Oliv webhook signature
  // const signature = request.headers.get("x-oliv-signature");
  // if (!verifyOlivSignature(body, signature)) {
  //   return error("Invalid webhook signature", 401);
  // }

  const { type, orderId, status, amount } = body;

  // Log webhook for audit (external webhooks have no tenant context)
  await audit({
    entityType: "WEBHOOK",
    entityId: orderId || "unknown",
    action: `OLIV_${type?.toUpperCase() || "UNKNOWN"}`,
    tenantId: "system",
    afterState: body,
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  // Phase 2: Handle different event types
  switch (type) {
    case "payment.confirmed":
      // Update order payment status
      // Unlock order for next status transition
      break;
    case "payment.failed":
      // Log failure, notify supplier
      break;
    case "payment.refunded":
      // Handle refund flow
      break;
    default:
      console.log("[Oliv Webhook] Unhandled event type:", type);
  }

  return success({ received: true });
});
