import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, validateBody, validateQuery, success, error, audit, requirePermission } from "@/lib/api-utils";
import { OpportunityCreateSchema, OpportunityUpdateSchema } from "@/lib/zod";
import { getOpportunities } from "@/lib/opportunity/engine";

// Manually define pagination query schema here to avoid dependency issues
import { z } from "zod";

const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "opportunity:read");
  const tenantId = auth.tenantId;
  const query = validateQuery(PaginationSchema, request.nextUrl.searchParams);
  const filters = {
    type: request.nextUrl.searchParams.get("type") ?? undefined,
    status: request.nextUrl.searchParams.get("status") ?? undefined,
    ownerId: request.nextUrl.searchParams.get("ownerId") ?? undefined,
    affectedSupplierId: request.nextUrl.searchParams.get("affectedSupplierId") ?? undefined,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    search: query.search,
  };
  const result = await getOpportunities(tenantId, filters, prisma);
  return success(result);
}, { rateLimit: "api" });

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "opportunity:create");
  const tenantId = auth.tenantId;
  const body = await request.json();
  const data = validateBody(OpportunityCreateSchema, body);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opportunity = await (prisma as any).opportunity.create({
    data: {
      tenantId,
      type: data.type,
      status: "DETECTED",
      title: data.title,
      description: data.description,
      evidence: data.evidence ?? undefined,
      baseline: data.baseline,
      currentValue: data.currentValue,
      potentialImpact: data.potentialImpact,
      confidence: data.confidence,
      recommendedAction: data.recommendedAction,
      affectedSupplierId: data.affectedSupplierId,
      affectedProductId: data.affectedProductId,
      affectedCategory: data.affectedCategory,
      ownerId: data.ownerId,
    },
    include: {
      affectedSupplier: { select: { id: true, name: true } },
      affectedProduct: { select: { id: true, name: true, sku: true } },
      owner: { select: { id: true, name: true, email: true } },
    },
  });
  await audit({
    entityType: "OPPORTUNITY",
    entityId: opportunity.id,
    action: "CREATE_OPPORTUNITY",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: { type: opportunity.type, title: opportunity.title },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });
  return success({ opportunity }, 201);
}, { rateLimit: "api" });
