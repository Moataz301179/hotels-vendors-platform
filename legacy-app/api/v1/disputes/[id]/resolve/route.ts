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

const ResolveDisputeSchema = z.object({
  resolution: z.string().min(5, "Resolution must be at least 5 characters"),
  liability: z.enum(["HOTEL", "SUPPLIER", "LOGISTICS", "PLATFORM", "SPLIT_LIABILITY"]),
  refundAmount: z.number().min(0).optional(),
});

export const POST = apiRoute(async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "disputes:resolve");

  const { id } = await ctx.params;
  const body = await request.json();
  const input = validateBody(ResolveDisputeSchema, body);

  const existing = await prisma.dispute.findFirst({
    where: { id, tenantId: auth.tenantId },
  });

  if (!existing) {
    return success({ error: "Dispute not found" }, 404);
  }

  if (existing.status === "RESOLVED" || existing.status === "CLOSED") {
    return success({ error: `Dispute is already ${existing.status}` }, 400);
  }

  const updated = await prisma.dispute.update({
    where: { id },
    data: {
      status: "RESOLVED",
      resolution: input.resolution,
      liability: input.liability,
      resolvedAt: new Date(),
    },
  });

  await audit({
    entityType: "DISPUTE",
    entityId: id,
    action: "DISPUTE_RESOLVED",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    beforeState: {
      status: existing.status,
      resolution: existing.resolution,
      liability: existing.liability,
    },
    afterState: {
      status: "RESOLVED",
      resolution: input.resolution,
      liability: input.liability,
      refundAmount: input.refundAmount,
      resolvedBy: auth.userId,
      resolvedAt: new Date().toISOString(),
    },
  });

  return success(updated);
});
