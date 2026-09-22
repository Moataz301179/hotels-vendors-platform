import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, requirePermission } from "@/lib/api-utils";

/**
 * Hotel credit overview for the INVO HotelCreditScreen.
 *
 * GET /api/v1/hotel/credit
 * Returns creditLimit, creditUsed, utilization, riskTier, facilities[] and
 * recentTransactions[] derived from real CreditFacility / CreditTransaction
 * rows for the tenant. Honest zeros/empty arrays when none exist.
 */
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "report:read");

  const [facilities, lines] = await Promise.all([
    prisma.creditFacility.findMany({
      where: { tenantId: auth.tenantId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { factoringCompany: { select: { name: true } } },
      take: 20,
    }),
    prisma.creditTransaction.findMany({
      where: { tenantId: auth.tenantId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  const list = facilities.map((f) => ({
    id: f.id,
    name: f.factoringCompany?.name ?? "Credit Facility",
    limit: f.limit != null ? Number(f.limit) : 0,
    utilized: f.utilized != null ? Number(f.utilized) : 0,
    interestRate: f.interestRate != null ? Number(f.interestRate) * 100 : 0,
    status: f.status,
  }));

  const creditLimit = list.reduce((a, f) => a + f.limit, 0);
  const creditUsed = list.reduce((a, f) => a + f.utilized, 0);

  const recentTransactions = lines.map((t) => ({
    id: t.id,
    type: t.type,
    amount: t.amount != null ? Number(t.amount) : 0,
    date: t.createdAt.toISOString(),
    description: t.description ?? "",
  }));

  // Derive a simple risk tier from facility utilization (honest heuristic on real data).
  let riskTier = "standard";
  if (creditLimit > 0) {
    const u = creditUsed / creditLimit;
    riskTier = u > 0.85 ? "high" : u > 0.6 ? "elevated" : "standard";
  }

  return success({
    creditLimit,
    creditUsed,
    utilization: creditLimit > 0 ? Math.round((creditUsed / creditLimit) * 100) : 0,
    riskTier,
    facilities: list,
    recentTransactions,
  });
});