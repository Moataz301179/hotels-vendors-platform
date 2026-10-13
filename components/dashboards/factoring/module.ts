import "server-only";
import { prisma } from "@/lib/prisma";
import { requireServerPermission } from "@/lib/auth/server-auth";
export interface FactoringDashboardData {
  fundedAmount: number; pendingApplications: number;
  averageCreditUsed: number | null; riskScoreAverage: number | null;
}
export async function loadFactoringData(): Promise<FactoringDashboardData> {
  const user = await requireServerPermission("factoring:read");
  if (user.platformRole !== "FACTORING") throw new Error("Factoring workspace required");
  const where = { tenantId: user.tenantId, deletedAt: null };
  const [funded, pendingApplications, credit, risk] = await Promise.all([
    prisma.factoringRequest.aggregate({ where: { ...where, status: { in: ["DISBURSED", "SETTLED"] } }, _sum: { disbursedAmount: true } }),
    prisma.factoringRequest.count({ where: { ...where, status: { in: ["PENDING", "UNDER_REVIEW"] } } }),
    prisma.creditFacility.aggregate({ where: { ...where, status: "ACTIVE" }, _avg: { utilized: true } }),
    prisma.factoringRequest.aggregate({ where, _avg: { riskScore: true } }),
  ]);
  return { fundedAmount: Number(funded._sum.disbursedAmount ?? 0), pendingApplications,
    averageCreditUsed: credit._avg.utilized == null ? null : Number(credit._avg.utilized),
    riskScoreAverage: risk._avg.riskScore };
}
