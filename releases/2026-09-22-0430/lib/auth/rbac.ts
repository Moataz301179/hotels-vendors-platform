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
  // Platform Admin bypass
  if (ctx.platformRole === "ADMIN") return true;

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { roleId: true },
  });

  if (!user) return false;

  const rolePermission = await prisma.rolePermission.findFirst({
    where: {
      roleId: user.roleId,
      permission: { code: permissionCode },
    },
  });

  return rolePermission !== null;
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
    // Admin gets all permission codes
    const all = await prisma.permission.findMany({ select: { code: true } });
    return all.map((p) => p.code);
  }

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { roleId: true },
  });

  if (!user) return [];

  const perms = await prisma.rolePermission.findMany({
    where: { roleId: user.roleId },
    select: { permission: { select: { code: true } } },
  });

  return perms.map((rp) => rp.permission.code);
}
