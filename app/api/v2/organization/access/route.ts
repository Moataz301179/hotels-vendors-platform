import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { accessPool, accessPoolsFor, accessRoleName, isAccountAdmin, isAccountPillar, permissionName, pillarPermissionCodes } from "@/lib/access/pillar-access";

const choice = z.object({ userId: z.string().min(1), poolId: z.string().min(1) });

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!isAccountPillar(actor.platformRole)) return NextResponse.json({ error: "ACCOUNT_PILLAR_REQUIRED" }, { status: 403 });
  const pools = accessPoolsFor(actor.platformRole);
  const members = isAccountAdmin(actor)
    ? await prisma.user.findMany({
      where: { tenantId: actor.tenantId, platformRole: actor.platformRole, status: "ACTIVE", deletedAt: null },
      select: { id: true, name: true, email: true, role: true, assignedRole: { select: { name: true } } },
      orderBy: { name: "asc" },
    })
    : [];
  return NextResponse.json({
    pillar: actor.platformRole,
    accountAdmin: isAccountAdmin(actor),
    pools,
    members: members.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      organizationRole: member.role,
      accessPoolId: pools.find((pool) => accessRoleName(pool.id) === member.assignedRole?.name)?.id ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!isAccountAdmin(actor) || !isAccountPillar(actor.platformRole)) return NextResponse.json({ error: "ACCOUNT_ADMIN_REQUIRED" }, { status: 403 });
  const parsed = choice.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "MEMBER_AND_ACCESS_POOL_REQUIRED" }, { status: 400 });
  const pool = accessPool(actor.platformRole, parsed.data.poolId);
  if (!pool) return NextResponse.json({ error: "ACCESS_POOL_NOT_AVAILABLE" }, { status: 404 });
  const member = await prisma.user.findFirst({
    where: { id: parsed.data.userId, tenantId: actor.tenantId, platformRole: actor.platformRole, status: "ACTIVE", deletedAt: null },
    select: { id: true, role: true, roleId: true },
  });
  if (!member) return NextResponse.json({ error: "MEMBER_NOT_FOUND" }, { status: 404 });
  if (member.role === "OWNER") return NextResponse.json({ error: "ACCOUNT_ADMIN_ACCESS_IS_FIXED" }, { status: 409 });
  const allowed = new Set(pillarPermissionCodes(actor.platformRole));
  if (pool.permissions.some((code) => !allowed.has(code))) return NextResponse.json({ error: "ACCESS_POOL_NOT_AVAILABLE" }, { status: 404 });

  const updated = await prisma.$transaction(async (tx) => {
    const role = await tx.role.upsert({
      where: { tenantId_name: { tenantId: actor.tenantId, name: accessRoleName(pool.id) } },
      update: { deletedAt: null },
      create: { tenantId: actor.tenantId, name: accessRoleName(pool.id) },
    });
    const permissionIds: string[] = [];
    for (const code of pool.permissions) {
      const permission = await tx.permission.upsert({
        where: { code },
        update: { deletedAt: null },
        create: { code, name: permissionName(code), description: pool.purpose },
      });
      permissionIds.push(permission.id);
      await tx.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: { deletedAt: null },
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
    await tx.rolePermission.deleteMany({ where: { roleId: role.id, permissionId: { notIn: permissionIds } } });
    const user = await tx.user.update({ where: { id: member.id }, data: { roleId: role.id }, select: { id: true, roleId: true } });
    await appendAuditEntry({
      entityName: "USER",
      entityId: user.id,
      actionType: "UPDATED",
      tenantId: actor.tenantId,
      actorId: actor.id,
      actorRole: actor.platformRole,
      changes: { accessPool: pool.id, permissions: [...pool.permissions], previousRoleId: member.roleId },
    }, tx);
    return user;
  });
  return NextResponse.json({ userId: updated.id, accessPoolId: pool.id, permissions: pool.permissions });
}
