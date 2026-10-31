import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { PermissionDeniedError, requirePermission } from "@/lib/auth/rbac";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

const policySchema = z.object({
  tenantId: z.string().min(1),
  defaultConsentLegalBasis: z.enum([
    "EXPLICIT_CONSENT",
    "CONTRACT",
    "LEGITIMATE_INTEREST",
    "LEGAL_OBLIGATION",
    "VITAL_INTERESTS",
    "PUBLIC_TASK",
  ]),
});

export async function PATCH(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, "consent:manage");
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "CONSENT_MANAGE_PERMISSION_REQUIRED" }, { status: 403 });
    throw error;
  }

  const parsed = policySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "tenantId and defaultConsentLegalBasis are required." }, { status: 400 });
  }

  const { tenantId, defaultConsentLegalBasis } = parsed.data;

  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, deletedAt: null },
    select: { id: true, name: true, defaultConsentLegalBasis: true },
  });
  if (!tenant) return NextResponse.json({ error: "TENANT_NOT_FOUND" }, { status: 404 });

  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: { defaultConsentLegalBasis },
    select: { id: true, name: true, defaultConsentLegalBasis: true },
  });

  await appendAuditEntry({
    entityName: "TENANT",
    entityId: tenant.id,
    actionType: "UPDATED",
    tenantId: actor.tenantId,
    actorId: actor.id,
    actorRole: actor.platformRole,
    changes: { defaultConsentLegalBasis },
  });

  return NextResponse.json({ tenant: updated });
}

export async function GET(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, "consent:manage");
  } catch (error) {
    if (error instanceof PermissionDeniedError) return NextResponse.json({ error: "CONSENT_MANAGE_PERMISSION_REQUIRED" }, { status: 403 });
    throw error;
  }

  const tenantId = new URL(request.url).searchParams.get("tenantId") || actor.tenantId;
  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, deletedAt: null },
    select: { id: true, name: true, defaultConsentLegalBasis: true },
  });

  if (!tenant) return NextResponse.json({ error: "TENANT_NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ tenant });
}
