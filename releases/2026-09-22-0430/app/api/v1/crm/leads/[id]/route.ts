import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiRoute,
  authenticate,
  requirePermission,
  success,
  error,
  audit,
} from "@/lib/api-utils";
import { z } from "zod";

const UpdateLeadSchema = z.object({
  status: z
    .enum([
      "DISCOVERED",
      "ENRICHED",
      "CONTACTED",
      "RESPONDED",
      "QUALIFIED",
      "MEETING_SCHEDULED",
      "PROPOSAL_SENT",
      "NEGOTIATING",
      "CONVERTED",
      "LOST",
      "PAUSED",
    ])
    .optional(),
  priority: z.number().int().min(1).max(10).optional(),
  tier: z.enum(["UNRATED", "BRONZE", "SILVER", "GOLD", "PLATINUM"]).optional(),
  enrichment: z.string().max(5000).optional(),
  trustSignals: z.string().max(5000).optional(),
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  governorate: z.string().max(100).optional(),
  convertedToId: z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export const GET = apiRoute(async (request: NextRequest, ctx: RouteContext) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "crm:read");

  const { id } = await ctx.params;

  const lead = await prisma.lead.findFirst({
    where: { id, tenantId: auth.tenantId },
    include: {
      outreachLogs: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!lead) return error("Lead not found", 404);
  return success(lead);
});

export const PATCH = apiRoute(async (request: NextRequest, ctx: RouteContext) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "crm:write");

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("Invalid JSON payload", 400);
  }

  const data = UpdateLeadSchema.parse(body);

  const existing = await prisma.lead.findFirst({
    where: { id, tenantId: auth.tenantId },
  });
  if (!existing) return error("Lead not found", 404);

  const beforeState = {
    status: existing.status,
    priority: existing.priority,
    tier: existing.tier,
  };

  const updateData: Record<string, unknown> = { ...data };

  if (data.status === "CONVERTED" && !existing.convertedAt) {
    updateData.convertedAt = new Date();
  }

  const lead = await prisma.lead.update({
    where: { id },
    data: updateData,
  });

  await audit({
    entityType: "Lead",
    entityId: lead.id,
    action: "LEAD_UPDATED",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    beforeState,
    afterState: { status: lead.status, priority: lead.priority, tier: lead.tier },
  });

  return success(lead);
});
