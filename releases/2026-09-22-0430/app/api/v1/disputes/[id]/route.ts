import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  apiRoute,
  authenticate,
  validateBody,
  success,
  requirePermission,
  audit,
} from "@/lib/api-utils";

const UpdateDisputeSchema = z.object({
  status: z.enum(["OPEN", "UNDER_INVESTIGATION", "ESCALATED_TO_CPA", "RESOLVED", "CLOSED"]).optional(),
  resolution: z.string().optional(),
  liability: z.enum(["HOTEL", "SUPPLIER", "LOGISTICS", "PLATFORM", "SPLIT_LIABILITY"]).optional(),
});

export const GET = apiRoute(async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "disputes:read");

  const { id } = await ctx.params;

  const dispute = await prisma.dispute.findFirst({
    where: { id, tenantId: auth.tenantId },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          hotel: { select: { id: true, name: true, taxId: true } },
          supplier: { select: { id: true, name: true, taxId: true } },
        },
      },
    },
  });

  if (!dispute) {
    return success({ error: "Dispute not found" }, 404);
  }

  return success(dispute);
});

export const PUT = apiRoute(async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "disputes:update");

  const { id } = await ctx.params;
  const body = await request.json();
  const input = validateBody(UpdateDisputeSchema, body);

  const existing = await prisma.dispute.findFirst({
    where: { id, tenantId: auth.tenantId },
  });

  if (!existing) {
    return success({ error: "Dispute not found" }, 404);
  }

  const updated = await prisma.dispute.update({
    where: { id },
    data: {
      ...(input.status && { status: input.status }),
      ...(input.resolution && { resolution: input.resolution }),
      ...(input.liability && { liability: input.liability }),
      ...(input.status === "RESOLVED" && { resolvedAt: new Date() }),
    },
  });

  await audit({
    entityType: "DISPUTE",
    entityId: id,
    action: "DISPUTE_UPDATED",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    beforeState: {
      status: existing.status,
      resolution: existing.resolution,
      liability: existing.liability,
    },
    afterState: {
      status: updated.status,
      resolution: updated.resolution,
      liability: updated.liability,
    },
  });

  return success(updated);
});
