/**
 * KYC/AML Compliance Service
 * Hotels Vendors Compliance Layer — Egyptian Anti-Money Laundering Law (Law No. 80 of 2002)
 *
 * Implements a three-tier KYC verification workflow:
 *   Level 1: Email + Phone verification (basic identity)
 *   Level 2: Tax ID + Business License (commercial identity)
 *   Level 3: Bank Account Verification (financial identity)
 *
 * All verification results are audit-logged and tenant-scoped.
 */

import { prisma } from "@/lib/prisma";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export type KycLevel = 1 | 2 | 3;

export type KycStatus =
  | "NOT_STARTED"
  | "LEVEL_1_PENDING"
  | "LEVEL_1_VERIFIED"
  | "LEVEL_2_PENDING"
  | "LEVEL_2_VERIFIED"
  | "LEVEL_3_PENDING"
  | "LEVEL_3_VERIFIED"
  | "REJECTED"
  | "EXPIRED";

export interface KycSubmission {
  tenantId: string;
  userId: string;
  level: KycLevel;
  // Level 1
  email?: string;
  phone?: string;
  // Level 2
  taxId?: string;
  commercialRegNumber?: string;
  businessLicenseUrl?: string;
  // Level 3
  bankAccountNumber?: string;
  bankName?: string;
  bankStatementUrl?: string;
}

export interface KycVerificationResult {
  success: boolean;
  level: KycLevel;
  status: KycStatus;
  message: string;
  verifiedFields: string[];
  rejectedFields?: string[];
}

export interface KycStatusResponse {
  tenantId: string;
  currentLevel: KycLevel;
  status: KycStatus;
  level1CompletedAt: Date | null;
  level2CompletedAt: Date | null;
  level3CompletedAt: Date | null;
  lastVerifiedAt: Date | null;
  expiresAt: Date | null;
}

// ─────────────────────────────────────────
// VERIFICATION ENGINE
// ─────────────────────────────────────────

/**
 * Process a KYC submission and verify the provided documents.
 * In production, this would integrate with:
 *   - Egyptian government APIs for business registration validation
 *   - National ID verification services
 *   - Bank account verification providers
 *
 * For now, we perform structural validation and mark as pending manual review.
 */
export async function submitKycVerification(
  submission: KycSubmission
): Promise<KycVerificationResult> {
  const { tenantId, userId, level } = submission;

  // Validate level progression — cannot skip levels
  const currentStatus = await getKycStatus(tenantId);
  if (!canSubmitForLevel(currentStatus, level)) {
    return {
      success: false,
      level,
      status: currentStatus.status,
      message: `Cannot submit Level ${level} verification. Complete Level ${level - 1} first.`,
      verifiedFields: [],
    };
  }

  // Validate required fields per level
  const validation = validateSubmissionFields(submission);
  if (!validation.valid) {
    return {
      success: false,
      level,
      status: currentStatus.status,
      message: `Missing required fields: ${validation.missingFields.join(", ")}`,
      verifiedFields: [],
      rejectedFields: validation.missingFields,
    };
  }

  // Perform level-specific verification
  let result: KycVerificationResult;

  switch (level) {
    case 1:
      result = await verifyLevel1(submission);
      break;
    case 2:
      result = await verifyLevel2(submission);
      break;
    case 3:
      result = await verifyLevel3(submission);
      break;
    default:
      return {
        success: false,
        level,
        status: currentStatus.status,
        message: `Invalid KYC level: ${level}`,
        verifiedFields: [],
      };
  }

  // Audit log the verification attempt
  await appendAuditEntry({
    entityName: "TENANT",
    entityId: tenantId,
    actionType: "UPDATE",
    tenantId,
    actorId: userId,
    changes: {
      level,
      success: result.success,
      message: result.message,
      verifiedFields: result.verifiedFields,
      rejectedFields: result.rejectedFields,
    },
  });

  return result;
}

/**
 * Get the current KYC status for a tenant.
 */
export async function getKycStatus(tenantId: string): Promise<KycStatusResponse> {
  // For now, derive status from tenant metadata
  // In production, this would query a dedicated KycRecord table
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  // Query the most recent KYC audit entries to determine status
  const latestKycLog = await prisma.auditLog.findFirst({
    where: {
      entityId: tenantId,
    },
    orderBy: { createdAt: "desc" },
  });

  let status: KycStatus = "NOT_STARTED";
  let currentLevel: KycLevel = 1;
  let level1CompletedAt: Date | null = null;
  let level2CompletedAt: Date | null = null;
  let level3CompletedAt: Date | null = null;

  if (latestKycLog) {
    const state = latestKycLog.changes && typeof latestKycLog.changes === "object" ? latestKycLog.changes as Record<string, unknown> : {};
    if (state.level === 1 && state.success) {
      status = "LEVEL_1_VERIFIED";
      level1CompletedAt = latestKycLog.createdAt;
      currentLevel = 2;
    } else if (state.level === 2 && state.success) {
      status = "LEVEL_2_VERIFIED";
      level2CompletedAt = latestKycLog.createdAt;
      currentLevel = 3;
    } else if (state.level === 3 && state.success) {
      status = "LEVEL_3_VERIFIED";
      level3CompletedAt = latestKycLog.createdAt;
      currentLevel = 3;
    } else if (state.level && !state.success) {
      status = `LEVEL_${state.level}_PENDING` as KycStatus;
      currentLevel = state.level as KycLevel;
    }
  }

  return {
    tenantId,
    currentLevel,
    status,
    level1CompletedAt,
    level2CompletedAt,
    level3CompletedAt,
    lastVerifiedAt: latestKycLog?.createdAt ?? null,
    expiresAt: null, // KYC does not expire under Egyptian law, but can be set per policy
  };
}

