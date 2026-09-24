/**
 * GET /api/v1/savings — List savings records for tenant with filtering
 * POST /api/v1/savings — Create a new savings record (optionally from an opportunity)
 */

import { NextRequest } from "next/server";
import { prisma } from "../../../../lib/prisma";
import {
  apiRoute,
  authenticate,
  validateBody,
  validateQuery,
  success,
  error,
  audit,
  requirePermission,
} from "../../../../lib/api-utils";
import {
  SavingsCreateSchema,
  SavingsListSchema,
} from "../../../../lib/zod";
import { getSavingsByTenant, createSavingsRecord } from "../../../../lib/savings/ledger";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "savings:read");
  const tenantId = auth.tenantId;

  const query = validateQuery(SavingsListSchema, request.nextUrl.searchParams);
  const result = await getSavingsByTenant(tenantId, {
    status: query.status,
    type: query.type,
    supplierId: query.supplierId,
    category: query.category,
    productId: query.productId,
    ownerId: query.ownerId,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  return success(result);
}, { rateLimit: "api" });

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "savings:create");
  const tenantId = auth.tenantId;

  const body = await request.json();
  const data = validateBody(SavingsCreateSchema, body);

  // Verify opportunity exists and belongs to tenant if provided
  if (data.opportunityId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const opportunity = await (prisma as any).opportunity.findFirst({
      where: { id: data.opportunityId, tenantId, deletedAt: null },
    });
    if (!opportunity) {
      return error("Opportunity not found", 404);
    }
  }

  const record = await createSavingsRecord({
    tenantId,
    opportunityId: data.opportunityId,
    type: data.type,
    baseline: data.baseline,
    potentialSaving: data.potentialSaving,
    expectedSaving: data.expectedSaving,
    supplierId: data.supplierId,
    category: data.category,
    productId: data.productId,
    ownerId: data.ownerId,
    evidence: data.evidence,
  });

  await audit({
    entityType: "SAVINGS_LEDGER",
    entityId: record.id,
    action: "CREATE_SAVINGS",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: { type: record.type, status: record.status },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  return success({ record }, 201);
}, { rateLimit: "api" });
