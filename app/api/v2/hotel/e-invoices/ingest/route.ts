import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { PermissionDeniedError, requirePermission } from "@/lib/auth/rbac";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

const ingestSchema = z.object({
  hotelId: z.string().min(1),
  sourceType: z.string().trim().min(1).max(64),
  sourceReference: z.string().trim().min(1).max(160),
  payloadSummary: z.object({
    contentDigest: z.string().regex(/^[a-f0-9]{64}$/i),
    documentCount: z.number().int().nonnegative().max(100_000),
    sourcePeriodStart: z.string().datetime().optional(),
    sourcePeriodEnd: z.string().datetime().optional(),
  }).strict(),
  recordCount: z.number().int().positive().max(100_000).default(0),
});

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, "einvoice:ingest");
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "EINVOICE_INGEST_PERMISSION_REQUIRED" }, { status: 403 });
    throw error;
  }

  const parsed = ingestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "A minimised e-invoice payload summary is required." }, { status: 400 });
  }

  const { hotelId, sourceType, sourceReference, payloadSummary, recordCount } = parsed.data;

  const hotel = await prisma.hotel.findFirst({
    where: { id: hotelId, tenantId: actor.tenantId, deletedAt: null },
    select: { id: true, status: true },
  });
  if (!hotel) return NextResponse.json({ error: "HOTEL_NOT_FOUND" }, { status: 404 });
  if (hotel.status !== "ACTIVE") return NextResponse.json({ error: "HOTEL_NOT_ACTIVE" }, { status: 409 });

  const consent = await prisma.consentRecord.findFirst({
    where: {
      tenantId: actor.tenantId,
      userId: actor.id,
      consentType: "HOTEL_EINVOICE_INGESTION",
      status: "GRANTED",
      withdrawnAt: null,
      deletedAt: null,
    },
    select: { id: true, createdAt: true },
  });
  if (!consent) return NextResponse.json({ error: "CONSENT_REQUIRED", message: "Data processing consent for e-invoice ingestion is missing or withdrawn." }, { status: 403 });

  const importRecord = await prisma.$transaction(async (tx) => {
    const created = await tx.hotelEInvoiceImport.create({
      data: {
        tenantId: actor.tenantId,
        hotelId,
        sourceType,
        sourceReference,
        payloadSummary,
        recordCount,
        status: "PENDING",
      },
    });
    await appendAuditEntry({
      entityName: "HOTEL_EINVOICE_IMPORT",
      entityId: created.id,
      actionType: "CREATED",
      tenantId: actor.tenantId,
      actorId: actor.id,
      actorRole: actor.platformRole,
      changes: { hotelId, sourceType, sourceReference, recordCount },
    }, tx);
    return created;
  });

  return NextResponse.json({ import: importRecord }, { status: 201 });
}

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, "einvoice:ingest");
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "EINVOICE_INGEST_PERMISSION_REQUIRED" }, { status: 403 });
    throw error;
  }

  const hotel = await prisma.hotel.findFirst({
    where: { tenantId: actor.tenantId, status: "ACTIVE", deletedAt: null },
    select: { id: true },
  });
  if (!hotel) return NextResponse.json({ error: "ACTIVE_HOTEL_REQUIRED" }, { status: 409 });

  const imports = await prisma.hotelEInvoiceImport.findMany({
    where: { tenantId: actor.tenantId, hotelId: hotel.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ imports });
}
