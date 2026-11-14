/**
 * Meta Cloud API WhatsApp webhook.
 *
 * GET  — hub.challenge verification (WHATSAPP_VERIFY_TOKEN)
 * POST — signed inbound events (WHATSAPP_APP_SECRET via X-Hub-Signature-256)
 *
 * Public by design (see proxy.ts PUBLIC_PREFIXES /api/webhooks). Auth is the
 * Meta verify token + HMAC signature — not Clerk.
 */

import { NextResponse } from "next/server";
import {
  extractMetaInboundMessages,
  handleInboundWhatsAppMessage,
} from "@/lib/notifications/whatsapp-inbound";
import { verifyMetaSignature, verifyMetaWebhookChallenge } from "@/lib/notifications/whatsapp";
import { checkWebhookReplay, markWebhookProcessed } from "@/lib/security/webhook-idempotency";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const challenge = verifyMetaWebhookChallenge({
    mode: url.searchParams.get("hub.mode"),
    token: url.searchParams.get("hub.verify_token"),
    challenge: url.searchParams.get("hub.challenge"),
  });

  if (!process.env.WHATSAPP_VERIFY_TOKEN) {
    return NextResponse.json({ error: "WHATSAPP_WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
  }
  if (challenge === null) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  return new NextResponse(challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(request: Request) {
  if (!process.env.WHATSAPP_APP_SECRET) {
    return NextResponse.json({ error: "WHATSAPP_WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  if (!verifyMetaSignature(rawBody, signature)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const messages = extractMetaInboundMessages(payload);
  let processed = 0;
  let replayed = 0;
  let failed = 0;

  for (const message of messages) {
    const replay = await checkWebhookReplay("whatsapp", message.messageId);
    if (replay.isReplay) {
      replayed += 1;
      continue;
    }

    try {
      const result = await handleInboundWhatsAppMessage(message);
      // Mark complete only after successful handling so Meta can retry failures
      // (e.g. STOP preference writes) without being permanently acknowledged.
      await markWebhookProcessed(
        "whatsapp",
        message.messageId,
        `HANDLED:${result.command}:${result.linked ? "linked" : "unlinked"}`,
      );
      processed += 1;
    } catch (error) {
      console.error("[WhatsApp] inbound handler failed", error);
      failed += 1;
    }
  }

  // Signed payloads that fail processing must not be acknowledged — Meta
  // retries on non-2xx. Already-processed message ids stay idempotent.
  if (failed > 0) {
    return NextResponse.json(
      { received: true, processed, replayed, failed, retryable: true },
      { status: 503 },
    );
  }

  return NextResponse.json({ received: true, processed, replayed });
}
