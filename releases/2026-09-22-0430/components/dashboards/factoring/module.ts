
// FACTORING DASHBOARD (G6 — liquidity + risk assessment)
import { orders, financingAppApplications, auditEntries } from "@/db/schema";
import { db } from "@/db";

export interface FactoringDashboardData {
  fundedAmount: number;
  pendingApplications: number;
  averageCreditUsed: number;
  riskScoreAverage: number;
}

export async function loadFactoringData(): Promise<FactoringDashboardData> {
  const funded = await db.select().from(financingAppApplications);
  return {
    fundedAmount: 0,
    pendingApplications: funded.length,
    averageCreditUsed: 0,
    riskScoreAverage: 0,
  };
}
