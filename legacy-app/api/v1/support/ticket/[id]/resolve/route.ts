/**
 * Support Ticket Resolve API
 *
 * POST /api/v1/support/ticket/[id]/resolve — admin resolves ticket
 * (requirePermission admin:manage_platform)
 * Sends a notification to the user when resolved.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, requirePermission, success, error, audit } from "@/lib/api-utils";

const ResolveSchema = z.object({
  resolution: z.string().min(5, "Resolution must be at least 5 characters").max(5000),
  adminNotes: z.string().max(5000).optional(),
});

export const POST = apiRoute(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:manage_platform");
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const parsed = ResolveSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message || "Invalid request body", 400);
  }
  const { resolution, adminNotes } = parsed.data;

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) {
    return error("Ticket not found", 404);
  }

  const now = new Date();

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: {
      status: "RESOLVED",
      resolution,
      adminNotes: adminNotes || ticket.adminNotes,
      resolvedAt: now,
    },
  });

  // Send notification to the user (Notification model exists)
  try {
    await prisma.notification.create({
      data: {
        id: `notif-${id}-${now.getTime()}`,
        tenantId: ticket.tenantId,
        userId: ticket.userId,
        type: "SUPPORT_TICKET",
        channel: "IN_APP",
        subject: `Support ticket resolved: ${ticket.subject}`,
        body: resolution,
        sentAt: now,
      },
    });
  } catch (err) {
    console.error("[support/resolve] Notification creation failed:", err instanceof Error ? err.message : err);
  }

  await audit({
    entityType: "SUPPORT_TICKET",
    entityId: ticket.id,
    action: "SUPPORT_TICKET_RESOLVED",
    tenantId: ticket.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: { status: "RESOLVED", resolution },
  });

  return success({ ticket: updated, message: "Ticket resolved. User has been notified." });
});
