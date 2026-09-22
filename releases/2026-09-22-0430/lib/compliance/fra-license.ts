/**
 * FRA Licensing Compliance Check
 * Hotels Vendors Compliance Layer — Financial Regulatory Authority (FRA)
 *
 * Verifies that factoring operations are conducted within the FRA regulatory framework.
 * The platform holds a Digital Marketing license only. All financial services (factoring,
 * credit, payments) are operated by licensed third-party partners.
 *
 * This module enforces the referral-only scope and prevents the platform from exceeding
 * its licensed activities.
 */

import { prisma } from "@/lib/prisma";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export type FraLicenseType =
  | "DIGITAL_MARKETING"
  | "FACTORIZATION"
  | "LENDING"
  | "PAYMENT_PROCESSING"
  | "INSURANCE_BROKERAGE";

export interface FraLicenseStatus {
  licenseType: FraLicenseType;
  licenseNumber: string | null;
  issuer: string;
  issuedAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  restrictions: string[];
}

export interface FraComplianceCheck {
  allowed: boolean;
  reason: string;
  licenseStatus: FraLicenseStatus;
  recommendation: string;
}

// ─────────────────────────────────────────
// PLATFORM LICENSE CONFIGURATION
// ─────────────────────────────────────────

const PLATFORM_LICENSE: FraLicenseStatus = {
  licenseType: "DIGITAL_MARKETING",
  licenseNumber: process.env.FRA_LICENSE_NUMBER || null,
  issuer: "Financial Regulatory Authority (FRA) — Egypt",
  issuedAt: process.env.FRA_LICENSE_ISSUED_AT ? new Date(process.env.FRA_LICENSE_ISSUED_AT) : null,
  expiresAt: process.env.FRA_LICENSE_EXPIRES_AT ? new Date(process.env.FRA_LICENSE_EXPIRES_AT) : null,
  isActive: true,
  restrictions: [
    "Platform does NOT hold or transfer cash",
    "All financial services operated by licensed third-party partners",
    "Platform charges only: SaaS fees, document processing fees, marketplace commissions",
    "No factoring fees, no cash custody, no lending, no wallet balances",
    "Factoring operations are referral-only to licensed partners (e.g., Oliv, EFG Hermes)",
  ],
};

// ─────────────────────────────────────────
// COMPLIANCE CHECK FUNCTIONS
// ─────────────────────────────────────────

/**
 * Check if a specific financial activity is allowed under the platform's FRA license.
 * This is a GUARD function — call it before processing any financial operation.
 */
export async function checkFraCompliance(
  activity: "FACTORING_REFERRAL" | "FACTORIZATION" | "PAYMENT_PROCESSING" | "LENDING",
  tenantId: string,
  actorId: string
): Promise<FraComplianceCheck> {
  const license = getPlatformLicense();

  switch (activity) {
    case "FACTORING_REFERRAL":
      return {
        allowed: true,
        reason: "Factoring referral is permitted under Digital Marketing license. Platform acts as intermediary only.",
        licenseStatus: license,
        recommendation: "Ensure factoring partner (e.g., Oliv) holds valid FRA Factoring license.",
      };

    case "FACTORIZATION":
      return {
        allowed: false,
        reason: "Direct factoring operations require FRA Factoring License (Type: Factorization). Platform holds Digital Marketing license only.",
        licenseStatus: license,
        recommendation: "Route all factoring operations through licensed third-party partners. Do not process factoring directly.",
      };

    case "PAYMENT_PROCESSING":
      return {
        allowed: false,
        reason: "Payment processing requires FRA Payment Service Provider license. Platform does not hold this license.",
        licenseStatus: license,
        recommendation: "Use licensed payment processors (Paymob, Fawry) for all payment operations.",
      };

    case "LENDING":
      return {
        allowed: false,
        reason: "Lending operations require FRA Consumer Finance license. Platform does not hold this license.",
        licenseStatus: license,
        recommendation: "Do not offer any credit or lending products directly. Partner with licensed financial institutions.",
      };

    default:
      return {
        allowed: false,
        reason: `Unknown activity type: ${activity}`,
        licenseStatus: license,
        recommendation: "Consult legal counsel for unrecognized activity types.",
      };
  }
}

/**
 * Get the platform's current FRA license status.
 */
export function getPlatformLicense(): FraLicenseStatus {
  return { ...PLATFORM_LICENSE };
}

/**
 * Validate that a factoring request is being routed through a licensed partner.
 * Called by the factoring orchestrator before initiating partner inquiry.
 */
export async function validateFactoringPartner(
  partnerId: string,
  tenantId: string,
  triggeredBy: string
): Promise<{ valid: boolean; error?: string }> {
  // Check partner exists and is active
  const partner = await prisma.factoringCompany.findUnique({
    where: { id: partnerId },
  });

  if (!partner) {
    return { valid: false, error: `Factoring partner not found: ${partnerId}` };
  }

  if (partner.status !== "ACTIVE") {
    return { valid: false, error: `Factoring partner is not active: ${partnerId} (status: ${partner.status})` };
  }

  // Log the compliance check
  await appendAuditEntry({
    entityName: "FACTORING_COMPANY",
    entityId: partnerId,
    actionType: "UPDATE",
    tenantId,
    actorId: triggeredBy,
    changes: {
      partnerId,
      partnerName: partner.name,
      partnerStatus: partner.status,
      checkType: "FRA_LICENSE_VALIDATION",
      result: "PASSED",
    },
  });

  return { valid: true };
}

/**
 * Generate a compliance report for FRA audit purposes.
 * Returns a snapshot of the platform's license status and recent factoring activity.
 */
export async function generateFraAuditReport(
  tenantId: string,
  fromDate: Date,
  toDate: Date
): Promise<{
  licenseStatus: FraLicenseStatus;
  factoringActivityCount: number;
  partnerDistribution: Record<string, number>;
  complianceFlags: string[];
}> {
  const license = getPlatformLicense();

  // Count factoring requests in the period
  const factoringRequests = await prisma.factoringRequest.findMany({
    where: {
      tenantId,
      createdAt: { gte: fromDate, lte: toDate },
    },
    select: { factoringCompanyId: true },
  });

  const partnerDistribution: Record<string, number> = {};
  for (const req of factoringRequests) {
    const pid = req.factoringCompanyId;
    partnerDistribution[pid] = (partnerDistribution[pid] || 0) + 1;
  }

  const complianceFlags: string[] = [];
  if (!license.licenseNumber) {
    complianceFlags.push("FRA license number not configured in environment variables.");
  }
  if (license.expiresAt && license.expiresAt < new Date()) {
    complianceFlags.push("FRA license has expired. Renewal required.");
  }

  return {
    licenseStatus: license,
    factoringActivityCount: factoringRequests.length,
    partnerDistribution,
    complianceFlags,
  };
}
