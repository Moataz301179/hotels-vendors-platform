import { NextRequest } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { apiRoute, authenticate, validateBody, success, error, audit, requirePermission } from "../../../../../lib/api-utils";
import { OpportunityUpdateSchema } from "../../../../../lib/zod";

export const GET = apiRoute(async (request: NextRequest, { params }: { params?: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "opportunity:read");
  const resolved = await params;
  if (!resolved) return error("Missing parameter", 400);
  const { id } = resolved;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const record = await (prisma as any).opportunity.findFirst({
    where: { id, tenantId: auth.tenantId, deletedAt: null },
    include: {
      affectedSupplier: { select: { id: true, name: true } },
      affectedProduct: { select: { id: true, name: true, sku: true } },
      owner: { select: { id: true, name: true, email: true } },
    },
  });
  if (!record) return error("Opportunity not found", 404);
  return success({ opportunity: record });
}, { rateLimit: "api" });

export const PATCH = apiRoute(async (request: NextRequest, { params }: { params?: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "opportunity:update");
  const resolved = await params;
  if (!resolved) return error("Missing parameter", 400);
  const { id } = resolved;
  const body = await request.json();
  const data = validateBody(OpportunityUpdateSchema, body);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = await (prisma as any).opportunity.findFirst({
    where: { id, tenantId: auth.tenantId, deletedAt: null },
  });
  if (!existing) return error("Opportunity not found", 404);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated = await (prisma as any).opportunity.update({
    where: { id },
    data,
    include: {
      affectedSupplier: { select: { id: true, name: true } },
      affectedProduct: { select: { id: true, name: true, sku: true } },
      owner: { select: { id: true, name: true, email: true } },
    },
  });
  await audit({
    entityType: "OPPORTUNITY",
    entityId: id,
    action: "UPDATE_OPPORTUNITY",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    beforeState: { status: existing.status },
    afterState: data,
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });
  return success({ opportunity: updated });
}, { rateLimit: "api" });
