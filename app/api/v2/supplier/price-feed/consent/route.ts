import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { PermissionDeniedError, requirePermission } from "@/lib/auth/rbac";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

const consentSchema = z.object({
  optIn: z.boolean(),
  slaLevel: z.enum(['STANDARD', 'PRIORITY', 'REAL_TIME']).default('STANDARD'),
  scope: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  if (actor.platformRole !== 'SUPPLIER') {
    return NextResponse.json({ error: "SUPPLIER_ROLE_REQUIRED" }, { status: 403 });
  }

  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, 'price:feed:write');
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "PRICE_FEED_WRITE_PERMISSION_REQUIRED" }, { status: 403 });
    throw error;
  }

  const parsed = consentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "optIn boolean and valid slaLevel are required." }, { status: 400 });
  }

  const { optIn, slaLevel, scope } = parsed.data;

  if (!actor.supplierId) {
    return NextResponse.json({ error: "SUPPLIER_ID_REQUIRED" }, { status: 400 });
  }

  const supplier = await prisma.supplier.findFirst({
    where: { id: actor.supplierId, tenantId: actor.tenantId, deletedAt: null },
    select: { id: true, priceFeedConsentStatus: true },
  });
  if (!supplier) return NextResponse.json({ error: "SUPPLIER_NOT_FOUND" }, { status: 404 });

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const updated = await prisma.$transaction(async (tx) => {
    const record = await tx.supplier.update({
      where: { id: supplier.id },
      data: {
        priceFeedConsentStatus: optIn ? 'GRANTED' : 'REVOKED',
        priceFeedConsentedAt: optIn ? now : undefined,
        priceFeedConsentExpiresAt: optIn ? expiresAt : undefined,
        priceFeedSlaLevel: optIn ? slaLevel : null,
      },
    });

    await appendAuditEntry({
      entityName: 'SUPPLIER',
      entityId: record.id,
      actionType: optIn ? 'PRICE_FEED_CONSENT_GRANTED' : 'PRICE_FEED_CONSENT_REVOKED',
      tenantId: actor.tenantId,
      actorId: actor.id,
      actorRole: actor.platformRole,
      changes: { optIn, slaLevel, scope, expiresAt: optIn ? expiresAt.toISOString() : null },
    }, tx);

    return record;
  });

  return NextResponse.json({ supplier: updated });
}

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  if (actor.platformRole !== 'SUPPLIER') {
    return NextResponse.json({ error: "SUPPLIER_ROLE_REQUIRED" }, { status: 403 });
  }

  if (!actor.supplierId) {
    return NextResponse.json({ error: "SUPPLIER_ID_REQUIRED" }, { status: 400 });
  }

  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, 'price:feed:read');
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "PRICE_FEED_READ_PERMISSION_REQUIRED" }, { status: 403 });
    throw error;
  }

  const supplier = await prisma.supplier.findFirst({
    where: { id: actor.supplierId, tenantId: actor.tenantId, deletedAt: null },
    select: { id: true, priceFeedConsentStatus: true, priceFeedConsentedAt: true, priceFeedConsentExpiresAt: true, priceFeedSlaLevel: true },
  });

  if (!supplier) return NextResponse.json({ error: "SUPPLIER_NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ supplier });
}
