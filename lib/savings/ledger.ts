/**
 * Savings Ledger Service — HotelsVendors
 *
 * Manages the Savings Ledger lifecycle: create from Opportunity, transition
 * through POTENTIAL → EXPECTED → NEGOTIATED → REALIZED → VERIFIED, with dispute support.
 */

import { prisma } from "../../lib/prisma";

export type SavingsType = "NEGOTIATED" | "REALIZED" | "VERIFIED";
export type SavingsStatus =
  | "POTENTIAL"
  | "EXPECTED"
  | "NEGOTIATED"
  | "REALIZED"
  | "VERIFIED"
  | "DISPUTED"
  | "REVERSED";

export interface CreateSavingsInput {
  tenantId: string;
  opportunityId?: string;
  type: SavingsType;
  baseline?: number;
  potentialSaving?: number;
  expectedSaving?: number;
  supplierId?: string;
  category?: string;
  productId?: string;
  ownerId?: string;
  evidence?: Record<string, unknown>;
}

export interface UpdateSavingsInput {
  type?: SavingsType;
  baseline?: number;
  potentialSaving?: number;
  expectedSaving?: number;
  negotiatedAmount?: number;
  realizedAmount?: number;
  verifiedAmount?: number;
  evidence?: Record<string, unknown>;
  transactionId?: string;
  supplierId?: string;
  category?: string;
  productId?: string;
  ownerId?: string;
}

