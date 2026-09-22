import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error, requirePermission } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);

  await requirePermission(auth, "report:read");

  const year = parseInt(request.nextUrl.searchParams.get("year") || new Date().getFullYear().toString(), 10);

  const records = await prisma.spendRecord.findMany({
    where: { tenantId: auth.tenantId, year },
    orderBy: [{ month: "asc" }],
  });

  const totalSpend = records.reduce((s, r) => s + Number(r.amount || 0), 0);
  const totalOrders = records.reduce((s, r) => s + r.orderCount, 0);

  const byCategory = records.reduce<Record<string, { amount: number; orderCount: number }>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = { amount: 0, orderCount: 0 };
    acc[r.category].amount += Number(r.amount || 0);
    acc[r.category].orderCount += r.orderCount;
    return acc;
  }, {});

  return success({ year, records, totalSpend, totalOrders, byCategory });
});
