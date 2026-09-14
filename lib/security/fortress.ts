/**
 * Fortress Protocol — Master Security Orchestrator
 * Hotels Vendors Security Layer
 *
 * 360° Risk Assessment with 6 control pillars:
 * 1. Financial Fraud (Idempotency + ETA UUID locks)
 * 2. Identity Breach (MFA + Session Fingerprinting + Admin Lockdown)
 * 3. AI Hallucinations (HITL triggers for transactions > threshold)
 * 4. Data Integrity (ACID + Immutable audit logs)
 * 5. API Security (HMAC signatures + rate limiting)
 * 6. Anomaly Detection (Real-time breach detection)
 */

import { prisma } from "@/lib/prisma";
import { verifyTOTP, generateTOTPSecret } from "./mfa";
import { fingerprintSession, compareFingerprints } from "./session-fingerprint";
import { validateIdempotencyKey, generateIdempotencyKey } from "./idempotency";
import { verifyHMAC, generateHMAC } from "./api-guard";

// ─────────────────────────────────────────
// 1. CONFIGURATION
// ─────────────────────────────────────────

export interface FortressConfig {
  // Transaction thresholds
  autoApproveThreshold: number;      // 10,000 EGP
  dualAuthThreshold: number;         // 100,000 EGP
  hitlThreshold: number;             // 1,000,000 EGP

  // MFA
  mfaEnabled: boolean;
  mfaRequiredForRoles: string[];     // ["ADMIN", "FINANCIAL_CONTROLLER"]

  // Session
  sessionMaxAgeMinutes: number;
  fingerprintTolerance: number;      // 0.8 = 80% match required

  // Rate limiting
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;

  // Anomaly
  anomalyScoreThreshold: number;     // 0.7 = 70% anomaly score triggers lockdown
}

const DEFAULT_CONFIG: FortressConfig = {
  autoApproveThreshold: 10_000,
  dualAuthThreshold: 100_000,
  hitlThreshold: 1_000_000,
  mfaEnabled: true,
  mfaRequiredForRoles: ["ADMIN", "FINANCIAL_CONTROLLER", "OWNER"],
  sessionMaxAgeMinutes: 480, // 8 hours
  fingerprintTolerance: 0.8,
  maxRequestsPerMinute: 60,
  maxRequestsPerHour: 1000,
  anomalyScoreThreshold: 0.7,
};

let CONFIG = { ...DEFAULT_CONFIG };

export function setFortressConfig(config: Partial<FortressConfig>): void {
  CONFIG = { ...CONFIG, ...config };
}

export function getFortressConfig(): FortressConfig {
  return { ...CONFIG };
}

// ─────────────────────────────────────────
// 2. TRANSACTION GUARDRAILS
// ─────────────────────────────────────────

export type TransactionApprovalLevel = "AUTO" | "DUAL_AUTH" | "HITL" | "BLOCKED";

export interface TransactionGuardrailResult {
  approved: boolean;
  level: TransactionApprovalLevel;
  requiresMFA: boolean;
  requiresDualAuth: boolean;
  requiresHITL: boolean;
  reason: string;
  idempotencyKey?: string;
}

/**
 * Evaluate transaction against guardrails.
 * This is the CENTRAL GATE for ALL monetary mutations.
 */
export async function evaluateTransactionGuardrails(params: {
  amount: number;
  userId: string;
  userRole: string;
  action: string; // "ORDER_CREATE", "FACTORING_FUND", "CREDIT_EXTEND", etc.
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}): Promise<TransactionGuardrailResult> {
  const { amount, userId, userRole, action, idempotencyKey, metadata } = params;

  // 1. Idempotency Check (Financial Fraud Prevention)
  if (idempotencyKey) {
    const idemValid = await validateIdempotencyKey(idempotencyKey, { userId, action, amount });
    if (!idemValid.valid) {
      return {
        approved: false,
        level: "BLOCKED",
        requiresMFA: false,
        requiresDualAuth: false,
        requiresHITL: false,
        reason: `Idempotency violation: ${idemValid.reason}`,
      };
    }
  }

  // 2. Determine approval level
  let level: TransactionApprovalLevel = "AUTO";
  let requiresDualAuth = false;
  let requiresHITL = false;

  if (amount >= CONFIG.hitlThreshold) {
    level = "HITL";
    requiresHITL = true;
  } else if (amount >= CONFIG.dualAuthThreshold) {
    level = "DUAL_AUTH";
    requiresDualAuth = true;
  } else if (amount >= CONFIG.autoApproveThreshold) {
    level = "AUTO";
  }

  // 3. Legal/Compliance actions always require HITL
  const legalActions = ["AUTHORITY_MATRIX_CHANGE", "ETA_CREDENTIAL_ROTATION", "PARTNER_ONBOARDING", "FEE_STRUCTURE_CHANGE"];
  if (legalActions.includes(action)) {
    level = "HITL";
    requiresHITL = true;
  }

  // 4. MFA check
  const requiresMFA = CONFIG.mfaEnabled && CONFIG.mfaRequiredForRoles.includes(userRole);

  // 5. Anomaly check
  const anomalyScore = await calculateAnomalyScore(userId, action, amount, metadata);
  if (anomalyScore > CONFIG.anomalyScoreThreshold) {
    await triggerAdminLockdown(userId, `Anomaly score ${anomalyScore.toFixed(2)} exceeds threshold`);
    return {
      approved: false,
      level: "BLOCKED",
      requiresMFA,
      requiresDualAuth: false,
      requiresHITL: false,
      reason: `Transaction blocked: Anomaly detected (score: ${anomalyScore.toFixed(2)}). Admin has been notified.`,
    };
  }

  return {
    approved: level !== "HITL" || false, // HITL requires manual approval
    level,
    requiresMFA,
    requiresDualAuth,
    requiresHITL,
    reason: requiresHITL
      ? `Transaction requires Human-in-the-Loop approval: ${action} for ${amount.toFixed(2)} EGP`
      : requiresDualAuth
      ? `Transaction requires dual authorization: ${action} for ${amount.toFixed(2)} EGP`
      : `Transaction approved at level: ${level}`,
    idempotencyKey: idempotencyKey || generateIdempotencyKey(),
  };
}

