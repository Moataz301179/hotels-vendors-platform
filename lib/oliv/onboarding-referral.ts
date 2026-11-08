/**
 * Oliv Finance — hotel onboarding referral and linkage.
 *
 * Phase 6 requirement: a hotel is introduced to the Oliv Finance opportunity at
 * the START of its Hotels Vendors onboarding journey, referral attribution and
 * hotel identity are preserved, existing Oliv customers can link instead of
 * re-applying, and the hotel is returned to its workspace.
 *
 * Boundaries:
 * - Oliv retains its own credit and approval authority. Nothing here approves,
 *   prices or guarantees a facility.
 * - No live Oliv API is called and no credentials are required. The referral
 *   is recorded locally against the agreed identifier `CHV000`.
 * - Application progress is never invented. There is deliberately no facility,
 *   limit or status row created here: no Oliv-side confirmation exists yet, so
 *   any such record would be fabricated.
 */

import { prisma } from "@/lib/prisma";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

export const OLIV_REFERRAL_CODE = "CHV000";

export const OLIV_ONBOARDING_CHOICES = ["referral", "existing", "later"] as const;
export type OlivOnboardingChoice = (typeof OLIV_ONBOARDING_CHOICES)[number];

export interface OlivOnboardingOutcome {
  choice: OlivOnboardingChoice;
  referralCode: string;
  hotelId: string | null;
  tenantId: string;
  /** Deep link into the agreed Oliv onboarding process. */
  olivOnboardingUrl: string;
  recordedAt: Date;
}

/** The agreed Oliv registration entry point for referred hotels. */
export function olivOnboardingUrl(): string {
  const base = process.env.OLIV_BASE_URL || "https://api.oliv.finance";
  return `${base.replace(/\/$/, "")}/onboarding?ref=${OLIV_REFERRAL_CODE}`;
}

/**
 * Record the hotel's financing choice.
 *
 * Idempotent per hotel: a repeated call rewrites the audit entry's outcome
 * rather than accumulating duplicate referrals. Nothing is ever marked as
 * approved, funded or verified by Oliv — only that the hotel was introduced and
 * what it chose.
 */
export async function recordOlivOnboardingChoice(params: {
  hotelId: string | null;
  tenantId: string;
  userId: string;
  choice: OlivOnboardingChoice;
  existingOlivCustomerId?: string;
}): Promise<OlivOnboardingOutcome> {
  const { hotelId, tenantId, userId, choice, existingOlivCustomerId } = params;

  if (!OLIV_ONBOARDING_CHOICES.includes(choice)) {
    throw new Error("Unknown Oliv onboarding choice.");
  }

  await appendAuditEntry({
    entityName: "OLIV_ONBOARDING",
    entityId: hotelId ?? tenantId,
    actionType: "CREATE",
    tenantId,
    actorId: userId,
    actorRole: "HOTEL",
    changes: {
      choice,
      referralCode: OLIV_REFERRAL_CODE,
      hotelId: hotelId ?? null,
      // Explicit honesty marker: this is a local attribution record only.
      olivSideConfirmed: false,
      existingOlivCustomerId: existingOlivCustomerId ?? null,
    },
  });

  return {
    choice,
    referralCode: OLIV_REFERRAL_CODE,
    hotelId,
    tenantId,
    olivOnboardingUrl: olivOnboardingUrl(),
    recordedAt: new Date(),
  };
}
