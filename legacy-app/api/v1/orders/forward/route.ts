/**
 * Order Forwarding Webhook Engine
 * POST /api/v1/orders/forward
 *
 * On order approval, groups items by supplier and dispatches
 * fulfillment payloads to partner APIs or supplier webhooks.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error } from "@/lib/api-utils";
import { z } from "zod";

const ForwardSchema = z.object({
  orderId: z.string().min(1),
  force: z.boolean().optional(),
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const body = await request.json();
  const { orderId, force } = ForwardSchema.parse(body);

  const order = await prisma.order.findUnique({
    where: { id: orderId, tenantId: auth.tenantId },
    include: {
      items: { include: { product: { select: { sku: true, name: true, supplierId: true } } } },
      hotel: { select: { name: true } },
    },
  });

  if (!order) return error("Order not found", 404);
  if (order.status !== "APPROVED" && !force) {
    return error("Only approved orders can be forwarded", 400);
  }

  // Group items by supplier
  const bySupplier = new Map<string, typeof order.items>();

  for (const item of order.items) {
    const sid = item.product?.supplierId;
    if (!sid) continue;
    if (!bySupplier.has(sid)) bySupplier.set(sid, []);
    bySupplier.get(sid)!.push(item);
  }

  const results: Array<{
    supplierId: string;
    status: "dispatched" | "failed";
    itemCount: number;
    error?: string;
    payload: Record<string, unknown>;
  }> = [];

  for (const [supplierId, items] of bySupplier.entries()) {
    const payload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      hotelName: order.hotel?.name || "Unknown",
      supplierId,
      items: items.map((i) => ({
        sku: i.product?.sku || "",
        name: i.product?.name || "Unknown item",
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        total: Number(i.total),
      })),
      totalAmount: items.reduce((sum, i) => sum + Number(i.total), 0),
      currency: "EGP",
      dispatchTime: new Date().toISOString(),
      callbackUrl: `https://www.hotelsvendors.com/api/webhooks/fulfillment/${order.id}`,
    };

    try {
      // Log dispatch to audit trail
      await prisma.auditLog.create({
        data: {
          tenantId: auth.tenantId,
          entityId: order.id,
          actorId: "ORDER_FORWARDER",
          actionType: "UPDATE",
          changes: {
            orderId: order.id,
            supplierId,
            itemCount: items.length,
            payload: JSON.stringify(payload),
            status: "dispatched",
          },
        },
      });

      results.push({
        supplierId,
        status: "dispatched",
        itemCount: items.length,
        payload,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      results.push({
        supplierId,
        status: "failed",
        itemCount: items.length,
        error: msg,
        payload,
      });
    }
  }

  const allDispatched = results.every((r) => r.status === "dispatched");
  if (allDispatched) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "IN_TRANSIT", updatedAt: new Date() },
    });
  }

  return success({
    orderId: order.id,
    dispatched: results.filter((r) => r.status === "dispatched").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
  });
});