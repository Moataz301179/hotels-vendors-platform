import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, success, error, authenticate, requirePermission } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

/**
 * Oliv Credit Facility API
 *
 * GET /api/v1/fintech/oliv-facility — Get supplier's Oliv credit facility
 *
 * Returns:
 * - Credit limit, utilized, available (all in EGP)
 * - Interest rate, advance rate, discount rate
 * - Payment schedule
 * - Oliv risk assessment
 * - Last sync timestamp
 */

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (!auth) return error("Unauthorized", 401);
  await requirePermission(auth, "fintech:read");

  // Get supplier's Oliv credit facility
  const facility = await prisma.olivCreditFacility.findFirst({
    where: {
      tenantId: auth.tenantId,
      status: { in: ["ACTIVE", "SUSPENDED"] },
    },
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
          legalName: true,
          taxId: true,
          olivStatus: true,
          olivSyncAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!facility) {
    return success({
      hasFacility: false,
      message: "No Oliv credit facility found. Activate Oliv financing from your dashboard.",
    });
  }

  // Parse payment schedule
  let paymentSchedule: Array<{
    dueDate: string;
    amountEgp: number;
    status: string;
    invoiceNumber?: string;
  }> = [];

  if (facility.paymentSchedule) {
    try {
      paymentSchedule = JSON.parse(facility.paymentSchedule);
    } catch {
      // Ignore parse errors
    }
  }

  // Calculate summary metrics
  const utilizationRate = Number(facility.creditLimitEgp || 0) > 0
    ? (Number(facility.utilizedEgp || 0) / Number(facility.creditLimitEgp || 0)) * 100
    : 0;

  const upcomingPayments = paymentSchedule.filter(
    (p) => p.status === "PENDING" && new Date(p.dueDate) > new Date()
  );

  const totalUpcomingEgp = upcomingPayments.reduce((sum, p) => sum + p.amountEgp, 0);

  return success({
    hasFacility: true,
    facility: {
      id: facility.id,
      olivFacilityId: facility.olivFacilityId,

      // Credit metrics (all in EGP)
      creditLimitEgp: facility.creditLimitEgp,
      utilizedEgp: facility.utilizedEgp,
      availableEgp: facility.availableEgp,
      utilizationRate: Math.round(utilizationRate * 100) / 100,

      // Terms
      interestRate: facility.interestRate,
      advanceRate: facility.advanceRate,
      discountRate: facility.discountRate,
      settlementDays: facility.settlementDays,

      // Status
      status: facility.status,
      approvedAt: facility.approvedAt,
      expiresAt: facility.expiresAt,

      // Risk assessment
      olivRiskScore: facility.olivRiskScore,
      olivRiskTier: facility.olivRiskTier,

      // Payment schedule
      paymentSchedule,
      upcomingPayments: upcomingPayments.length,
      totalUpcomingEgp,

      // Sync status
      lastSyncedAt: facility.lastSyncedAt,

      // Supplier info
      supplier: facility.supplier,
    },
  });
});
