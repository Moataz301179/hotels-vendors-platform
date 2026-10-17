import { createHash } from "crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { getActor } from "@/lib/v2-auth";
import { prisma } from "@/lib/prisma";

const sourceInput = z.object({
  sourceUrl: z.string().trim().url().max(2_000).optional().or(z.literal("")),
  sourceReference: z.string().trim().min(2).max(240).optional().or(z.literal("")),
  extractedFact: z.string().trim().min(3).max(4_000),
  entityId: z.string().trim().max(160).optional().or(z.literal("")),
  entityName: z.string().trim().max(160).optional().or(z.literal("")),
}).superRefine((value, context) => {
  if (!value.sourceUrl && !value.sourceReference) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "A source URL or source reference is required." });
  }
});

const evidenceSelect = {
  id: true,
  sourceUrl: true,
  sourceReference: true,
  extractedFact: true,
  entityId: true,
  entityName: true,
  provenanceClass: true,
  confidenceScore: true,
  retrievalTimestamp: true,
  status: true,
  createdAt: true,
} as const;

function evidenceWhere(tenantId: string) {
  return { tenantId, deletedAt: null };
}

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const where = evidenceWhere(actor.tenantId);
  const [evidence, total, pending, extracted, resolved] = await Promise.all([
    prisma.evidenceRecord.findMany({ where, select: evidenceSelect, orderBy: { retrievalTimestamp: "desc" }, take: 100 }),
    prisma.evidenceRecord.count({ where }),
    prisma.evidenceRecord.count({ where: { ...where, status: "PENDING" } }),
    prisma.evidenceRecord.count({ where: { ...where, status: "EXTRACTED" } }),
    prisma.evidenceRecord.count({ where: { ...where, status: "RESOLVED" } }),
  ]);

  return NextResponse.json({
    evidence,
    summary: { total, pending, extracted, resolved },
    boundary: "Evidence is organization-scoped source context. It does not verify an offer, supplier, price, availability or commercial outcome by itself.",
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!["HOTEL", "SUPPLIER", "ADMIN"].includes(actor.platformRole)) {
    return NextResponse.json({ error: "EVIDENCE_SUBMISSION_ROLE_REQUIRED" }, { status: 403 });
  }

  const parsed = sourceInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a source URL or reference and a concise factual observation." }, { status: 400 });
  }

  const { sourceUrl, sourceReference, extractedFact, entityId, entityName } = parsed.data;
  const normalized = {
    sourceUrl: sourceUrl || null,
    sourceReference: sourceReference || null,
    extractedFact,
    entityId: entityId || null,
    entityName: entityName || null,
  };

  const evidence = await prisma.$transaction(async transaction => {
    const created = await transaction.evidenceRecord.create({
      data: {
        tenantId: actor.tenantId,
        sourceUrl: normalized.sourceUrl ?? undefined,
        sourceReference: normalized.sourceReference ?? undefined,
        rawEvidenceHash: createHash("sha256").update(JSON.stringify(normalized)).digest("hex"),
        extractedFact: normalized.extractedFact,
        entityId: normalized.entityId ?? undefined,
        entityName: normalized.entityName ?? undefined,
        provenanceClass: "USER_PROVIDED",
        confidenceScore: 0.5,
        status: "EXTRACTED",
      },
      select: evidenceSelect,
    });

    await appendAuditEntry({
      entityName: "EVIDENCE",
      entityId: created.id,
      actionType: "CREATED",
      tenantId: actor.tenantId,
      actorId: actor.id,
      actorRole: actor.platformRole,
      changes: {
        provenanceClass: "USER_PROVIDED",
        sourceUrl: normalized.sourceUrl,
        sourceReference: normalized.sourceReference,
        entityId: normalized.entityId,
        entityName: normalized.entityName,
      },
    }, transaction);

    return created;
  });

  return NextResponse.json({ evidence }, { status: 201 });
}
