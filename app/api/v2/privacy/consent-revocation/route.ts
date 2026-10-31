import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

const consentRevocationSchema = z.object({
  consentType: z.enum(["PROCESSING", "MARKETING", "THIRD_PARTY", "ANALYTICS"]),
  reason: z.string().min(1).max(500).optional(),
});

/**
 * Consent revocation endpoint.
 *
 * Technical behavior only: records a revocation event against the
 * authenticated user's tenant. Does NOT invent retention schedules,
 * legal obligations, or company privacy-policy text. Any missing
 * legal framework is surfaced as a blocker rather than fabricated.
 */
export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const parsed = consentRevocationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "CONSENT_REVOCATION_TYPE_REQUIRED" }, { status: 400 });
  }

  const existing = await prisma.consentRecord.findFirst({
    where: {
      userId: actor.id,
      tenantId: actor.tenantId,
      consentType: parsed.data.consentType,
      status: "GRANTED",
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "NO_ACTIVE_CONSENT_FOUND", consentType: parsed.data.consentType }, { status: 404 });
  }
  const revocation = await prisma.$transaction(async (tx) => {
    const existingInTx = await tx.consentRecord.findFirst({
      where: { id: existingInTx.id },
    });
    if (!existingInTx) {
      return NextResponse.json({ error: "CONSENT_RECORD_NOT_FOUND" }, { status: 404 });
    }
    const updated = await tx.consentRecord.update({
      where: { id: existingInTx.id },
      data: {
        status: "WITHDRAWN",
        withdrawalReason: parsed.data.reason || "Not provided",
      },
    });
    await appendAuditEntry({
      entityName: "CONSENT",
      entityId: actor.id,
      actionType: "CONSENT_WITHDRAWN",
      tenantId: actor.tenantId,
      actorId: actor.id,
      actorRole: actor.platformRole,
      changes: { consentType: parsed.data.consentType, consentRecordId: existing.id },
    }, tx);
    return updated;
  });

  return NextResponse.json({
    revocation: {
      id: revocation.id,
      consentType: parsed.data.consentType,
      status: revocation.status,
      recordedAt: revocation.updatedAt,
    },
    note: "Revocation recorded. Legal retention obligations and data-deletion timelines require owner/legal input — see HANDOVER.md block P4.",
  }, { status: 201 });
}
