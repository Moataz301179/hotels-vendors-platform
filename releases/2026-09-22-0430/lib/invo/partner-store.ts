/**
 * INVO Partner Store — DB-backed persistence
 *
 * Replaces the previous in-memory `const partners: Partner[] = []` storage
 * used by the INVO partner onboarding routes. All records now persist to the
 * `InvoPartner` table via Prisma so status survives restarts, multi-instance
 * deploys, and horizontal scaling.
 */

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getPlatformTenantId } from "@/lib/invo/platform-tenant";

export type InvoPartnerType = "supplier" | "logistics" | "bank";
export type InvoPartnerStatus = "pending_review" | "approved" | "rejected";

export interface InvoPartnerInput {
  type: InvoPartnerType;
  name: string;
  taxId: string;
  email?: string;
  phone?: string;
  contactName?: string;
  address?: string;
  categories?: string[];
  documents?: string[];
  tenantId?: string;
}

export interface InvoPartnerPublicRecord {
  partnerId: string;
  status: InvoPartnerStatus;
  type: InvoPartnerType;
  name: string;
  submittedAt: string;
  reviewedAt?: string | null;
  reviewerNotes?: string | null;
}

function generatePartnerId(): string {
  return `part_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

/**
 * Persist a newly onboarded INVO partner. Tenant defaults to the platform
 * tenant (the canonical home for service-key INVO records).
 */
export async function onboardPartner(input: InvoPartnerInput): Promise<InvoPartnerPublicRecord> {
  const tenantId = input.tenantId || (await getPlatformTenantId());

  const partner = await prisma.invoPartner.create({
    data: {
      partnerId: generatePartnerId(),
      tenantId,
      type: input.type,
      name: input.name,
      taxId: input.taxId,
      email: input.email || null,
      phone: input.phone || null,
      contactName: input.contactName || null,
      address: input.address || null,
      categories: input.categories || [],
      documents: input.documents || [],
      status: "pending_review",
    },
  });

  return toPublicRecord(partner);
}

/**
 * Look up an INVO partner's onboarding status by partnerId.
 * Returns null when the partner does not exist (caller decides 404 vs demo).
 */
export async function getPartnerStatus(partnerId: string): Promise<InvoPartnerPublicRecord | null> {
  const partner = await prisma.invoPartner.findUnique({
    where: { partnerId },
  });

  if (!partner) return null;

  return toPublicRecord(partner);
}

function toPublicRecord(
  partner: {
    partnerId: string;
    status: string;
    type: string;
    name: string;
    submittedAt: Date;
    reviewedAt: Date | null;
    reviewerNotes: string | null;
  }
): InvoPartnerPublicRecord {
  return {
    partnerId: partner.partnerId,
    status: partner.status as InvoPartnerStatus,
    type: partner.type as InvoPartnerType,
    name: partner.name,
    submittedAt: partner.submittedAt.toISOString(),
    reviewedAt: partner.reviewedAt ? partner.reviewedAt.toISOString() : null,
    reviewerNotes: partner.reviewerNotes,
  };
}
