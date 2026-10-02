/**
 * Multi-Supplier Checkout API
 *
 * Splits cart items by supplier and creates one Order per supplier.
 *
 * ATOMICITY: The entire checkout flow is wrapped in a Prisma transaction.
 * Orders are created and the buyer's cart is cleared in the same atomic
 * operation. If the server crashes mid-checkout, the database rolls back
 * completely — the cart is not cleared without orders being created,
 * and no orphan orders exist without a cleared cart.
 *
 * SAFETY: Each checkout run is gated by:
 *   1. Credit limit check (checkCreditLimit)
 *   2. Atomic credit capture inside the transaction
 *   3. Authority Matrix evaluation for every created order
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiRoute,
  authenticate,
  requirePermission,
  requireIdempotencyKey,
  completeIdempotency,
  success,
  error,
  audit,
} from "@/lib/api-utils";
import { checkCreditLimit } from "@/lib/credit-gate";
import { evaluateAuthority } from "@/lib/auth/authority-matrix";
import { z } from "zod";

const CheckoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().min(1),
      unitPrice: z.number(),
      notes: z.string().optional(),
    })
  ),
  address: z.object({
    label: z.string().optional(),
    address: z.string(),
    city: z.string(),
    governorate: z.string(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
  shippingMethod: z.enum(["express", "standard", "self"]),
  paymentMethod: z.string(),
  poNumber: z.string().optional(),
  costCenter: z.string().optional(),
  procurementNotes: z.string().optional(),
});

function generateOrderNumber(): string {
  const date = new Date();
  const prefix = "HV";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}${month}${day}-${random}`;
}

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "order:checkout");
  const body = await request.json();
  const data = CheckoutSchema.parse(body);

  // Get product details with supplier info — TENANT SCOPED
  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, tenantId: auth.tenantId },
    include: { supplier: { select: { id: true, name: true } } },
  });

  if (products.length !== data.items.length) {
    return error("Some products were not found", 400);
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Group items by supplier
  const supplierGroups = new Map<string, typeof data.items>();
  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product) continue;
    const sid = product.supplierId;
    if (!supplierGroups.has(sid)) {
      supplierGroups.set(sid, []);
    }
    supplierGroups.get(sid)!.push(item);
  }

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: { hotel: true },
  });

  if (!user) {
    return error("User not found", 404);
  }

  const hotelId = user.hotelId;
  if (!hotelId) {
    return error("No hotel associated with user", 400);
  }

  // Pre-calculate grand total across all suppliers for credit gate
  let grandTotal = 0;
  const orderTotals = new Map<string, number>();
  for (const [supplierId, items] of supplierGroups) {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const vatAmount = subtotal * 0.14;
    const shippingCost =
      data.shippingMethod === "express"
        ? 150
        : data.shippingMethod === "standard"
          ? 75
          : 0;
    const total = subtotal + vatAmount + shippingCost;
    orderTotals.set(supplierId, total);
    grandTotal += total;
  }

  // ── CREDIT GATE: reject before any mutation ──
  const creditCheck = await checkCreditLimit(hotelId, grandTotal);
  if (!creditCheck.allowed) {
    return error(
      `Order rejected: ${creditCheck.reason}. Available credit: EGP ${creditCheck.available.toFixed(2)}`,
      402,
    );
  }

  // Idempotency key — prevent double checkout on retry
  const idempotencyKey = await requireIdempotencyKey(request, {
    userId: auth.userId,
    action: "CHECKOUT",
    amount: grandTotal,
  });

  // Generate checkout group ID
  const checkoutGroupId = `CG-${Date.now()}`;

  // ── ATOMIC TRANSACTION: Create all orders + capture credit + clear cart ──
  // If any step fails, the entire transaction rolls back.
  // This prevents: cart cleared without orders, orphan orders, double checkout.
  let createdOrders;
  try {
    createdOrders = await prisma.$transaction(async (tx) => {
      // Re-validate credit inside transaction (race-condition guard)
      const hotel = await tx.hotel.findUniqueOrThrow({
        where: { id: hotelId },
        select: { creditLimit: true, creditUsed: true },
      });
      const currentExposure = Number(hotel.creditUsed ?? 0);
      if (currentExposure + grandTotal > Number(hotel.creditLimit ?? Infinity)) {
        throw new Error(
          `Concurrent credit breach. Exposure: EGP ${currentExposure.toFixed(2)} + checkout EGP ${grandTotal.toFixed(2)} > Limit: EGP ${(hotel.creditLimit ?? 0).toFixed(2)}`,
        );
      }

      const orders: Array<{
        id: string;
        orderNumber: string;
        supplier: { name: string };
        total: number | import("@prisma/client/runtime/library").Decimal | null;
        status: string;
      }> = [];
      let orderIndex = 0;

      for (const [supplierId, items] of supplierGroups) {
        const supplier = productMap.get(items[0].productId)!.supplier;
        const total = orderTotals.get(supplierId)!;
        const subtotal = items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0
        );
        const vatAmount = subtotal * 0.14;
        const shippingCost = total - subtotal - vatAmount;

        // Generate order number with suffix for multi-supplier
        const suffix = String.fromCharCode(65 + orderIndex); // A, B, C...
        const orderNumber = `${generateOrderNumber()}-${suffix}`;

        const order = await tx.order.create({
          data: {
            orderNumber,
            status: "PENDING_APPROVAL",
            subtotal,
            vatAmount,
            total,
            currency: "EGP",
            hotelId,
            supplierId,
            requesterId: auth.userId,
            tenantId: auth.tenantId,
            checkoutGroupId,
            shippingMethod: data.shippingMethod,
            shippingCost,
            poNumber: data.poNumber,
            costCenter: data.costCenter,
            deliveryAddress: JSON.stringify(data.address),
            deliveryInstructions: data.procurementNotes,
            items: {
              create: items.map((item) => ({
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.quantity * item.unitPrice,
                productId: item.productId,
                notes: item.notes,
              })),
            },
          },
          include: {
            items: { include: { product: { select: { name: true } } } },
            supplier: { select: { name: true } },
          },
        });

        orders.push(order);
        orderIndex++;
      }

      // ── CAPTURE CREDIT ATOMICALLY ──
      await tx.hotel.update({
        where: { id: hotelId },
        data: { creditUsed: { increment: grandTotal } },
      });

      // ── CLEAR CART ATOMICALLY ──
      await tx.cartItem.deleteMany({
        where: {
          cart: { userId: auth.userId },
        },
      });

      return orders;
    }, {
      maxWait: 5000,
      timeout: 15000,
    });
  } catch (txErr) {
    completeIdempotency(idempotencyKey, "FAILED");
    const message =
      txErr instanceof Error ? txErr.message : "Checkout transaction failed";
    return error(`Checkout failed: ${message}`, 500);
  }

  // ── AUTHORITY MATRIX: evaluate each order ──
  const evaluations: Array<{ orderNumber: string; evaluation: string }> = [];
  for (const order of createdOrders) {
    const evaluation = await evaluateAuthority(order.id, {
      userId: auth.userId,
      userRole: auth.platformRole === "HOTEL" ? "DEPARTMENT_HEAD" : "OWNER",
      tenantId: auth.tenantId,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    evaluations.push({ orderNumber: order.orderNumber, evaluation: evaluation.action });

    await audit({
      entityType: "ORDER",
      entityId: order.id,
      action: "CREATE_ORDER",
      tenantId: auth.tenantId,
      actorId: auth.userId,
      actorRole: auth.platformRole,
      afterState: {
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        evaluation: evaluation.action,
        creditCaptured: order.total,
      },
      ipAddress: request.headers.get("x-forwarded-for") || null,
      userAgent: request.headers.get("user-agent"),
    });
  }

  completeIdempotency(idempotencyKey, checkoutGroupId);

  return success({
    orders: createdOrders.map((o, i) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      supplier: o.supplier.name,
      total: o.total,
      status: o.status,
      authorityDecision: evaluations[i]?.evaluation,
    })),
    checkoutGroupId,
    orderCount: createdOrders.length,
  });
}, { rateLimit: "financial" });