export interface SavingsFilters {
  status?: string;
  type?: string;
  supplierId?: string;
  category?: string;
  productId?: string;
  ownerId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const VALID_TRANSITIONS: Record<SavingsStatus, SavingsStatus[]> = {
  POTENTIAL: ["EXPECTED", "REVERSED"],
  EXPECTED: ["NEGOTIATED", "REVERSED"],
  NEGOTIATED: ["REALIZED", "DISPUTED", "REVERSED"],
  REALIZED: ["VERIFIED", "DISPUTED", "REVERSED"],
  VERIFIED: ["DISPUTED"],
  DISPUTED: ["REALIZED", "REVERSED"],
  REVERSED: [],
};

/**
 * Create a savings record from an Opportunity or standalone.
 */
export async function createSavingsRecord(input: CreateSavingsInput) {
  const {
    tenantId,
    opportunityId,
    type,
    baseline,
    potentialSaving,
    expectedSaving,
    supplierId,
    category,
    productId,
    ownerId,
    evidence,
  } = input;

  return prisma.savingsLedger.create({
    data: {
      tenantId,
      opportunityId: opportunityId ?? null,
      type,
      status: "POTENTIAL",
      baseline: baseline ?? null,
      potentialSaving: potentialSaving ?? null,
      expectedSaving: expectedSaving ?? null,
      supplierId: supplierId ?? null,
      category: category ?? null,
      productId: productId ?? null,
      ownerId: ownerId ?? null,
      evidence: evidence ? JSON.parse(JSON.stringify(evidence)) : null,
    },
    include: {
      opportunity: { select: { id: true, title: true, type: true } },
      supplier: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, sku: true } },
      owner: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * Transition a savings record through its lifecycle with validation.
 */
export async function updateStatus(
  id: string,
  status: SavingsStatus,
  updates?: UpdateSavingsInput & {
    verifiedById?: string;
    verifiedAt?: string;
    disputeReason?: string;
  }
) {
  const existing = await prisma.savingsLedger.findFirst({ where: { id } });
  if (!existing) {
    throw new Error("Savings record not found");
  }

  const allowed = VALID_TRANSITIONS[existing.status] || [];
  if (!allowed.includes(status)) {
    throw new Error(
      `Invalid transition from ${existing.status} to ${status}. Allowed: ${allowed.join(", ") || "none"}`
    );
  }

  const data: Record<string, unknown> = { status };

  if (updates) {
    if (updates.type !== undefined) data.type = updates.type;
    if (updates.baseline !== undefined) data.baseline = updates.baseline;
    if (updates.potentialSaving !== undefined)
      data.potentialSaving = updates.potentialSaving;
    if (updates.expectedSaving !== undefined)
      data.expectedSaving = updates.expectedSaving;
    if (updates.negotiatedAmount !== undefined)
      data.negotiatedAmount = updates.negotiatedAmount;
    if (updates.realizedAmount !== undefined)
      data.realizedAmount = updates.realizedAmount;
    if (updates.verifiedAmount !== undefined)
      data.verifiedAmount = updates.verifiedAmount;
    if (updates.evidence !== undefined) data.evidence = updates.evidence;
    if (updates.transactionId !== undefined)
      data.transactionId = updates.transactionId;
    if (updates.supplierId !== undefined) data.supplierId = updates.supplierId;
    if (updates.category !== undefined) data.category = updates.category;
    if (updates.productId !== undefined) data.productId = updates.productId;
    if (updates.ownerId !== undefined) data.ownerId = updates.ownerId;
    if (updates.verifiedById !== undefined) data.verifiedById = updates.verifiedById;
    if (updates.verifiedAt !== undefined) data.verifiedAt = new Date(updates.verifiedAt);
    if (updates.disputeReason !== undefined)
      data.disputeReason = updates.disputeReason;
  }

  return prisma.savingsLedger.update({
    where: { id },
    data,
    include: {
      opportunity: { select: { id: true, title: true, type: true } },
      supplier: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, sku: true } },
      owner: { select: { id: true, name: true, email: true } },
      verifiedBy: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * Get savings records for a tenant with optional filters.
 */
export async function getSavingsByTenant(
  tenantId: string,
  filters: SavingsFilters = {}
) {
  const {
    status,
    type,
    supplierId,
    category,
    productId,
    ownerId,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;

  const where: Record<string, unknown> = { tenantId, deletedAt: null };
  if (status) where.status = status;
  if (type) where.type = type;
  if (supplierId) where.supplierId = supplierId;
  if (category) where.category = category;
  if (productId) where.productId = productId;
  if (ownerId) where.ownerId = ownerId;

  const ALLOWED_SORT = new Set([
    "createdAt",
    "updatedAt",
    "baseline",
    "potentialSaving",
    "expectedSaving",
    "negotiatedAmount",
    "realizedAmount",
    "verifiedAmount",
    "status",
    "type",
  ]);
  const orderBy: Record<string, string> = {
    [ALLOWED_SORT.has(sortBy) ? sortBy : "createdAt"]: sortOrder,
  };

  const [records, total] = await Promise.all([
    prisma.savingsLedger.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        opportunity: { select: { id: true, title: true, type: true } },
        supplier: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, sku: true } },
        owner: { select: { id: true, name: true, email: true } },
        verifiedBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.savingsLedger.count({ where }),
  ]);

  return {
    records,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get aggregated savings summary for a tenant.
 */
export async function getSavingsSummary(tenantId: string) {
  const grouped = await prisma.savingsLedger.groupBy({
    by: ["status"],
    where: { tenantId, deletedAt: null },
    _sum: {
      baseline: true,
      potentialSaving: true,
      expectedSaving: true,
      negotiatedAmount: true,
      realizedAmount: true,
      verifiedAmount: true,
    },
    _count: { id: true },
  });

  const summary = {
    totalRecords: 0,
    byStatus: {} as Record<string, { count: number; totals: Record<string, number | null> }>,
    aggregate: {
      totalPotential: 0,
      totalExpected: 0,
      totalNegotiated: 0,
      totalRealized: 0,
      totalVerified: 0,
    },
  };

  for (const row of grouped) {
    summary.totalRecords += row._count.id;
    const totals: Record<string, number | null> = {};
    for (const key of ["baseline", "potentialSaving", "expectedSaving", "negotiatedAmount", "realizedAmount", "verifiedAmount"]) {
      const val = row._sum[key as keyof typeof row._sum];
      totals[key] = val != null ? Number(val) : null;
    }
    summary.byStatus[row.status] = { count: row._count.id, totals };

    summary.aggregate.totalPotential += Number(row._sum.potentialSaving ?? 0);
    summary.aggregate.totalExpected += Number(row._sum.expectedSaving ?? 0);
    summary.aggregate.totalNegotiated += Number(row._sum.negotiatedAmount ?? 0);
    summary.aggregate.totalRealized += Number(row._sum.realizedAmount ?? 0);
    summary.aggregate.totalVerified += Number(row._sum.verifiedAmount ?? 0);
  }

  return summary;
}

/**
 * Dispute a savings record.
 */
export async function disputeSavings(
  id: string,
  reason: string,
  currentStatus?: SavingsStatus
) {
  return updateStatus(id, "DISPUTED", {
    disputeReason: reason,
  });
}
