/**
 * RBAC Engine — G2: RBAC IS SERVER-SIDE ONLY
 *
 * Permissions are assigned to Roles, not individuals.
 * The client NEVER decides what it can access.
 * Every API route must call requirePermission(ctx, code) before executing.
 */

import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/lib/tenant/scope";

export class PermissionDeniedError extends Error {
  constructor(message = "Permission denied") {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

/**
 * Check if a user's role includes a specific permission.
 * Looks up the Role → Permission mapping dynamically.
 */
export async function hasPermission(
  ctx: TenantContext,
  permissionCode: string
): Promise<boolean> {
  if (ctx.platformRole === "ADMIN") return true;

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { roleId: true },
  });

  if (!user) return false;

  // Check permissions on the user's assigned role
  if (user.roleId) {
    const rolePermission = await prisma.rolePermission.findFirst({
      where: {
        roleId: user.roleId,
        permission: { code: permissionCode },
      },
    });
    if (rolePermission) return true;
  }

  // Fallback: inherit permissions from platform-level role with the same name
  if (user.roleId) {
    const userRole = await prisma.role.findUnique({
      where: { id: user.roleId },
      select: { name: true },
    });
    if (userRole) {
      const platformRolePerm = await prisma.rolePermission.findFirst({
        where: {
          role: {
            tenantId: "cmpel4w0z0000crjivswqpywh",
            name: userRole.name,
          },
          permission: { code: permissionCode },
        },
      });
      if (platformRolePerm) return true;
    }
  }

  return false;
}

/**
 * Require a permission or throw PermissionDeniedError.
 * Call this at the top of every API route that mutates data.
 */
export async function requirePermission(
  ctx: TenantContext,
  permissionCode: string
): Promise<void> {
  const allowed = await hasPermission(ctx, permissionCode);
  if (!allowed) {
    throw new PermissionDeniedError(`Missing permission: ${permissionCode}`);
  }
}

/**
 * Require at least one of the listed permissions.
 */
export async function requireAnyPermission(
  ctx: TenantContext,
  permissionCodes: string[]
): Promise<void> {
  const results = await Promise.all(
    permissionCodes.map((code) => hasPermission(ctx, code))
  );
  if (!results.some(Boolean)) {
    throw new PermissionDeniedError(`Missing one of: ${permissionCodes.join(", ")}`);
  }
}

/**
 * Fetch all permission codes for a user (for UI rendering server-side).
 */
export async function getUserPermissions(ctx: TenantContext): Promise<string[]> {
  if (ctx.platformRole === "ADMIN") {
    const all = await prisma.permission.findMany({ select: { code: true } });
    return all.map((p) => p.code);
  }

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { roleId: true },
  });

  if (!user) return [];

  const perms = new Set<string>();

  if (user.roleId) {
    const directPerms = await prisma.rolePermission.findMany({
      where: { roleId: user.roleId },
      select: { permission: { select: { code: true } } },
    });
    directPerms.forEach((rp) => perms.add(rp.permission.code));
  }

  // Fallback: inherit from platform-level role with the same name
  if (user.roleId) {
    const userRole = await prisma.role.findUnique({
      where: { id: user.roleId },
      select: { name: true },
    });
    if (userRole) {
      const platformRolePerms = await prisma.rolePermission.findMany({
        where: {
          role: {
            tenantId: "cmpel4w0z0000crjivswqpywh",
            name: userRole.name,
          },
        },
        select: { permission: { select: { code: true } } },
      });
      platformRolePerms.forEach((rp) => perms.add(rp.permission.code));
    }
  }

  return Array.from(perms);
}
