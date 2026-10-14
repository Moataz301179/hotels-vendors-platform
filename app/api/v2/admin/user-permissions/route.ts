import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { managedHotelTenant, managedHotelTenants } from "@/lib/admin/managed-hotel-tenants";

const grantInput = z.object({ tenantId: z.string().min(1), userId: z.string().min(1), permissionCode: z.string().min(1) });
const revokeInput = z.object({ tenantId: z.string().min(1), grantId: z.string().min(1) });

async function requireAdmin() {
  const actor = await getActor();
  if (!actor) return { error: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }) } as const;
  if (actor.platformRole !== "ADMIN") return { error: NextResponse.json({ error: "ADMIN_ROLE_REQUIRED" }, { status: 403 }) } as const;
  return { actor } as const;
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const tenants = await managedHotelTenants(auth.actor.tenantId);
  if (!tenants) return NextResponse.json({ error: "PLATFORM_TENANT_REQUIRED" }, { status: 403 });
  const tenantId = new URL(request.url).searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ grants: [], users: [], tenants });
  if (!tenants.some((tenant) => tenant.id === tenantId)) return NextResponse.json({ error: "HOTEL_TENANT_NOT_FOUND" }, { status: 404 });
  const [grants, users] = await Promise.all([
    prisma.userPermissionGrant.findMany({
      where: { tenantId },
      include: { user: { select: { id: true, email: true, name: true } }, permission: { select: { id: true, code: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { tenantId, status: "ACTIVE", deletedAt: null },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return NextResponse.json({ grants, users, tenants });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const parsed = grantInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "TENANT_USER_AND_PERMISSION_REQUIRED" }, { status: 400 });
  const targetTenant = await managedHotelTenant(auth.actor.tenantId, parsed.data.tenantId);
  if (!targetTenant) return NextResponse.json({ error: "HOTEL_TENANT_NOT_FOUND" }, { status: 404 });
  const [user, permission] = await Promise.all([
    prisma.user.findFirst({ where: { id: parsed.data.userId, tenantId: targetTenant.id, status: "ACTIVE", deletedAt: null }, select: { id: true } }),
    prisma.permission.findFirst({ where: { code: parsed.data.permissionCode, deletedAt: null }, select: { id: true, code: true } }),
  ]);
  if (!user || !permission) return NextResponse.json({ error: "USER_OR_PERMISSION_NOT_FOUND" }, { status: 404 });
  const grant = await prisma.$transaction(async (tx) => {
    const created = await tx.userPermissionGrant.upsert({
      where: { tenantId_userId_permissionId: { tenantId: targetTenant.id, userId: user.id, permissionId: permission.id } },
      create: { tenantId: targetTenant.id, userId: user.id, permissionId: permission.id, grantedById: auth.actor.id },
      update: { revokedAt: null, grantedById: auth.actor.id },
    });
    await appendAuditEntry({ entityName: "USER", entityId: user.id, actionType: "UPDATED", tenantId: targetTenant.id, actorId: auth.actor.id, actorRole: auth.actor.platformRole, changes: { delegatedPermission: permission.code, grantId: created.id } }, tx);
    return created;
  });
  return NextResponse.json({ grant }, { status: 201 });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const parsed = revokeInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "TENANT_AND_GRANT_REQUIRED" }, { status: 400 });
  const targetTenant = await managedHotelTenant(auth.actor.tenantId, parsed.data.tenantId);
  if (!targetTenant) return NextResponse.json({ error: "HOTEL_TENANT_NOT_FOUND" }, { status: 404 });
  const existing = await prisma.userPermissionGrant.findFirst({ where: { id: parsed.data.grantId, tenantId: targetTenant.id, revokedAt: null } });
  if (!existing) return NextResponse.json({ error: "GRANT_NOT_FOUND" }, { status: 404 });
  const grant = await prisma.$transaction(async (tx) => {
    const revoked = await tx.userPermissionGrant.update({ where: { id: existing.id }, data: { revokedAt: new Date(), revokedById: auth.actor.id } });
    await appendAuditEntry({ entityName: "USER", entityId: existing.userId, actionType: "UPDATED", tenantId: targetTenant.id, actorId: auth.actor.id, actorRole: auth.actor.platformRole, changes: { delegatedPermissionRevoked: existing.permissionId, grantId: existing.id } }, tx);
    return revoked;
  });
  return NextResponse.json({ grant });
}
