import { NextRequest } from "next/server";
import { generateDynamicTcpReport } from "@/lib/finance/savings-calculator";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export const GET = apiRoute(async (request: NextRequest, { params }: { params?: Promise<{ orderId: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "report:read");
  const resolved = await params;
  if (!resolved) return error("Missing parameter", 400);
  const { orderId } = resolved;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { tenantId: true },
  });
  if (!order || order.tenantId !== auth.tenantId) {
    return error("Not found", 404);
  }

  const report = await generateDynamicTcpReport(orderId);

  return success({ report });
});
