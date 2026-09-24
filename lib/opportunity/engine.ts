/**
 * Opportunity Engine — Hotel-side procurement cost reduction intelligence.
 *
 * Detects, tracks, and manages opportunities identified from procurement evidence.
 * All functions are tenant-scoped and rely on authenticated context.
 */

import type { OpportunityStatus } from "@prisma/client";

export interface OpportunityFilters {
  type?: string;
  status?: string;
  ownerId?: string;
  affectedSupplierId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

/**
 * Detect cost-reduction opportunities for a tenant from procurement evidence.
 * Stub implementation — full detection logic will be added by the intelligence squad.
 */
export async function detectOpportunities(tenantId: string): Promise<{ detected: number; opportunities: unknown[] }> {
  // TODO: Implement ML/rule-based detection from EvidenceRecord, orders, invoices
  return { detected: 0, opportunities: [] };
}

/**
 * Get tenant-scoped opportunities with optional filters.
 */
export async function getOpportunities(
  tenantId: string,
  filters: OpportunityFilters,
  prisma: import("@prisma/client").PrismaClient
) {
  const {
    type,
    status,
    ownerId,
    affectedSupplierId,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
    search,
  } = filters;

  const where: Record<string, unknown> = { tenantId, deletedAt: null };
  if (type) where.type = type;
  if (status) where.status = status;
  if (ownerId) where.ownerId = ownerId;
  if (affectedSupplierId) where.affectedSupplierId = affectedSupplierId;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const [opportunities, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      orderBy: { [sortKey(sortBy)]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        affectedSupplier: { select: { id: true, name: true } },
        affectedProduct: { select: { id: true, name: true, sku: true } },
        owner: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.opportunity.count({ where }),
  ]);

  return {
    opportunities,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update opportunity status with audit trail.
 */
export async function updateOpportunityStatus(
  tenantId: string,
  id: string,
  status: OpportunityStatus,
  actor: { userId: string; platformRole: string; reason?: string },
  prisma: import("@prisma/client").PrismaClient
) {
  const existing = await prisma.opportunity.findFirst({
    where: { id, tenantId },
  });
  if (!existing) {
    throw new Error("Opportunity not found");
  }

  const beforeState = { status: existing.status };
  const updated = await prisma.opportunity.update({
    where: { id },
    data: { status },
  });

  return { beforeState, opportunity: updated };
}

/**
 * Assign an opportunity to an owner.
 */
export async function assignOpportunity(
  tenantId: string,
  id: string,
  ownerId: string,
  prisma: import("@prisma/client").PrismaClient
) {
  const existing = await prisma.opportunity.findFirst({
    where: { id, tenantId },
  });
  if (!existing) {
    throw new Error("Opportunity not found");
  }

  return prisma.opportunity.update({
    where: { id },
    data: { ownerId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      affectedSupplier: { select: { id: true, name: true } },
      affectedProduct: { select: { id: true, name: true, sku: true } },
    },
  });
}

// ── Helpers ──

const ALLOWED_SORT_KEYS = new Set([
  "createdAt",
  "updatedAt",
  "potentialImpact",
  "confidence",
  "status",
  "type",
]);

function sortKey(input: string): string {
  return ALLOWED_SORT_KEYS.has(input) ? input : "createdAt";
}
