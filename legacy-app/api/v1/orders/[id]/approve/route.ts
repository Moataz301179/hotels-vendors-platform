import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordApproval } from "@/lib/auth/authority-matrix";
import { apiRoute, authenticate, success, error, audit, requirePermission, requireIdempotencyKey, completeIdempotency } from "@/lib/api-utils";
import { z } from "zod";

const ApproveSchema = z.object({
  action: z.enum(["APPROVED", "REJECTED", "ESCALATED"]),
  reason: z.string().optional(),
});

export const POST = apiRoute(async (request: NextRequest, { params }: { params?: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "order:approve");
  const resolved = await params;
  if (!resolved) return error("Missing parameter", 400);
  const { id } = resolved;
  const body = await request.json();
  const data = ApproveSchema.parse(body);

  const idempotencyKey = await requireIdempotencyKey(request, {
    userId: auth.userId,
    action: `APPROVE_ORDER_${data.action}`,
    amount: 0,
  });

  const record = await prisma.order.findUnique({ where: { id }, select: { tenantId: true, hotelId: true, requesterId: true } });
  if (!record || record.tenantId !== auth.tenantId) return error("Not found", 404);

  // Self-approval guard: requester cannot approve their own order
  if (record.requesterId === auth.userId) {
    return error("You cannot approve or reject your own order. Escalate to a superior.", 403);
  }

  const user = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!user) {
    return error("User not found", 404);
  }

  // Permission check: only certain roles can approve
  const canApprove = ["OWNER", "REGIONAL_GM", "GM", "FINANCIAL_CONTROLLER", "DEPARTMENT_HEAD"].includes(user.role);
  if (!canApprove && !user.canOverride) {
    return error("Insufficient permissions to approve orders", 403);
  }

  await recordApproval(id, auth.userId, auth.tenantId, data.action, data.reason);

  completeIdempotency(idempotencyKey, `ORDER_${data.action}:${id}`);

  await audit({
    entityType: "ORDER",
    entityId: id,
    action: `ORDER_${data.action}`,
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: user.role,
    afterState: { action: data.action, reason: data.reason },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  return success({ message: `Order ${data.action.toLowerCase()}`, orderId: id });
}, { rateLimit: "api" });
