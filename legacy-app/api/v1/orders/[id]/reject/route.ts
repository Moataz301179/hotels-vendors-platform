import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordApproval } from "@/lib/auth/authority-matrix";
import { apiRoute, authenticate, success, error, audit, requirePermission } from "@/lib/api-utils";
import { z } from "zod";

const RejectSchema = z.object({
  reason: z.string().min(3).max(1000),
});

type ApprovalAction = "APPROVED" | "REJECTED" | "ESCALATED" | "ADMIN_OVERRIDE";

export const POST = apiRoute(async (request: NextRequest, { params }: { params?: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "order:approve");

  const resolved = await params;
  if (!resolved) return error("Missing parameter", 400);
  const { id } = resolved;

  const body = await request.json();
  const { reason } = RejectSchema.parse(body);

  const record = await prisma.order.findUnique({
    where: { id },
    select: { tenantId: true, status: true, orderNumber: true },
  });
  if (!record || record.tenantId !== auth.tenantId) return error("Not found", 404);

  if (record.status === "REJECTED") {
    return error("Order is already rejected", 400);
  }
  if (!["PENDING_APPROVAL", "APPROVED"].includes(record.status)) {
    return error(`Cannot reject order in status ${record.status}`, 400);
  }

  const orderBefore = await prisma.order.findUnique({
    where: { id },
    select: { status: true, paymentGuaranteed: true, paymentGuaranteeMethod: true },
  });

  await recordApproval(
    id,
    auth.userId,
    auth.tenantId,
    "REJECTED" as ApprovalAction,
    reason,
  );

  await audit({
    entityType: "ORDER",
    entityId: id,
    action: "ORDER_REJECTED",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    beforeState: orderBefore ? { status: orderBefore.status } : null,
    afterState: { status: "REJECTED", reason },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  return success({ message: "Order rejected", orderId: id });
}, { rateLimit: "api" });
