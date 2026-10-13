import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { InvoiceCreateSchema, PaginationSchema } from "@/lib/zod";
import { apiRoute, authenticate, validateBody, validateQuery, success, error, audit, requireIdempotencyKey, completeIdempotency, requirePermission } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "invoice:read");
  const query = validateQuery(PaginationSchema, request.nextUrl.searchParams);

  const where: Record<string, unknown> = { tenantId: auth.tenantId };

  if (query.search) {
    where.invoiceNumber = { contains: query.search };
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { [query.sortBy || "createdAt"]: query.sortOrder },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: { hotel: { select: { id: true, name: true } }, supplier: { select: { id: true, name: true } }, order: { select: { id: true, orderNumber: true } } },
    }),
    prisma.invoice.count({ where }),
  ]);

  return success({ invoices, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } });
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "invoice:create");
  const body = await request.json();
  const data = validateBody(InvoiceCreateSchema, body);

  const order = await prisma.order.findFirst({
    where: { id: data.orderId, tenantId: auth.tenantId, deletedAt: null },
    select: { id: true, tenantId: true, hotelId: true, supplierId: true, status: true, subtotal: true, vatAmount: true, total: true },
  });
  if (!order) return error("Order not found", 404);
  if (!["CONFIRMED", "IN_TRANSIT", "PARTIALLY_DELIVERED", "DELIVERED"].includes(order.status)) {
    return error("An invoice can only be issued after the order is confirmed", 409);
  }
  if (data.hotelId !== order.hotelId || data.supplierId !== order.supplierId) {
    return error("Invoice parties must match the order", 400);
  }
  const actor = await prisma.user.findFirst({
    where: { id: auth.userId, tenantId: auth.tenantId, deletedAt: null },
    select: { supplierId: true },
  });
  if (auth.platformRole === "SUPPLIER" && actor?.supplierId !== order.supplierId) {
    return error("Only the assigned supplier can issue this invoice", 403);
  }
  const moneyMatches = (submitted: number, stored: unknown) => Math.abs(submitted - Number(stored ?? 0)) < 0.01;
  if (!moneyMatches(data.subtotal, order.subtotal) || !moneyMatches(data.vatAmount, order.vatAmount) || !moneyMatches(data.total, order.total)) {
    return error("Invoice amounts must match the locked order totals", 409);
  }

  const idempotencyKey = await requireIdempotencyKey(request, { userId: auth.userId, action: "CREATE_INVOICE", amount: data.total });

  const invoice = await prisma.invoice.create({
    data: {
      tenantId: order.tenantId,
      invoiceNumber: data.invoiceNumber,
      orderId: order.id,
      hotelId: order.hotelId,
      supplierId: order.supplierId,
      subtotal: data.subtotal,
      vatRate: data.vatRate,
      vatAmount: data.vatAmount,
      total: data.total,
      issueDate: new Date(data.issueDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: "DRAFT",
      paymentStatus: "UNPAID",
      etaStatus: "PENDING",
      factoringStatus: "NOT_FACTORABLE",
    },
    include: { hotel: true, supplier: true, order: true },
  });

  await audit({
    entityType: "INVOICE",
    entityId: invoice.id,
    action: "CREATE_INVOICE",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: { invoiceNumber: invoice.invoiceNumber, total: invoice.total, orderId: invoice.orderId },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  completeIdempotency(idempotencyKey, invoice.id);

  return success({ invoice }, 201);
}, { rateLimit: "api" });
