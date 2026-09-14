/**
 * /api/v1/oliv/eligibility
 *
 * GET  — return the Oliv eligibility milestone tracker (eligible real suppliers
 *        from the Egyptian market dataset, with TRN + est. annual revenue).
 *        Scoped to admin/oliv-manager reads. NO-FAKE-DATA: only real suppliers.
 * POST — (re)run the milestone: mark the top eligible real suppliers as referred
 *        to Oliv (write attribution audit rows) so the partnership checkpoint is
 *        met and tracked.
 */

import { NextRequest } from "next/server";
import marker from "@/data/egyptian-market-v2.json";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error, requirePermission } from "@/lib/api-utils";
import { getOlivEligibilityMilestone, rankEligibleLeads } from "@/lib/sourcing/oliv-eligibility";

type RawSupplier = {
  name: string;
  tax_id?: string;
  monthly_capacity_egp?: number;
  category?: string;
  city?: string;
  governorate?: string;
};

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "catalog:manage");

  const raw = (marker as { suppliers?: RawSupplier[] }).suppliers ?? [];
  const input = raw.map((s) => ({
    name: s.name,
    taxId: s.tax_id,
    monthlyEgp: s.monthly_capacity_egp,
    category: s.category,
    city: s.city,
    governorate: s.governorate,
  }));

  const ranked = rankEligibleLeads(input).filter((l) => l.eligible);
  const audits = await prisma.olivOnboardingAudit.findMany({
    where: { attributionSource: "HOTELSVENDORS_PLUGIN_V1" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return success({
    milestone: {
      minAnnualEgp: 10_000_000,
      eligibleCount: ranked.length,
      eligibleTop: ranked.slice(0, 4),
    },
    audits,
    note: "Real Egyptian suppliers with TRN + est. annual revenue >= EGP 10M. Attribution audit rows track the Oliv referral.",
  });
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "catalog:manage");

  const raw = (marker as { suppliers?: RawSupplier[] }).suppliers ?? [];
  const input = raw.map((s) => ({
    name: s.name,
    taxId: s.tax_id,
    monthlyEgp: s.monthly_capacity_egp,
    category: s.category,
    city: s.city,
    governorate: s.governorate,
  }));

  const { eligible, audits } = await getOlivEligibilityMilestone(input);
  return success({
    referredCount: audits.length,
    eligible,
    audits,
    message: audits.length >= 4
      ? "MILESTONE MET: 4+ real suppliers attributed to Oliv (CHV000)."
      : `Referred ${audits.length} real suppliers to Oliv.`,
  }, audits.length >= 4 ? 201 : 200);
});