/**
 * ETA Callback Webhook
 *
 * Receives invoice status updates from the Egyptian Tax Authority.
 *
 * SECURITY: Every request is verified using HMAC SHA256 signature validation.
 * ETA signs each callback with a shared secret. We recompute the signature
 * from the raw request body and compare using timing-safe comparison to
 * prevent spoofed callbacks from corrupting invoice statuses.
 *
 * IDEMPOTENCY: Duplicate callbacks (same UUID + same status) are silently
 * acknowledged without creating duplicate audit log entries.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { EtaStatus } from "@prisma/client";

const ETA_WEBHOOK_SECRET = process.env.ETA_WEBHOOK_SECRET || "";

// ─────────────────────────────────────────
// HMAC SIGNATURE VERIFICATION
// ─────────────────────────────────────────

function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!ETA_WEBHOOK_SECRET) {
    console.error("[ETA Callback] ETA_WEBHOOK_SECRET not configured — rejecting all callbacks");
    return false;
  }

  if (!signature) {
    console.error("[ETA Callback] Missing x-eta-signature header");
    return false;
  }

  const expected = createHmac("sha256", ETA_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  // Timing-safe comparison to prevent timing attacks
  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(signature, "utf8");

  if (expectedBuf.length !== providedBuf.length) {
    return false;
  }

  return timingSafeEqual(expectedBuf, providedBuf);
}

// ─────────────────────────────────────────
// STATUS MAPPING
// ─────────────────────────────────────────

const ETA_STATUS_MAP: Record<string, EtaStatus> = {
  Submitted: "SUBMITTING",
  Valid: "ACCEPTED",
  Invalid: "REJECTED",
  Rejected: "REJECTED",
  Cancelled: "MANUAL_RESOLUTION",
};

// ─────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────

export async function POST(request: NextRequest) {
  // STEP 1: Read raw body for signature verification
  const rawBody = await request.text();

  // STEP 2: Verify HMAC signature
  const signature = request.headers.get("x-eta-signature");
  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json(
      { success: false, error: "Invalid signature" },
      { status: 401 }
    );
  }

  // STEP 3: Parse the verified payload
  let payload: {
    uuid: string;
    status: string;
    dateTimeValidated?: string;
    rejectionReasons?: { error: string; errorCode: string }[];
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  // STEP 4: Validate required fields
  if (!payload.uuid || typeof payload.uuid !== "string") {
    return NextResponse.json(
      { success: false, error: "Missing or invalid uuid" },
      { status: 400 }
    );
  }

  if (!payload.status || !ETA_STATUS_MAP[payload.status]) {
    return NextResponse.json(
      { success: false, error: `Unknown status: ${payload.status}` },
      { status: 400 }
    );
  }

  // STEP 5: Find the invoice by ETA UUID
  const invoice = await prisma.invoice.findUnique({
    where: { etaUuid: payload.uuid },
    select: {
      id: true,
      etaStatus: true,
      tenantId: true,
      submissionLog: true,
    },
  });

  if (!invoice) {
    // Acknowledge to stop ETA retries, but don't process
    return NextResponse.json(
      { success: true, message: "UUID not found — acknowledged" },
      { status: 200 }
    );
  }

  // STEP 6: Idempotency check — skip if this exact callback was already processed
  if (invoice.submissionLog) {
    try {
      const log = JSON.parse(invoice.submissionLog);
      if (
        log.lastCallback?.uuid === payload.uuid &&
        log.lastCallback?.status === payload.status
      ) {
        return NextResponse.json(
          { success: true, message: "Duplicate callback — already processed" },
          { status: 200 }
        );
      }
    } catch {
      // submissionLog is malformed — continue processing
    }
  }

  // STEP 7: Map ETA status to internal status
  const newEtaStatus = ETA_STATUS_MAP[payload.status];

  // STEP 8: Update invoice status
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      etaStatus: newEtaStatus,
      submissionLog: JSON.stringify({
        ...(invoice.submissionLog ? JSON.parse(invoice.submissionLog) : {}),
        lastCallback: {
          uuid: payload.uuid,
          status: payload.status,
          dateTimeValidated: payload.dateTimeValidated,
          rejectionReasons: payload.rejectionReasons,
          receivedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      }),
    },
  });

  // STEP 9: Write audit log (tamper-proof chain)
  const { appendAuditEntry } = await import("@/lib/audit/tamper-proof");
  await appendAuditEntry({
    entityName: "INVOICE",
    entityId: invoice.id,
    actionType: "UPDATE",
    tenantId: invoice.tenantId,
    actorId: "system",
    actorRole: "SYSTEM",
    changes: { etaStatus: newEtaStatus, previousEtaStatus: invoice.etaStatus },
  });

  return NextResponse.json(
    { success: true, message: "Callback processed" },
    { status: 200 }
  );
}
