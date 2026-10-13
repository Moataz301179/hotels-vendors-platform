/**
 * Audit Log API — serves tamper-evident audit entries for the
 * authenticated tenant. Required for enterprise security reviews.
 *
 * GET /api/v1/audit — list entries (paginated, tenant-scoped)
 * GET /api/v1/audit/export — tamper-evident export (chain hash included)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, requirePermission, success, error, validateQuery } from "@/lib/api-utils";
import { z } from "zod";
import { createHash } from "crypto";
import { verifyAuditChain } from "@/lib/audit/tamper-proof";

const ListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(50),
  cursor: z.string().optional(),
  entityName: z.string().optional(),
  entityId: z.string().optional(),
  actionType: z.string().optional(),
  userId: z.string().optional(),
});

const ExportQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  entityName: z.string().trim().min(1).max(120).optional(),
  entityId: z.string().trim().min(1).max(191).optional(),
}).refine(
  ({ startDate, endDate }) => !startDate || !endDate || startDate <= endDate,
  { message: "startDate must be before or equal to endDate" }
);

/**
 * List audit log entries for the authenticated tenant.
 * Ordered by createdAt DESC (most recent first).
 */
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "audit:read");

  const query = validateQuery(ListQuerySchema, request.nextUrl.searchParams);
  const { limit, cursor, entityName, entityId, actionType, userId } = query;

  const where: Record<string, unknown> = { tenantId: auth.tenantId };
  if (entityName) where.entityName = entityName;
  if (entityId) where.entityId = entityId;
  if (actionType) where.actionType = actionType;
  if (userId) where.actorId = userId;

  const entries = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    select: {
      id: true,
      entityName: true,
      entityId: true,
      actionType: true,
      actorId: true,
      actorRole: true,
      changes: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      hash: true,
    },
  });

  const hasMore = entries.length > limit;
  const items = hasMore ? entries.slice(0, limit) : entries;

  return success({
    entries: items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
    totalApproximate: await prisma.auditLog.count({ where }),
  });
});

/**
 * Export a tamper-evident audit log slice.
 * Returns entries + chain hash + verification status.
 * Suitable for external audit / compliance submission.
 */
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "audit:read");

  const parsed = ExportQuerySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message || "Invalid export filters", 400);
  }

  const { startDate, endDate, entityName, entityId } = parsed.data;
  const where: Record<string, unknown> = { tenantId: auth.tenantId };
  if (startDate || endDate) {
    where.createdAt = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    };
  }
  if (entityName) where.entityName = entityName;
  if (entityId) where.entityId = entityId;

  const entries = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  // This digest covers only the tenant-filtered export. Chain verification
  // checks the global append chain because entries are chained across tenants.
  const chainHash = entries.reduce(
    (hash, entry) => createHash("sha256").update(hash + (entry.hash ?? "")).digest("hex"),
    "genesis"
  );
  const verification = await verifyAuditChain();

  return success({
    entries,
    chainHash,
    verified: verification.valid,
    verificationScope: "GLOBAL_AUDIT_CHAIN",
    tenantEntryCount: entries.length,
    exportedAt: new Date().toISOString(),
  });
});
