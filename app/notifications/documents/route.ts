import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { processCallback } from "@/lib/eta/client";
import { checkWebhookReplay, markWebhookProcessed } from "@/lib/security/webhook-idempotency";

export const runtime = "nodejs";

type EtaDocumentNotification = {
  type?: unknown;
  uuid?: unknown;
  status?: unknown;
  dateTimeValidated?: unknown;
  rejectionReasons?: unknown;
};

type EtaNotificationEnvelope = {
  deliveryId?: unknown;
  type?: unknown;
  count?: unknown;
  message?: unknown;
};

function hasCallbackAuthorization(value: string | null): boolean {
  const configured = process.env.ETA_CALLBACK_API_KEY;
  if (!configured || !value?.startsWith("ApiKey ")) return false;
  const supplied = Buffer.from(value.slice("ApiKey ".length));
  const expected = Buffer.from(configured);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function validatedMessages(body: EtaNotificationEnvelope): EtaDocumentNotification[] | null {
  if (body.type !== "document" || !Array.isArray(body.message) || body.message.length === 0) return null;
  if (typeof body.count === "number" && body.count !== body.message.length) return null;
  const allowedStatuses = new Set(["Valid", "Invalid", "Rejected", "Cancelled", "Submitted"]);
  const allowedTypes = new Set(["document-validated", "document-received", "document-rejected", "document-cancelled"]);
  if (!body.message.every((item): item is EtaDocumentNotification => {
    if (!item || typeof item !== "object") return false;
    const message = item as EtaDocumentNotification;
    return typeof message.uuid === "string" && message.uuid.length > 0
      && typeof message.status === "string" && allowedStatuses.has(message.status)
      && typeof message.type === "string" && allowedTypes.has(message.type);
  })) return null;
  return body.message as EtaDocumentNotification[];
}

/**
 * Official ETA ERP notification endpoint. It is intentionally unauthenticated
 * by Clerk: ETA authenticates the call with the taxpayer-configured ApiKey.
 */
export async function PUT(request: Request) {
  if (!process.env.ETA_CALLBACK_API_KEY) {
    return NextResponse.json({ error: "ETA_CALLBACK_NOT_CONFIGURED" }, { status: 503 });
  }
  if (!hasCallbackAuthorization(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as EtaNotificationEnvelope | null;
  if (!body || typeof body.deliveryId !== "string" || body.deliveryId.length === 0) {
    return NextResponse.json({ error: "INVALID_ETA_NOTIFICATION" }, { status: 400 });
  }
  const messages = validatedMessages(body);
  if (!messages) return NextResponse.json({ error: "INVALID_ETA_NOTIFICATION" }, { status: 400 });

  const replay = await checkWebhookReplay("eta", body.deliveryId);
  if (replay.isReplay) {
    return NextResponse.json({ received: true, replay: true });
  }

  try {
    for (const message of messages) {
      await processCallback({
        uuid: message.uuid as string,
        status: message.status as string,
        deliveryId: body.deliveryId,
        dateTimeValidated: typeof message.dateTimeValidated === "string" ? message.dateTimeValidated : undefined,
        rejectionReasons: Array.isArray(message.rejectionReasons)
          ? message.rejectionReasons.filter((reason): reason is { error: string; errorCode: string } => Boolean(reason) && typeof reason === "object" && typeof (reason as { error?: unknown }).error === "string" && typeof (reason as { errorCode?: unknown }).errorCode === "string")
          : undefined,
      });
    }
    await markWebhookProcessed("eta", body.deliveryId, `PROCESSED:${messages.length}`);
    return NextResponse.json({ received: true, processed: messages.length });
  } catch (error) {
    console.error("[eta-callback] notification processing failed", error instanceof Error ? error.message : "unknown error");
    // A non-2xx response instructs ETA to retry according to its registered policy.
    return NextResponse.json({ error: "ETA_NOTIFICATION_PROCESSING_FAILED" }, { status: 500 });
  }
}
