import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error, requirePermission } from "@/lib/api-utils";
import { z } from "zod";

const ScanSchema = z.object({
  barcode: z.string().min(1),
  orderId: z.string().min(1),
  quantity: z.number().int().positive().optional(),
  scannedAt: z.string().datetime().optional(),
});

/**
 * Scan goods at the dock and create a Goods Receipt Note (GRN).
 * Quick-scan entry point: associates a barcode scan with an incoming purchase order.
 */
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "order:update");

  const body = await request.json();
  const data = ScanSchema.parse(body);

  const order = await prisma.order.findUnique({
    where: { id: data.orderId, tenantId: auth.tenantId },
    include: { items: { include: { product: true } } },
  });

  if (!order) return error("Order not found", 404);
  if (order.tenantId !== auth.tenantId) return error("Order not found", 404);

  const quantity = data.quantity ?? order.items.reduce((s, i) => s + Number(i.quantity), 0);

  // Generate GRN number
  const grnCount = await prisma.goodsReceiptNote.count({ where: { tenantId: auth.tenantId } });
  const grnNumber = `GRN-${String(grnCount + 1).padStart(6, "0")}`;

  const grn = await prisma.goodsReceiptNote.create({
    data: {
      grnNumber,
      status: "PENDING",
      orderId: order.id,
      hotelId: order.hotelId,
      supplierId: order.supplierId,
      tenantId: auth.tenantId,
      receivedById: auth.userId,
      notes: `Quick scan: ${data.barcode}`,
      receivedAt: data.scannedAt ? new Date(data.scannedAt) : new Date(),
    },
  });

  return success({
    id: grn.id,
    grnNumber: grn.grnNumber,
    orderId: grn.orderId,
    quantity,
    barcode: data.barcode,
    status: grn.status,
    scannedAt: grn.receivedAt.toISOString(),
  });
});
