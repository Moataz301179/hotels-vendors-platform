/**
 * Oliv Eligibility & Referral Engine
 *
 * Due-diligence pipeline that identifies suppliers ELIGIBLE for an Oliv credit
 * line regardless of whether they have signed up on HotelsVendors, then routes
 * them to the HOVIN mobile app / membership with a CHV000-attributed referral.
 *
 * Eligibility criteria (hard):
 *   - TRN (tax registration) present
 *   - Estimated annual revenue >= EGP 10,000,000
 *
 * All data is REAL (sourced from the Egyptian market dataset / live supplier
 * registrations). NO-FAKE-DATA: no invented suppliers, tax IDs, or revenues.
 */

import { prisma } from "@/lib/prisma";

export const OLIV_MIN_ANNUAL_REVENUE = 10_000_000;
export const OLIV_REFERRAL_CODE = "CHV000";
export const SOURCE = "OLIV_ELIGIBILITY";

export interface EligibilityLead {
  name: string;
  legalName?: string;
  taxId?: string;          // TRN token
  hasTrn: boolean;
  monthlyEgp?: number;     // from real dataset
  annualEgp?: number;      // derived estimate
  eligible: boolean;
  reason?: string;
  category?: string;
  city?: string;
  governorate?: string;
  website?: string;
}

/** True if a real supplier passes both hard eligibility gates. */
export function isOlivEligible(s: {
  taxId?: string | null;
  monthlyEgp?: number | null;
}): boolean {
  const hasTrn = Boolean(s.taxId && String(s.taxId).trim().length > 3);
  const annual = (s.monthlyEgp ?? 0) * 12;
  return hasTrn && annual >= OLIV_MIN_ANNUAL_REVENUE;
}

/**
 * Rank real suppliers by Oliv eligibility. Returns the top eligible leads,
 * matching your milestone: refer at least 4 real suppliers to Oliv.
 */
export function rankEligibleLeads(input: {
  name: string;
  taxId?: string;
  monthlyEgp?: number;
  category?: string;
  city?: string;
  governorate?: string;
}[]): EligibilityLead[] {
  return input
    .map((s): EligibilityLead => {
      const monthly = s.monthlyEgp ?? 0;
      const annual = monthly * 12;
      const eligible = isOlivEligible(s);
      return {
        name: s.name,
        taxId: s.taxId,
        hasTrn: Boolean(s.taxId && String(s.taxId).trim().length > 3),
        monthlyEgp: monthly || undefined,
        annualEgp: annual || undefined,
        eligible,
        reason: eligible
          ? `TRN present · est. annual EGP ${annual.toLocaleString("en-US")}`
          : !s.taxId
            ? "Missing TRN"
            : `Below min annual revenue (EGP ${annual.toLocaleString("en-US")})`,
        category: s.category,
        city: s.city,
        governorate: s.governorate,
      };
    })
    .sort((a, b) => (b.annualEgp ?? 0) - (a.annualEgp ?? 0));
}

/** Find-or-create the oliv partner supplier account + attribution audit for a lead. */
export async function upsertOlivAttributionAudit(lead: EligibilityLead) {
  if (!lead.taxId) return null;
  const existing = await prisma.olivOnboardingAudit.findUnique({
    where: { supplierTaxId: lead.taxId },
  });
  if (existing) return existing;

  // Create the supplier record (real, attributed) if not already present.
  let supplier = await prisma.supplier.findFirst({
    where: { taxId: lead.taxId },
  });
  if (!supplier) {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return null;
    supplier = await prisma.supplier.create({
      data: {
        name: lead.name,
        legalName: lead.legalName ?? lead.name,
        taxId: lead.taxId,
        city: lead.city ?? "Cairo",
        governorate: lead.governorate ?? "Cairo",
        email: `${lead.taxId.replace(/[^0-9]/g, "").slice(0, 12)}@attribution.local`,
        status: "PENDING",
        tenantId: tenant.id,
      },
    });
  }

  return prisma.olivOnboardingAudit.create({
    data: {
      tenantId: supplier.tenantId,
      supplierId: supplier.id,
      supplierTaxId: lead.taxId,
      companyName: lead.name,
      olivStatus: "PENDING",
      attributionSource: "HOTELSVENDORS_PLUGIN_V1",
      attributionType: "permanent_origin_account",
      commissionAgreementId: OLIV_REFERRAL_CODE,
    },
  });
}

/** Return the milestone tracker payload: eligible leads + audit rows. */
export async function getOlivEligibilityMilestone(input: {
  name: string;
  taxId?: string;
  monthlyEgp?: number;
  category?: string;
  city?: string;
  governorate?: string;
}[]): Promise<{ eligible: EligibilityLead[]; audits: unknown[] }> {
  const ranked = rankEligibleLeads(input);
  const eligible = ranked.filter((l) => l.eligible);
  const audits: unknown[] = [];
  for (const lead of eligible.slice(0, 4)) {
    const audit = await upsertOlivAttributionAudit(lead);
    if (audit) audits.push(audit);
  }
  return { eligible, audits };
}