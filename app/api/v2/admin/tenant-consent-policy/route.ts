import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { PermissionDeniedError, requirePermission } from "@/lib/auth/rbac";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { managedHotelTenant } from "@/lib/admin/managed-hotel-tenants";

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

  const { tenantId: requestedTenantId, defaultConsentLegalBasis } = parsed.data;

  // Reject cross-tenant targeting BEFORE any tenant lookup. A non-ADMIN with
  // consent:manage may only manage their own organization; the rejection is a
  // 403, never a 404, so the response cannot enumerate tenants.
  const target = await resolveTargetTenant(actor, requestedTenantId);
  if ("error" in target) return target.error;
  const tenantId = target.tenantId;

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

  // Audit against the AFFECTED tenant, not the actor's tenant, so the record is
  // visible in the victim's own audit trail. Actor identity is recorded
  // separately; the hash chain format is unchanged.
  await appendAuditEntry({
    entityName: "TENANT",
    entityId: tenant.id,
    actionType: "UPDATED",
    tenantId: tenant.id,
    actorId: actor.id,
    actorRole: actor.platformRole,
    changes: {
      defaultConsentLegalBasis,
      affectedTenantId: tenant.id,
      actorTenantId: actor.tenantId,
      crossTenant: !target.isOwn,
    },
  });

  return NextResponse.json({ tenant: updated });
}

/**
 * Resolve the tenant this consent-policy operation may act on.
 *
 * A non-ADMIN with consent:manage may only manage their own organization.
 * Any caller-supplied tenantId that is not the caller's own must be rejected
 * BEFORE any tenant lookup or update, with a 403 — never a 404, so the
 * response cannot be used to enumerate tenants.
 *
 * Platform ADMINs may act on any managed hotel tenant; targets that are not
 * managed hotel tenants of the platform tenant are rejected.
 */
async function resolveTargetTenant(
  actor: { id: string; tenantId: string; platformRole: string },
  requestedTenantId: string | null
): Promise<{ tenantId: string; isOwn: boolean } | { error: NextResponse }> {
  if (!requestedTenantId || requestedTenantId === actor.tenantId) {
    return { tenantId: actor.tenantId, isOwn: true };
  }
  if (actor.platformRole !== "ADMIN") {
    return {
      error: NextResponse.json(
        { error: "CONSENT_MANAGE_OWN_TENANT_ONLY" },
        { status: 403 }
      ),
    };
  }
  const managed = await managedHotelTenant(actor.tenantId, requestedTenantId);
  if (!managed) {
    return {
      error: NextResponse.json(
        { error: "HOTEL_TENANT_NOT_FOUND" },
        { status: 404 }
      ),
    };
  }
  return { tenantId: managed.id, isOwn: false };
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

  // No tenantId query param => caller's own tenant. Any other tenantId is
  // rejected for non-ADMIN before a lookup.
  const requestedTenantId = new URL(request.url).searchParams.get("tenantId");
  const target = await resolveTargetTenant(actor, requestedTenantId);
  if ("error" in target) return target.error;
  const tenantId = target.tenantId;

  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, deletedAt: null },
    select: { id: true, name: true, defaultConsentLegalBasis: true },
  });

  if (!tenant) return NextResponse.json({ error: "TENANT_NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ tenant });
}