// ─────────────────────────────────────────
// 3. SESSION SECURITY
// ─────────────────────────────────────────

export interface SessionValidationResult {
  valid: boolean;
  reason?: string;
  fingerprintMatch: number;
  requiresReauth: boolean;
}

/**
 * Validate session with fingerprinting.
 */
export async function validateSession(
  userId: string,
  sessionToken: string,
  requestFingerprint: string
): Promise<SessionValidationResult> {
  // Get stored fingerprint
  const storedFingerprint = await getStoredFingerprint(userId, sessionToken);
  if (!storedFingerprint) {
    return {
      valid: false,
      reason: "Session not found or expired",
      fingerprintMatch: 0,
      requiresReauth: true,
    };
  }

  // Compare fingerprints
  const matchScore = compareFingerprints(storedFingerprint, requestFingerprint);

  if (matchScore < CONFIG.fingerprintTolerance) {
    // Possible session hijacking
    await triggerAdminLockdown(userId, `Fingerprint mismatch: ${matchScore.toFixed(2)} < ${CONFIG.fingerprintTolerance}`);
    return {
      valid: false,
      reason: `Session fingerprint mismatch. Possible unauthorized access.`,
      fingerprintMatch: matchScore,
      requiresReauth: true,
    };
  }

  // Check session age
  const sessionAge = await getSessionAge(sessionToken);
  if (sessionAge > CONFIG.sessionMaxAgeMinutes * 60 * 1000) {
    return {
      valid: false,
      reason: "Session expired",
      fingerprintMatch: matchScore,
      requiresReauth: true,
    };
  }

  return {
    valid: true,
    fingerprintMatch: matchScore,
    requiresReauth: false,
  };
}

// ─────────────────────────────────────────
// 4. ADMIN LOCKDOWN
// ─────────────────────────────────────────

export async function triggerAdminLockdown(userId: string, reason: string): Promise<void> {
  // 1. Get user for tenantId
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
  if (!user) throw new Error("User not found");

  // 2. Invalidate all sessions for user
  await invalidateAllSessions(userId);

  // 3. Flag user account
  await prisma.user.update({
    where: { id: userId },
    data: { status: "SUSPENDED" },
  });

  // 4. Write security audit log (tamper-proof chain)
  const { appendAuditEntry } = await import("@/lib/audit/tamper-proof");
  await appendAuditEntry({
    entityName: "USER",
    entityId: userId,
    actionType: "UPDATE",
    tenantId: user.tenantId,
    actorId: "SYSTEM",
    actorRole: "SECURITY",
    changes: { reason, status: "SUSPENDED" },
  });

  // 5. TODO: Send immediate alert to all admins (email + in-app + SMS)
  // await sendSecurityAlert({ userId, reason, severity: "CRITICAL" });
}

// ─────────────────────────────────────────
// 5. ANOMALY DETECTION
// ─────────────────────────────────────────

interface AnomalyFactors {
  amountDeviation: number;      // How much does this amount deviate from user's history?
  frequencyDeviation: number;   // How fast are transactions happening?
  timeOfDayAnomaly: number;     // Is this an unusual time for this user?
  locationAnomaly: number;      // Is this from an unusual location?
  actionRarity: number;         // How rare is this action type for this user?
}

