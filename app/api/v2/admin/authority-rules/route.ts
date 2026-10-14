import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { PermissionDeniedError, requirePermission } from "@/lib/auth/rbac";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

const authorityRuleInput = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).optional(),
  role: z.enum(["OWNER", "REGIONAL_GM", "GM", "FINANCIAL_CONTROLLER", "DEPARTMENT_HEAD", "CLERK", "RECEIVING_CLERK", "LOGISTICS_COORDINATOR"]),
  action: z.literal("APPROVE"),
  minValue: z.coerce.number().finite().min(0).optional().nullable(),
  maxValue: z.coerce.number().finite().min(0).optional().nullable(),
  priority: z.coerce.number().int().min(-1000).max(1000).default(0),
  tenantId: z.string().min(1),
});

const authorityRuleStatusInput = z.object({
  id: z.string().min(1),
  isActive: z.boolean(),
  tenantId: z.string().min(1),
});

async function requireAdmin() {
  const actor = await getActor();
  if (!actor) return { error: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }) } as const;
  if (actor.platformRole !== "ADMIN") return { error: NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 }) } as const;
  try {
    await requirePermission({ userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole }, "order:approve");
  } catch (error) {
    if (error instanceof PermissionDeniedError) return { error: NextResponse.json({ error: "ORDER_APPROVE_PERMISSION_REQUIRED" }, { status: 403 }) } as const;
    throw error;
  }
  return { actor } as const;
}

async function manageableHotelTenants(actorTenantId: string) {
  const platformTenant = await prisma.tenant.findFirst({
    where: { id: actorTenantId, type: "PLATFORM", status: "ACTIVE", deletedAt: null },
    select: { id: true },
  });
  if (!platformTenant) return null;
  return prisma.tenant.findMany({
    where: { type: "HOTEL_GROUP", status: "ACTIVE", deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

async function selectedHotelTenant(actorTenantId: string, tenantId: string) {
  const tenants = await manageableHotelTenants(actorTenantId);
  return tenants?.find((tenant) => tenant.id === tenantId) ?? null;
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const tenants = await manageableHotelTenants(auth.actor.tenantId);
  if (!tenants) return NextResponse.json({ error: "PLATFORM_TENANT_REQUIRED" }, { status: 403 });
  const tenantId = new URL(request.url).searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ rules: [], tenants });
  if (!tenants.some((tenant) => tenant.id === tenantId)) return NextResponse.json({ error: "HOTEL_TENANT_NOT_FOUND" }, { status: 404 });
  const rules = await prisma.authorityRule.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: [{ isActive: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ rules, tenants });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const parsed = authorityRuleInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "VALID_AUTHORITY_RULE_REQUIRED" }, { status: 400 });
  const targetTenant = await selectedHotelTenant(auth.actor.tenantId, parsed.data.tenantId);
  if (!targetTenant) return NextResponse.json({ error: "HOTEL_TENANT_NOT_FOUND" }, { status: 404 });
  const { minValue, maxValue } = parsed.data;
  if (minValue !== null && minValue !== undefined && maxValue !== null && maxValue !== undefined && minValue > maxValue) {
    return NextResponse.json({ error: "INVALID_AMOUNT_RANGE" }, { status: 400 });
  }
  const rule = await prisma.$transaction(async (tx) => {
    const created = await tx.authorityRule.create({
      data: {
        tenantId: targetTenant.id,
        name: parsed.data.name,
        description: parsed.data.description || null,
        role: parsed.data.role,
        action: parsed.data.action,
        minValue: minValue ?? null,
        maxValue: maxValue ?? null,
        priority: parsed.data.priority,
      },
    });
    await appendAuditEntry({
      entityName: "PROCUREMENT_APPROVAL_POLICY",
      entityId: created.id,
      actionType: "CREATED",
      tenantId: targetTenant.id,
      actorId: auth.actor.id,
      actorRole: auth.actor.platformRole,
      changes: { kind: "AUTHORITY_RULE", role: created.role, action: created.action, minValue: created.minValue?.toString() ?? null, maxValue: created.maxValue?.toString() ?? null, priority: created.priority },
    }, tx);
    return created;
  });
  return NextResponse.json({ rule }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const parsed = authorityRuleStatusInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "RULE_ID_AND_ACTIVE_STATUS_REQUIRED" }, { status: 400 });
  const targetTenant = await selectedHotelTenant(auth.actor.tenantId, parsed.data.tenantId);
  if (!targetTenant) return NextResponse.json({ error: "HOTEL_TENANT_NOT_FOUND" }, { status: 404 });
  const existing = await prisma.authorityRule.findFirst({
    where: { id: parsed.data.id, tenantId: targetTenant.id, deletedAt: null },
    select: { id: true, isActive: true },
  });
  if (!existing) return NextResponse.json({ error: "AUTHORITY_RULE_NOT_FOUND" }, { status: 404 });
  const rule = await prisma.$transaction(async (tx) => {
    const updated = await tx.authorityRule.update({ where: { id: existing.id }, data: { isActive: parsed.data.isActive } });
    await appendAuditEntry({
      entityName: "PROCUREMENT_APPROVAL_POLICY",
      entityId: updated.id,
      actionType: "UPDATED",
      tenantId: targetTenant.id,
      actorId: auth.actor.id,
      actorRole: auth.actor.platformRole,
      changes: { kind: "AUTHORITY_RULE", fromActive: existing.isActive, toActive: updated.isActive },
    }, tx);
    return updated;
  });
  return NextResponse.json({ rule });
}
