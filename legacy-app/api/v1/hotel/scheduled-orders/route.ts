import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, requirePermission } from "@/lib/api-utils";
import { z } from "zod";

/**
 * Hotel scheduled orders for the INVO ScheduledOrdersScreen.
 *
 * GET  /api/v1/hotel/scheduled-orders  → list of ScheduledOrder for the tenant
 * PATCH /api/v1/hotel/scheduled-orders/:id → update a real scheduled order
 *
 * Reads real ScheduledOrder + item rows; honest empty list when none exist.
 */
const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  frequency: z.string().optional(),
  autoSubmit: z.boolean().optional(),
  maxOrderValue: z.number().min(0).optional(),
  nextRunAt: z.string().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]).optional(),
});

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "order:read");

  const rows = await prisma.scheduledOrder.findMany({
    where: { tenantId: auth.tenantId, status: { not: "CANCELLED" } },
    orderBy: { nextRunAt: "asc" },
    include: {
      supplier: { select: { name: true } },
      items: { include: { product: { select: { name: true } } } },
    },
  });

  const list = rows.map((o) => ({
    id: o.id,
    name: o.name,
    frequency: o.frequency,
    nextRunAt: o.nextRunAt.toISOString(),
    lastRunAt: o.lastRunAt?.toISOString() ?? null,
    status: o.status,
    autoSubmit: o.autoSubmit,
    maxOrderValue: o.maxOrderValue != null ? Number(o.maxOrderValue) : null,
    supplierName: o.supplier?.name ?? "",
    itemCount: o.items.length,
    totalEstimate: o.items.reduce((s, it) => s + (it.unitPrice != null ? Number(it.unitPrice) * it.quantity : 0), 0),
  }));

  return success({ scheduledOrders: list });
});

export const PATCH = apiRoute(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const auth = await authenticate(request);
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ success: false, error: "id required" }, { status: 400 });
    }

  const body = await request.json();
  const data = UpdateSchema.safeParse(body);
  if (!data.success) {
    return NextResponse.json({ success: false, error: "Validation failed" }, { status: 400 });
  }

  const existing = await prisma.scheduledOrder.findFirst({
    where: { id, tenantId: auth.tenantId },
  });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.scheduledOrder.update({
    where: { id },
    data: {
      ...(data.data.name !== undefined ? { name: data.data.name } : {}),
      ...(data.data.frequency !== undefined ? { frequency: data.data.frequency as never } : {}),
      ...(data.data.autoSubmit !== undefined ? { autoSubmit: data.data.autoSubmit } : {}),
      ...(data.data.maxOrderValue !== undefined ? { maxOrderValue: data.data.maxOrderValue } : {}),
      ...(data.data.nextRunAt !== undefined ? { nextRunAt: new Date(data.data.nextRunAt) } : {}),
      ...(data.data.status !== undefined ? { status: data.data.status as never } : {}),
    },
  });

  return success({ scheduledOrder: { id: updated.id, name: updated.name, status: updated.status } });
  }
);