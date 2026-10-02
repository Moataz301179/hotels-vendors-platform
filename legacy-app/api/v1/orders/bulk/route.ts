import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error, audit, requirePermission } from "@/lib/api-utils";
import { z } from "zod";

const BulkOrderSchema = z.object({
  ids: z.array(z.string().cuid()).min(1, "At least one order ID required").max(50, "Maximum 50 orders per bulk action"),
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().max(1000).optional(),
});

type ApprovalAction = "APPROVED" | "REJECTED" | "ESCALATED" | "ADMIN_OVERRIDE";

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "order:approve");

  const body = await request.json();
  const data = BulkOrderSchema.parse(body);

  const user = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!user) return error("User not found", 404);

  const canApprove = ["OWNER", "REGIONAL_GM", "GM", "FINANCIAL_CONTROLLER", "DEPARTMENT_HEAD"].includes(user.role);
  if (!canApprove && !user.canOverride) {
    return error("Insufficient permissions to bulk-approve orders", 403);
  }

  const orders = await prisma.order.findMany({
    where: { id: { in: data.ids }, tenantId: auth.tenantId },
    select: { id: true, status: true, orderNumber: true },
  });

  if (orders.length === 0) return error("No matching orders found for this tenant", 404);

  const foundIds = new Set(orders.map((o) => o.id));
  const missingIds = data.ids.filter((id) => !foundIds.has(id));

  const targetStatus = data.action === "APPROVE" ? "APPROVED" : "REJECTED";
  const approvalAction = targetStatus as ApprovalAction;

  const skippable = data.action === "REJECT"
    ? ["REJECTED", "CANCELLED", "DELIVERED"]
    : ["APPROVED", "CONFIRMED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];

  const actionable = orders.filter((o) => !skippable.includes(o.status));
  const skipped = orders.filter((o) => skippable.includes(o.status));

  const results = await prisma.$transaction(async (tx) => {
    const processed: { id: string; orderNumber: string; status: string }[] = [];

    for (const order of actionable) {
      await tx.order.update({
        where: { id: order.id },
        data: { status: targetStatus as never },
      });

      await tx.orderApproval.create({
        data: {
          orderId: order.id,
          approverId: auth.userId,
          action: approvalAction,
          reason: data.reason,
          beforeState: JSON.stringify({ status: order.status }),
          afterState: JSON.stringify({ status: targetStatus }),
        },
      });

      processed.push({ id: order.id, orderNumber: order.orderNumber, status: targetStatus });
    }

    return processed;
  });

  await audit({
    entityType: "ORDER",
    entityId: `BULK_${data.action}`,
    action: `BULK_ORDER_${data.action}`,
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: user.role,
    afterState: {
      action: data.action,
      requestedIds: data.ids,
      processed: results.map((r) => r.orderNumber),
      skipped: skipped.map((s) => s.orderNumber),
      missing: missingIds,
    },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  return success({
    processed: results.length,
    skipped: skipped.length,
    missing: missingIds.length,
    details: results,
    skippedOrders: skipped.map((s) => ({ id: s.id, orderNumber: s.orderNumber, status: s.status })),
    missingIds,
  });
}, { rateLimit: "api" });
