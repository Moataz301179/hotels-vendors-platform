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

const LogOutreachSchema = z.object({
  channel: z.enum(["EMAIL", "PHONE", "MEETING", "LINKEDIN", "WHATSAPP", "OTHER"]),
  messageType: z.enum(["COLD", "FOLLOW_UP", "DEMO", "PROPOSAL", "CHECK_IN", "REMARKETING", "OTHER"]),
  subject: z.string().max(200).optional(),
  body: z.string().max(5000).optional(),
  recipientEmail: z.string().email().max(255).optional(),
  recipientPhone: z.string().max(50).optional(),
  agentName: z.string().max(100).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export const POST = apiRoute(async (request: NextRequest, ctx: RouteContext) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "crm:write");

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("Invalid JSON payload", 400);
  }

  const data = LogOutreachSchema.parse(body);

  const lead = await prisma.lead.findFirst({
    where: { id, tenantId: auth.tenantId },
  });
  if (!lead) return error("Lead not found", 404);

  const outreachLog = await prisma.outreachLog.create({
    data: {
      channel: data.channel,
      messageType: data.messageType,
      subject: data.subject,
      body: data.body,
      leadId: id,
      leadName: lead.name,
      recipientEmail: data.recipientEmail,
      recipientPhone: data.recipientPhone,
      sentByAgent: auth.userId,
      agentName: data.agentName || "Manual",
    },
  });

  await prisma.lead.update({
    where: { id },
    data: {
      lastContactAt: new Date(),
      contactCount: { increment: 1 },
      status: lead.status === "DISCOVERED" ? "CONTACTED" : lead.status,
    },
  });

  await audit({
    entityType: "OutreachLog",
    entityId: outreachLog.id,
    action: "OUTREACH_LOGGED",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    afterState: { channel: data.channel, messageType: data.messageType, leadId: id },
  });

  return success(outreachLog, 201);
});
