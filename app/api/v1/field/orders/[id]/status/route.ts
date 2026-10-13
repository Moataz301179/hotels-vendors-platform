import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error, requirePermission } from "@/lib/api-utils";
import { z } from "zod";

const StatusShiftSchema = z.object({
  status: z.enum(["READY", "IN_TRANSIT", "DELIVERED", "PENDING", "APPROVED", "CONFIRMED"]),
});

const validTransitions: Record<string, string[]> = {
  PENDING: ["APPROVED", "CONFIRMED"],
  APPROVED: ["CONFIRMED", "PENDING"],
  CONFIRMED: ["IN_TRANSIT"],
  IN_TRANSIT: ["DELIVERED"],
  DELIVERED: [],
  READY: ["IN_TRANSIT"],
};

export const POST = apiRoute(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "order:update");

  const { id } = await params;
  const body = await request.json();
  const data = StatusShiftSchema.parse(body);

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return error("Order not found", 404);
  if (order.tenantId !== auth.tenantId) return error("Order not found", 404);

  if (!validTransitions[order.status]?.includes(data.status)) {
    return error(`Cannot transition from ${order.status} to ${data.status}`, 422);
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: data.status as never },
  });

  return success({
    id: updated.id,
    orderNumber: updated.orderNumber,
    status: updated.status,
    updatedAt: updated.updatedAt.toISOString(),
  });
});
