import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { GrnCreateSchema, PaginationSchema } from "@/lib/zod";
import { apiRoute, authenticate, validateBody, validateQuery, success, error, requirePermission } from "@/lib/api-utils";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "order:read");
  const tenantId = auth.tenantId;
  const query = validateQuery(PaginationSchema, request.nextUrl.searchParams);

  const where: Record<string, unknown> = { tenantId };

  if (query.search) {
    where.grnNumber = { contains: query.search };
  }

  const [grns, total] = await Promise.all([
    prisma.goodsReceiptNote.findMany({
      where,
      orderBy: { [query.sortBy || "createdAt"]: query.sortOrder },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: {
        order: { select: { id: true, orderNumber: true } },
        hotel: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        lineItems: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    }),
    prisma.goodsReceiptNote.count({ where }),
  ]);

  return success({ grns, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } });
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "order:update");
  const body = await request.json();
  const data = validateBody(GrnCreateSchema, body);

  const user = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!user) return error("User account not found", 404);

  const hotelId = data.hotelId || user.hotelId;
  if (!hotelId) return error("No hotel associated with user", 400);

  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: { items: true },
  });
  if (!order) return error("Order not found", 404);

  const tenantId = auth.tenantId;
  if (order.tenantId !== tenantId) return error("Order not found", 404);

  const supplierId = data.supplierId || order.supplierId;

  // Validate line items reference the order's actual items
  const orderItemIds = order.items.map((i) => i.id);
  for (const li of data.lineItems) {
    if (!orderItemIds.includes(li.orderItemId)) {
      return error(`Order item ${li.orderItemId} not found in order`, 400);
    }
    if (li.receivedQuantity < 0 || li.acceptedQuantity < 0) {
      return error("Quantities cannot be negative", 400);
    }
    if (li.acceptedQuantity > li.receivedQuantity) {
      return error("Accepted quantity cannot exceed received quantity", 400);
    }
  }

  // Generate GRN number
  const grnCount = await prisma.goodsReceiptNote.count({ where: { tenantId } });
  const grnNumber = `GRN-${String(grnCount + 1).padStart(6, "0")}`;

  // Determine GRN status from line items
  const allAccepted = data.lineItems.every((li) => li.acceptedQuantity === li.receivedQuantity && li.rejectedQuantity === 0);
  const allRejected = data.lineItems.every((li) => li.acceptedQuantity === 0);
  const grnStatus = allRejected ? "REJECTED" : allAccepted ? "ACCEPTED" : "PARTIALLY_ACCEPTED";

  const grn = await prisma.$transaction(async (tx) => {
    const created = await tx.goodsReceiptNote.create({
      data: {
        grnNumber,
        status: grnStatus as never,
        orderId: data.orderId,
        hotelId,
        supplierId,
        tenantId,
        receivedById: auth.userId,
        warehouseLocation: data.warehouseLocation,
        deliveryNoteRef: data.deliveryNoteRef,
        vehiclePlate: data.vehiclePlate,
        notes: data.notes,
        receivedAt: new Date(),
        lineItems: {
          create: data.lineItems.map((li) => ({
            orderItemId: li.orderItemId,
            productId: li.productId,
            orderedQuantity: li.orderedQuantity,
            receivedQuantity: li.receivedQuantity,
            acceptedQuantity: li.acceptedQuantity,
            rejectedQuantity: li.rejectedQuantity,
            rejectionReason: li.rejectionReason,
            batchNumber: li.batchNumber,
            expiryDate: li.expiryDate ? new Date(li.expiryDate) : undefined,
            conditionNotes: li.conditionNotes,
          })),
        },
      },
      include: { lineItems: true },
    });

    // Update order items' receivedQuantity
    for (const li of data.lineItems) {
      await tx.orderItem.update({
        where: { id: li.orderItemId },
        data: { receivedQuantity: { increment: li.acceptedQuantity } },
      });
    }

    // Update order status based on GRN
    const allItemsReceived = order.items.every((i) => {
      const grnAccepted = data.lineItems
        .filter((li) => li.orderItemId === i.id)
        .reduce((sum, li) => sum + li.acceptedQuantity, 0);
      return (i.receivedQuantity ?? 0) + grnAccepted >= i.quantity;
    });

    if (allItemsReceived) {
      await tx.order.update({ where: { id: order.id }, data: { status: "DELIVERED" } });
    } else {
      await tx.order.update({ where: { id: order.id }, data: { status: "PARTIALLY_DELIVERED" } });
    }

    // Audit log
    await appendAuditEntry({
      tenantId,
      entityName: "GOODS_RECEIPT_NOTE",
      entityId: created.id,
      actionType: "CREATE",
      actorId: auth.userId,
      changes: { after: { grnNumber, status: grnStatus, orderId: data.orderId, lineItemCount: data.lineItems.length } },
    });

    return created;
  });

  return success(grn, 201);
});
