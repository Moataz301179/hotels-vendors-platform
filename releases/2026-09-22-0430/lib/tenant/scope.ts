/**
 * Tenant Scope — G1: TENANT ISOLATION IS NON-NEGOTIABLE
 *
 * Every database query must be tenant-scoped. This module provides
 * the canonical helpers for injecting tenantId filters.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface TenantContext {
  tenantId: string;
  platformRole: string;
  userId: string;
}

/**
 * Build a where-clause fragment that scopes by tenantId.
 * Merge it with any existing where conditions.
 */
export function tenantWhereClause(
  ctx: TenantContext | string,
  additionalWhere?: Record<string, unknown>
): Prisma.InputJsonObject {
  const tenantId = typeof ctx === "string" ? ctx : ctx.tenantId;
  return {
    tenantId,
    ...additionalWhere,
  } as Prisma.InputJsonObject;
}

/**
 * Require a valid tenant context. Throws if tenantId is missing or invalid.
 */
export function requireTenant(ctx: Partial<TenantContext>): asserts ctx is TenantContext {
  if (!ctx.tenantId || typeof ctx.tenantId !== "string" || ctx.tenantId.length < 5) {
    throw new Error("Tenant context required: tenantId is missing or invalid");
  }
  if (!ctx.userId) {
    throw new Error("Tenant context required: userId is missing");
  }
}

/**
 * Verify that a given entity belongs to the user's tenant.
 * Use before mutating an existing record.
 */
export async function verifyTenantOwnership(
  ctx: TenantContext,
  model: keyof typeof prisma,
  id: string
): Promise<boolean> {
  // Prisma dynamic model access via a typed map
  const getter = prisma[model] as unknown as {
    findUnique: (args: { where: { id: string }; select: { tenantId: true } }) => Promise<{ tenantId: string } | null>;
  };

  if (!getter || typeof getter.findUnique !== "function") {
    throw new Error(`Model ${String(model)} does not support findUnique`);
  }

  const record = await getter.findUnique({
    where: { id },
    select: { tenantId: true },
  });

  return record !== null && record.tenantId === ctx.tenantId;
}

/**
 * Enforce tenant ownership or throw.
 */
export async function enforceTenantOwnership(
  ctx: TenantContext,
  model: keyof typeof prisma,
  id: string
): Promise<void> {
  const owns = await verifyTenantOwnership(ctx, model, id);
  if (!owns) {
    throw new Error("Cross-tenant access denied");
  }
}
