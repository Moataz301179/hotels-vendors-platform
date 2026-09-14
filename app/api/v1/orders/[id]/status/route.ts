import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { validateStatusTransition, getTransitionGate } from "@/lib/auth/state-machine";
import { evaluateAuthority } from "@/lib/auth/authority-matrix";
import { reserveCredit } from "@/lib/credit-gate";
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
      where: { id, tenantId: auth.tenantId },
      include: {
        items: { include: { product: true } },
        invoices: true,
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

    const beforeState = { status: order.status, paymentGuaranteed: order.paymentGuaranteed };

    // DELIVERED → auto-generate Invoice
    if (requestedStatus === "DELIVERED") {
      const existingInvoice = order.invoices[0];
      if (!existingInvoice) {
        const deliveryDate = order.deliveryDate ?? new Date();
        const dueDate = new Date(deliveryDate);
        dueDate.setDate(dueDate.getDate() + 30);

        const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

        await prisma.invoice.create({
          data: {
            invoiceNumber,
            orderId: order.id,
            hotelId: order.hotelId,
            supplierId: order.supplierId,
            tenantId: auth.tenantId,
            issueDate: new Date(),
            dueDate,
            subtotal: order.subtotal ?? 0,
            vatRate: 0.14,
            vatAmount: order.vatAmount ?? 0,
            total: order.total ?? 0,
            status: "DRAFT",
            paymentStatus: "UNPAID",
          },
        });

        // Reserve credit: order drops out of uncaptured set, so creditUsed must absorb it
        await reserveCredit(order.hotelId, Number(order.total ?? 0));
      }
    }

    // Authority evaluation for payment guarantee check
    const evaluation = await evaluateAuthority(order.id, {
      userId: auth.userId,
      userRole: auth.platformRole === "HOTEL" ? "DEPARTMENT_HEAD" : "OWNER",
      tenantId: auth.tenantId,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    // Atomic status update with row locking to prevent race conditions
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Lock the row to prevent concurrent updates
      const locked = await tx.$queryRaw<Array<{ id: string; status: string; paymentGuaranteed: boolean }>>`
        SELECT "id", "status", "paymentGuaranteed"
        FROM "Order"
        WHERE "id" = ${id}
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

      return tx.order.update({
        where: { id },
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
