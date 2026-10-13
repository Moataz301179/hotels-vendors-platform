import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { validateStatusTransition, getTransitionGate } from "@/lib/auth/state-machine";
import { evaluateAuthority, releaseGuaranteeReservations } from "@/lib/auth/authority-matrix";
import { randomUUID } from "node:crypto";
import {
  apiRoute,
  authenticate,
  validateBody,
  success,
  error,
  audit,
  requirePermission,
} from "@/lib/api-utils";

const StatusTransitionSchema = z.object({
  status: z.enum([
    "APPROVED",
    "CONFIRMED",
    "IN_TRANSIT",
    "DELIVERED",
    "CANCELLED",
    "DISPUTED",
  ]),
});

export const POST = apiRoute(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const auth = await authenticate(request);
    await requirePermission(auth, "order:update");
    const body = await request.json();
    const data = validateBody(StatusTransitionSchema, body);
    const requestedStatus = data.status as OrderStatus;

    const order = await prisma.order.findFirst({
      where: { id, tenantId: auth.tenantId, deletedAt: null },
      include: {
        items: { include: { product: true } },
        invoices: true,
        tripStops: {
          where: { tenantId: auth.tenantId, deletedAt: null },
          select: { deliveryProofs: { select: { id: true }, take: 1 } },
        },
        goodsReceiptNotes: {
          where: { tenantId: auth.tenantId, deletedAt: null },
          select: { status: true },
        },
      },
    });

    if (!order) {
      return error("Order not found", 404);
    }

    // Validate transition is legal
    const transition = validateStatusTransition(
      order.status as OrderStatus,
      requestedStatus
    );
    if (!transition.valid) {
      return error(transition.reason || "Invalid status transition", 400);
    }

    // Check transition gates (payment guarantee, etc.)
    const gate = getTransitionGate(order.status as OrderStatus, requestedStatus);
    if (gate) {
      if (gate.requires.paymentGuarantee && !order.paymentGuaranteed) {
        return error(
          `Transition ${order.status} → ${requestedStatus} requires payment guarantee`,
          400
        );
      }
    }
    if (requestedStatus === "DELIVERED") {
      if (!order.tripStops.some((stop) => stop.deliveryProofs.length > 0)) return error("Carrier proof of delivery is required before delivery completion", 409);
      if (!order.goodsReceiptNotes.some((grn) => grn.status === "ACCEPTED" || grn.status === "PARTIALLY_ACCEPTED")) return error("Hotel goods receipt is required before delivery completion", 409);
    }

    const beforeState = { status: order.status, paymentGuaranteed: order.paymentGuaranteed };

    const user = await prisma.user.findFirst({ where: { id: auth.userId, tenantId: auth.tenantId }, select: { role: true } });
    if (!user) return error("User not found", 404);
    // Authority evaluation for payment guarantee check
    const evaluation = await evaluateAuthority(order.id, {
      userId: auth.userId,
      userRole: user.role,
      tenantId: auth.tenantId,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    if (["APPROVED", "CONFIRMED", "IN_TRANSIT", "DELIVERED"].includes(requestedStatus) && (!evaluation.canProceed || (evaluation.routeToRole && evaluation.routeToRole !== user.role))) return error(evaluation.reason ?? "Authority Matrix requirements are not satisfied", 403);

    // Atomic status update with row locking to prevent race conditions
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Lock the row to prevent concurrent updates
      const locked = await tx.$queryRaw<Array<{ id: string; status: string; paymentGuaranteed: boolean }>>`
        SELECT "id", "status", "paymentGuaranteed"
        FROM "Order"
        WHERE "id" = ${id} AND "tenantId" = ${auth.tenantId}
        FOR UPDATE
      `;

      if (locked.length === 0) {
        throw new Error("Order not found during atomic update");
      }

      // Re-validate with locked state
      const reTransition = validateStatusTransition(
        locked[0].status as OrderStatus,
        requestedStatus
      );
      if (!reTransition.valid) {
        throw new Error(reTransition.reason || "Invalid status transition (concurrent modification)");
      }
      if (["CONFIRMED", "IN_TRANSIT", "DELIVERED"].includes(requestedStatus) && !locked[0].paymentGuaranteed) throw new Error("Payment guarantee required");
      if (requestedStatus === "CANCELLED") await releaseGuaranteeReservations(tx, id, auth.tenantId, auth.userId);
      if (requestedStatus === "DELIVERED") {
        const invoice = await tx.invoice.findFirst({ where: { orderId: id, tenantId: auth.tenantId } });
        if (!invoice) await tx.invoice.create({ data: { invoiceNumber: `INV-${randomUUID()}`, orderId: id, hotelId: order.hotelId, supplierId: order.supplierId, tenantId: auth.tenantId, currency: order.currency, issueDate: new Date(), subtotal: order.subtotal ?? 0, vatRate: 0.14, vatAmount: order.vatAmount ?? 0, total: order.total ?? 0, status: "DRAFT", paymentStatus: "UNPAID" } });
      }

      return tx.order.update({
        where: { id, tenantId: auth.tenantId },
        data: { status: requestedStatus },
        include: {
          items: { include: { product: true } },
          hotel: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
          invoices: true,
        },
      });
    });

    // Audit log with before/after state
    await audit({
      entityType: "ORDER",
      entityId: order.id,
      action: `STATUS_${requestedStatus}`,
      tenantId: auth.tenantId,
      actorId: auth.userId,
      actorRole: auth.platformRole,
      beforeState,
      afterState: {
        status: requestedStatus,
        paymentGuaranteed: updatedOrder.paymentGuaranteed,
        evaluation: evaluation.action,
      },
      ipAddress: request.headers.get("x-forwarded-for") || null,
      userAgent: request.headers.get("user-agent"),
    });

    return success({ order: updatedOrder, evaluation });
  },
  { rateLimit: "api" }
);
