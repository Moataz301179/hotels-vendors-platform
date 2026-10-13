import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/lib/tenant/scope";
import type { Prisma } from "@prisma/client";

export class PermissionDeniedError extends Error {
  constructor(message = "Permission denied") { super(message); this.name = "PermissionDeniedError"; }
}

/** Permission grants come from the active account's assigned database role. */
export async function getUserPermissions(ctx: TenantContext, db: Prisma.TransactionClient | typeof prisma = prisma): Promise<string[]> {
  const user = await db.user.findFirst({
    where: { id: ctx.userId, tenantId: ctx.tenantId,
      status: "ACTIVE", deletedAt: null, tenant: { status: "ACTIVE", deletedAt: null } },
    select: { platformRole: true, assignedRole: { select: { id: true, tenantId: true, isGlobal: true, deletedAt: true } },
      tenant: { select: { type: true } } },
  });
  if (!user || user.platformRole !== ctx.platformRole || user.assignedRole.deletedAt) return [];
  const role = user.assignedRole;
  const platformAdmin = ctx.platformRole === "ADMIN" && user.tenant.type === "PLATFORM";
  if (role.isGlobal ? !platformAdmin : role.tenantId !== ctx.tenantId) return [];
  const grants = await db.rolePermission.findMany({
    where: { roleId: role.id, deletedAt: null, permission: { deletedAt: null } },
    select: { permission: { select: { code: true } } },
  });
  return [...new Set(grants.map(grant => grant.permission.code))];
}

export async function hasPermission(ctx: TenantContext, permissionCode: string): Promise<boolean> {
  return (await getUserPermissions(ctx)).includes(permissionCode);
}
export async function requirePermission(ctx: TenantContext, permissionCode: string): Promise<void> {
  if (!await hasPermission(ctx, permissionCode)) throw new PermissionDeniedError(`Missing permission: ${permissionCode}`);
}
export async function requireAnyPermission(ctx: TenantContext, codes: string[]): Promise<void> {
  const permissions = await getUserPermissions(ctx);
  if (!codes.some(code => permissions.includes(code))) throw new PermissionDeniedError(`Missing one of: ${codes.join(", ")}`);
}