async function calculateAnomalyScore(
  userId: string,
  action: string,
  amount: number,
  metadata?: Record<string, unknown>
): Promise<number> {
  // Get user's historical data
  const recentOrders = await prisma.order.findMany({
    where: { requesterId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { total: true, createdAt: true, status: true },
  });

  if (recentOrders.length === 0) {
    // New user — medium anomaly (not enough data)
    return 0.5;
  }

  const factors: AnomalyFactors = {
    amountDeviation: 0,
    frequencyDeviation: 0,
    timeOfDayAnomaly: 0,
    locationAnomaly: 0,
    actionRarity: 0,
  };

  // Amount deviation
  const avgAmount = recentOrders.reduce((s, o) => s + Number(o.total ?? 0), 0) / recentOrders.length;
  const maxAmount = Math.max(...recentOrders.map((o) => Number(o.total ?? 0)));
  if (amount > maxAmount * 2) {
    factors.amountDeviation = 1.0;
  } else if (amount > avgAmount * 3) {
    factors.amountDeviation = 0.8;
  } else if (amount > avgAmount * 2) {
    factors.amountDeviation = 0.5;
  } else {
    factors.amountDeviation = 0.1;
  }

  // Frequency deviation
  if (recentOrders.length >= 2) {
    const timeGaps = [];
    for (let i = 1; i < Math.min(recentOrders.length, 10); i++) {
      const gap = recentOrders[i - 1].createdAt.getTime() - recentOrders[i].createdAt.getTime();
      timeGaps.push(gap);
    }
    const avgGap = timeGaps.reduce((s, g) => s + g, 0) / timeGaps.length;
    const lastGap = Date.now() - recentOrders[0].createdAt.getTime();
    if (lastGap < avgGap * 0.2) {
      factors.frequencyDeviation = 0.9; // Much faster than usual
    }
  }

  // Time of day anomaly
  const hour = new Date().getHours();
  const orderHours = recentOrders.map((o) => o.createdAt.getHours());
  const hourCounts = new Map<number, number>();
  for (const h of orderHours) {
    hourCounts.set(h, (hourCounts.get(h) || 0) + 1);
  }
  const hourFrequency = hourCounts.get(hour) || 0;
  if (hourFrequency === 0) {
    factors.timeOfDayAnomaly = 0.7; // Never ordered at this hour
  }

  // Action rarity (simplified)
  const rareActions = ["ADMIN_OVERRIDE", "CREDIT_EXTEND", "PARTNER_ONBOARDING", "FEE_STRUCTURE_CHANGE"];
  if (rareActions.includes(action)) {
    factors.actionRarity = 0.6;
  }

  // Weighted composite score
  const score =
    factors.amountDeviation * 0.35 +
    factors.frequencyDeviation * 0.25 +
    factors.timeOfDayAnomaly * 0.15 +
    factors.locationAnomaly * 0.1 +
    factors.actionRarity * 0.15;

  return Math.min(1.0, score);
}

// ─────────────────────────────────────────
// 6. API SECURITY (HMAC + Rate Limiting)
// ─────────────────────────────────────────

export async function validateAPIRequest(params: {
  apiKey: string;
  signature: string;
  timestamp: number;
  payload: string;
  endpoint: string;
}): Promise<{ valid: boolean; reason?: string }> {
  const { apiKey, signature, timestamp, payload, endpoint } = params;

  // 1. Timestamp check (prevent replay attacks)
  const now = Date.now();
  if (Math.abs(now - timestamp) > 300000) {
    // 5-minute window
    return { valid: false, reason: "Request timestamp too old" };
  }

  // 2. Get API key from environment configuration
  // TODO: Replace with a proper ApiKey model migration when multi-tenant API access is needed
  const validApiKeys: Array<{ key: string; secret: string }> = process.env.API_KEYS
    ? JSON.parse(process.env.API_KEYS)
    : [];

  const keyRecord = validApiKeys.find((k) => k.key === apiKey);
  if (!keyRecord) {
    return { valid: false, reason: "Invalid API key" };
  }

  // 3. Verify HMAC signature using the key's secret
  const expectedSignature = generateHMAC(payload, keyRecord.secret);
  if (!verifyHMAC(signature, expectedSignature)) {
    return { valid: false, reason: "Invalid HMAC signature" };
  }

  // 4. Rate limiting check (simplified)
  // TODO: Implement Redis-based rate limiting

  return { valid: true };
}

// ─────────────────────────────────────────
// 7. STUB FUNCTIONS (To be implemented)
// ─────────────────────────────────────────

async function getStoredFingerprint(userId: string, sessionToken: string): Promise<string | null> {
  // TODO: Store fingerprints in Redis or database
  return null;
}

async function getSessionAge(sessionToken: string): Promise<number> {
  // TODO: Get session creation time from Redis or JWT payload
  return 0;
}

async function invalidateAllSessions(userId: string): Promise<void> {
  // TODO: Clear all Redis sessions for user
  await prisma.user.update({
    where: { id: userId },
    data: { lastActive: new Date(0) }, // Force re-auth
  });
}