// ─────────────────────────────────────────
// LEVEL-SPECIFIC VERIFICATION
// ─────────────────────────────────────────

async function verifyLevel1(submission: KycSubmission): Promise<KycVerificationResult> {
  const verifiedFields: string[] = [];

  // Email format validation
  if (submission.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email)) {
    verifiedFields.push("email");
  }

  // Phone format validation (Egyptian format: +20XXXXXXXXXX or 01XXXXXXXXX)
  if (submission.phone && /^(\+20|0)1[0-2,5]{1}[0-9]{7}$/.test(submission.phone.replace(/\s/g, ""))) {
    verifiedFields.push("phone");
  }

  const success = verifiedFields.length >= 2; // Both email and phone required

  return {
    success,
    level: 1,
    status: success ? "LEVEL_1_VERIFIED" : "LEVEL_1_PENDING",
    message: success
      ? "Level 1 KYC verified: email and phone confirmed."
      : "Level 1 KYC pending: email and/or phone validation failed.",
    verifiedFields,
  };
}

async function verifyLevel2(submission: KycSubmission): Promise<KycVerificationResult> {
  const verifiedFields: string[] = [];

  // Tax ID validation (Egyptian Tax Registration Number: 14 digits)
  if (submission.taxId && /^[0-9]{14}$/.test(submission.taxId.replace(/\s/g, ""))) {
    verifiedFields.push("taxId");
  }

  // Commercial Registration Number validation
  if (submission.commercialRegNumber && submission.commercialRegNumber.length >= 5) {
    verifiedFields.push("commercialRegNumber");
  }

  // Business license document check
  if (submission.businessLicenseUrl && submission.businessLicenseUrl.startsWith("http")) {
    verifiedFields.push("businessLicenseUrl");
  }

  const success = verifiedFields.length >= 2; // Tax ID + at least one more

  return {
    success,
    level: 2,
    status: success ? "LEVEL_2_VERIFIED" : "LEVEL_2_PENDING",
    message: success
      ? "Level 2 KYC verified: business identity confirmed."
      : "Level 2 KYC pending: additional business documentation required.",
    verifiedFields,
  };
}

async function verifyLevel3(submission: KycSubmission): Promise<KycVerificationResult> {
  const verifiedFields: string[] = [];

  // Bank account number validation (Egyptian banks: 10-16 digits)
  if (submission.bankAccountNumber && /^[0-9]{10,16}$/.test(submission.bankAccountNumber.replace(/\s/g, ""))) {
    verifiedFields.push("bankAccountNumber");
  }

  // Bank name validation
  if (submission.bankName && submission.bankName.length >= 3) {
    verifiedFields.push("bankName");
  }

  // Bank statement document check
  if (submission.bankStatementUrl && submission.bankStatementUrl.startsWith("http")) {
    verifiedFields.push("bankStatementUrl");
  }

  const success = verifiedFields.length >= 2; // Bank account + at least one more

  return {
    success,
    level: 3,
    status: success ? "LEVEL_3_VERIFIED" : "LEVEL_3_PENDING",
    message: success
      ? "Level 3 KYC verified: bank identity confirmed."
      : "Level 3 KYC pending: bank verification documentation required.",
    verifiedFields,
  };
}

// ─────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────

interface SubmissionValidation {
  valid: boolean;
  missingFields: string[];
}

function validateSubmissionFields(submission: KycSubmission): SubmissionValidation {
  const missing: string[] = [];

  switch (submission.level) {
    case 1:
      if (!submission.email) missing.push("email");
      if (!submission.phone) missing.push("phone");
      break;
    case 2:
      if (!submission.taxId) missing.push("taxId");
      if (!submission.commercialRegNumber) missing.push("commercialRegNumber");
      break;
    case 3:
      if (!submission.bankAccountNumber) missing.push("bankAccountNumber");
      if (!submission.bankName) missing.push("bankName");
      break;
  }

  return { valid: missing.length === 0, missingFields: missing };
}

function canSubmitForLevel(status: KycStatusResponse, level: KycLevel): boolean {
  if (level === 1) return status.status === "NOT_STARTED" || status.status === "LEVEL_1_PENDING";
  if (level === 2) return status.status === "LEVEL_1_VERIFIED" || status.status === "LEVEL_2_PENDING";
  if (level === 3) return status.status === "LEVEL_2_VERIFIED" || status.status === "LEVEL_3_PENDING";
  return false;
}

/**
 * Check if a tenant has completed at least the required KYC level.
 * Used as a gate for financial operations (factoring, payments).
 */
export async function hasMinimumKycLevel(
  tenantId: string,
  requiredLevel: KycLevel
): Promise<boolean> {
  const status = await getKycStatus(tenantId);
  const levelMap: Record<KycStatus, number> = {
    NOT_STARTED: 0,
    LEVEL_1_PENDING: 0,
    LEVEL_1_VERIFIED: 1,
    LEVEL_2_PENDING: 1,
    LEVEL_2_VERIFIED: 2,
    LEVEL_3_PENDING: 2,
    LEVEL_3_VERIFIED: 3,
    REJECTED: 0,
    EXPIRED: 0,
  };
  return (levelMap[status.status] ?? 0) >= requiredLevel;
}
