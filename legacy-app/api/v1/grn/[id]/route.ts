import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error, requirePermission } from "@/lib/api-utils";
import { z } from "zod";

const UpdateGrnStatusSchema = z.object({
  status: z.enum(["RECEIVING", "INSPECTING", "ACCEPTED", "REJECTED"]),
});

export const GET = apiRoute(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "order:read");
  const { id } = await params;

  const grn = await prisma.goodsReceiptNote.findUnique({
    where: { id },
    include: {
      order: { select: { id: true, orderNumber: true, status: true, total: true } },
      hotel: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
      lineItems: { include: { product: { select: { id: true, name: true, sku: true, unitOfMeasure: true } } } },
    },
  });

  if (!grn || grn.tenantId !== auth.tenantId) return error("GRN not found", 404);
  return success(grn);
});

export const PATCH = apiRoute(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "order:update");
  const { id } = await params;
  const body = await request.json();
  const data = UpdateGrnStatusSchema.parse(body);

  const grn = await prisma.goodsReceiptNote.findUnique({ where: { id } });
  if (!grn || grn.tenantId !== auth.tenantId) return error("GRN not found", 404);

  const statusUpdate: Record<string, Date> = {};
  if (data.status === "INSPECTING") statusUpdate.inspectedAt = new Date();
  if (data.status === "ACCEPTED") statusUpdate.acceptedAt = new Date();

  const updated = await prisma.goodsReceiptNote.update({
    where: { id },
    data: { status: data.status as never, ...statusUpdate },
  });

  return success(updated);
});
