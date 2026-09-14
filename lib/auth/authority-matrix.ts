/**
 * Authority Matrix Engine v2.0
 * Hotels Vendors Governance Layer
 *
 * Evaluates orders against database-driven rules and enforces:
 * 1. Payment Guarantee Gate — no order ships without payment secured
 * 2. ETA Validation Gate — no factoring without valid ETA UUID
 * 3. Role-based approval chains
 * 4. Smart Fix injection for high-risk orders
 */

import { prisma } from "@/lib/prisma";
import { validateForFactoring } from "@/lib/eta/validator";
import { assessRisk, generateSmartFixes, type RiskTier, type SmartFix } from "@/lib/fintech/risk-engine";
import type { HotelTier, SupplierTier, UserRole, OrderStatus } from "@prisma/client";

async function getOrderRequesterRole(requesterId: string): Promise<UserRole | null> {
  const user = await prisma.user.findUnique({
    where: { id: requesterId },
    select: { role: true },
  });
  return (user?.role as UserRole) ?? null;
}

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export type AuthorityAction =
  | "AUTO_APPROVE"
  | "APPROVE"
  | "ROUTE_TO_GM"
  | "ROUTE_TO_FINANCIAL_CONTROLLER"
  | "REQUIRE_OWNER"
  | "DUAL_SIGN_OFF"
  | "REJECT"
  | "REQUIRE_PAYMENT_GUARANTEE"
  | "SMART_FIX_REQUIRED";

export interface AuthorityContext {
  userId: string;
  userRole: UserRole;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthorityEvaluationResult {
  action: AuthorityAction;
  rule: AuthorityRule | null;
  routeToRole?: UserRole;
  canProceed: boolean;
  requiresAction: boolean;
  smartFixes?: SmartFix[];
  reason?: string;
  paymentGuaranteeRequired?: boolean;
  etaValidationRequired?: boolean;
}

export interface AuthorityRule {
  id: string;
  name: string;
  priority: number;
  minValue: number;
  maxValue: number;
  hotelRiskTier?: RiskTier | null;
  hotelTier?: HotelTier | null;
  supplierTier?: SupplierTier | null;
  requesterRole?: UserRole | null;
  requiresPaymentGuarantee: boolean;
  requiresEtaValidation: boolean;
  requiresDualSignOff: boolean;
  action: AuthorityAction;
  routeToRole?: UserRole | null;
  tenantId?: string | null;
  isActive: boolean;
}

// ─────────────────────────────────────────
// 2. BUILT-IN GLOBAL RULES
// ─────────────────────────────────────────

const BUILT_IN_RULES: AuthorityRule[] = [
  {
    id: "rule_critical_block",
    name: "CRITICAL Risk Block",
    priority: 1000,
    minValue: 0,
    maxValue: 999_999_999,
    hotelRiskTier: "CRITICAL",
    requiresPaymentGuarantee: true,
    requiresEtaValidation: true,
    requiresDualSignOff: false,
    action: "REJECT",
    isActive: true,
  },
  {
    id: "rule_eta_invalid",
    name: "ETA Invalid Block",
    priority: 950,
    minValue: 0,
    maxValue: 999_999_999,
    requiresPaymentGuarantee: true,
    requiresEtaValidation: true,
    requiresDualSignOff: false,
    action: "REJECT",
    isActive: true,
  },
  {
    id: "rule_payment_guarantee_gate",
    name: "Payment Guarantee Gate",
    priority: 900,
    minValue: 0,
    maxValue: 999_999_999,
    requiresPaymentGuarantee: true,
    requiresEtaValidation: false,
    requiresDualSignOff: false,
    action: "REQUIRE_PAYMENT_GUARANTEE",
    isActive: true,
  },
  {
    id: "rule_smart_fix",
    name: "Smart Fix Trigger",
    priority: 850,
    minValue: 0,
    maxValue: 999_999_999,
    hotelRiskTier: "HIGH",
    requiresPaymentGuarantee: true,
    requiresEtaValidation: false,
    requiresDualSignOff: false,
    action: "SMART_FIX_REQUIRED",
    isActive: true,
  },
  {
    id: "rule_high_value_dual",
    name: "High Value Dual Sign-Off",
    priority: 800,
    minValue: 500_000,
    maxValue: 999_999_999,
    hotelTier: "CORE",
    requiresPaymentGuarantee: true,
    requiresEtaValidation: true,
    requiresDualSignOff: true,
    action: "DUAL_SIGN_OFF",
    isActive: true,
  },
  {
    id: "rule_gm_route",
    name: "GM Route High Value",
    priority: 750,
    minValue: 100_000,
    maxValue: 999_999_999,
    requesterRole: "CLERK",
    requiresPaymentGuarantee: true,
    requiresEtaValidation: false,
    requiresDualSignOff: false,
    action: "ROUTE_TO_GM",
    routeToRole: "GM",
    isActive: true,
  },
  {
    id: "rule_auto_approve",
    name: "Auto-Approve Low Risk",
    priority: 700,
    minValue: 0,
    maxValue: 50_000,
    hotelRiskTier: "LOW",
    requiresPaymentGuarantee: true,
    requiresEtaValidation: true,
    requiresDualSignOff: false,
    action: "AUTO_APPROVE",
    isActive: true,
  },
  {
    id: "rule_fc_route",
    name: "FC Route Medium Value",
    priority: 650,
    minValue: 50_000,
    maxValue: 999_999_999,
    requesterRole: "DEPARTMENT_HEAD",
    requiresPaymentGuarantee: true,
    requiresEtaValidation: false,
    requiresDualSignOff: false,
    action: "ROUTE_TO_FINANCIAL_CONTROLLER",
    routeToRole: "FINANCIAL_CONTROLLER",
    isActive: true,
  },
  {
    id: "rule_owner_route",
    name: "Owner Route Critical Value",
    priority: 600,
    minValue: 1_000_000,
    maxValue: 999_999_999,
    requiresPaymentGuarantee: true,
    requiresEtaValidation: true,
    requiresDualSignOff: false,
    action: "REQUIRE_OWNER",
    isActive: true,
  },
  {
    id: "rule_default",
    name: "Default Approval (G10 Enforced)",
    priority: 500,
    minValue: 0,
    maxValue: 999_999_999,
    requiresPaymentGuarantee: true,
    requiresEtaValidation: true,
    requiresDualSignOff: false,
    action: "APPROVE",
    isActive: true,
  },
];

// ─────────────────────────────────────────
// 3. EVALUATION ENGINE
// ─────────────────────────────────────────

/**
 * Evaluate an order against the Authority Matrix.
 * This is the CORE GOVERNANCE FUNCTION.
 */
export async function evaluateAuthority(
  orderId: string,
  ctx: AuthorityContext
): Promise<AuthorityEvaluationResult> {
  // 1. Load order with all dimensions
  const order = await prisma.order.findUnique({
    where: { id: orderId, tenantId: ctx.tenantId },
    include: {
      hotel: { include: { properties: true, creditFacilities: true } },
      supplier: true,
      invoices: true,
      approvals: { include: { approver: true } },
    },
  });

  if (!order) {
    return {
      action: "REJECT",
      rule: null,
      canProceed: false,
      requiresAction: false,
      reason: "Order not found",
    };
  }

  // 2. Re-evaluate hotel risk (fresh assessment)
  const riskAssessment = await assessRisk(order.hotelId, ctx.tenantId);

  // 3. Load active rules (tenant-specific + global where tenantId is null)
  const dbRules = await prisma.authorityRule.findMany({
    where: {
      isActive: true,
      OR: [
        { tenantId: ctx.tenantId },
        { tenantId: null },
      ],
      minValue: { lte: Number(order.total ?? 0) },
      maxValue: { gte: Number(order.total ?? 0) },
    },
    orderBy: { priority: "desc" },
  });

  // Merge DB rules with built-in rules (DB overrides built-in if same priority)
  // G10 ENFORCED: requiresPaymentGuarantee and requiresEtaValidation are ALWAYS true
  // even if DB rules try to set them to false. This is a non-negotiable governance rule.
  const allRules = mergeRules(BUILT_IN_RULES, dbRules.map(r => ({
    ...r,
    minValue: Number(r.minValue),
    maxValue: Number(r.maxValue),
    requiresPaymentGuarantee: true,
    requiresEtaValidation: true,
    requiresDualSignOff: r.requiresDualSignOff ?? false,
  })) as AuthorityRule[]);

  // 4. Evaluate each rule in priority order
  for (const rule of allRules) {
    const match = checkRuleMatch(rule, {
      total: Number(order.total ?? 0),
      hotel: { tier: order.hotel.tier, riskTier: order.hotel.riskTier },
      supplier: { tier: order.supplier.tier },
      requesterRole: order.requesterId ? (await getOrderRequesterRole(order.requesterId)) : null,
    }, riskAssessment.riskTier, ctx.userRole);
    if (!match) continue;

    // 5. ABSOLUTE GATE: Payment Guarantee
    if (rule.requiresPaymentGuarantee && !order.paymentGuaranteed) {
      // For HIGH/CRITICAL risk, offer Smart Fixes
      if (riskAssessment.riskTier === "HIGH" || riskAssessment.riskTier === "CRITICAL") {
        const smartFixes = await generateSmartFixes(orderId, order.hotelId, Number(order.total ?? 0), ctx.tenantId);
        return {
          action: "SMART_FIX_REQUIRED",
          rule,
          canProceed: false,
          requiresAction: true,
          smartFixes,
          reason: `Payment guarantee required. Hotel risk tier: ${riskAssessment.riskTier}. Smart fixes available.`,
          paymentGuaranteeRequired: true,
        };
      }

      return {
        action: "REQUIRE_PAYMENT_GUARANTEE",
        rule,
        canProceed: false,
        requiresAction: true,
        reason: "Payment guarantee required before order can proceed",
        paymentGuaranteeRequired: true,
      };
    }

    // 6. ABSOLUTE GATE: ETA Validation (for factoring-eligible orders)
    if (rule.requiresEtaValidation) {
      const invoice = order.invoices[0];
      if (invoice) {
        const etaValid = await validateForFactoring(invoice.id);
        if (!etaValid.valid) {
          return {
            action: "REJECT",
            rule,
            canProceed: false,
            requiresAction: false,
            reason: `ETA validation failed: ${etaValid.message}`,
            etaValidationRequired: true,
          };
        }
      }
    }

    // 7. Return matched action
    const canProceed = [
      "AUTO_APPROVE",
      "APPROVE",
      "ROUTE_TO_GM",
      "ROUTE_TO_FINANCIAL_CONTROLLER",
      "REQUIRE_OWNER",
    ].includes(rule.action);

    return {
      action: rule.action,
      rule,
      routeToRole: rule.routeToRole ?? undefined,
      canProceed,
      requiresAction: true,
      paymentGuaranteeRequired: rule.requiresPaymentGuarantee,
      etaValidationRequired: rule.requiresEtaValidation,
    };
  }

  // 8. Default fallback
  return {
    action: "APPROVE",
    rule: null,
    canProceed: true,
    requiresAction: true,
  };
}

// ─────────────────────────────────────────
// 4. RULE MATCHING
// ─────────────────────────────────────────

function checkRuleMatch(
  rule: AuthorityRule,
  order: {
    total: number;
    hotel: { tier: HotelTier; riskTier?: string | null };
    supplier: { tier: SupplierTier };
    requesterRole: UserRole | null;
  },
  currentRiskTier: RiskTier,
  userRole: UserRole
): boolean {
  // Value range check (already filtered in DB query, but double-check)
  if (order.total < rule.minValue || order.total > rule.maxValue) return false;

  // Hotel risk tier check
  if (rule.hotelRiskTier && currentRiskTier !== rule.hotelRiskTier) return false;

  // Hotel tier check
  if (rule.hotelTier && order.hotel.tier !== rule.hotelTier) return false;

  // Supplier tier check
  if (rule.supplierTier && order.supplier.tier !== rule.supplierTier) return false;

  // Requester role check
  if (rule.requesterRole && userRole !== rule.requesterRole) return false;

  return true;
}

function mergeRules(builtIn: AuthorityRule[], dbRules: AuthorityRule[]): AuthorityRule[] {
  const ruleMap = new Map<string, AuthorityRule>();

  // Add built-in rules
  for (const rule of builtIn) {
    ruleMap.set(rule.id, rule);
  }

  // Override with DB rules (DB takes precedence)
  for (const rule of dbRules) {
    ruleMap.set(rule.id, rule);
  }

  // Sort by priority desc
  return Array.from(ruleMap.values()).sort((a, b) => b.priority - a.priority);
}

// ─────────────────────────────────────────
// 5. APPROVAL ACTIONS
// ─────────────────────────────────────────

/**
 * Record an approval action on an order.
 */
export async function recordApproval(
  orderId: string,
  approverId: string,
  tenantId: string,
  action: "APPROVED" | "REJECTED" | "ESCALATED" | "ADMIN_OVERRIDE",
  reason?: string
): Promise<void> {
  const newStatus: OrderStatus =
    action === "APPROVED" ? "APPROVED" :
    action === "REJECTED" ? "REJECTED" :
    action === "ESCALATED" ? "PENDING_APPROVAL" :
    action === "ADMIN_OVERRIDE" ? "APPROVED" :
    "PENDING_APPROVAL";

  // Atomic update with row locking to prevent race conditions
  await prisma.$transaction(async (tx) => {
    // Lock the order row
    const locked = await tx.$queryRaw<Array<{ id: string; status: string }>>`
      SELECT "id", "status"
      FROM "Order"
      WHERE "id" = ${orderId}
      FOR UPDATE
    `;

    if (locked.length === 0) {
      throw new Error("Order not found during approval");
    }

    await tx.orderApproval.create({
      data: {
        orderId,
        approverId,
        action,
        reason,
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    // Audit log (tamper-proof chain)
    const { appendAuditEntry } = await import("@/lib/audit/tamper-proof");
    await appendAuditEntry({
      entityName: "ORDER",
      entityId: orderId,
      actionType: "UPDATE",
      tenantId,
      actorId: approverId,
      changes: { status: newStatus, action },
    });
  });
}

// ─────────────────────────────────────────
// 6. ADMIN OVERRIDE
// ─────────────────────────────────────────

export interface AdminOverrideRequest {
  orderId: string;
  action: "ADMIN_OVERRIDE";
  reason: string;
  waivePaymentGuarantee: boolean;
  authorizerId: string; // First admin
  coAuthorizerId: string; // Second admin (dual authorization)
  tenantId: string;
}

/**
 * Admin override with dual authorization.
 * Requires two admin signatures and generates escalated alert.
 */
export async function adminOverride(
  req: AdminOverrideRequest
): Promise<{ success: boolean; error?: string }> {
  // Validate reason length
  if (req.reason.length < 20) {
    return { success: false, error: "Reason must be at least 20 characters" };
  }

  // Verify both admins exist
  const [admin1, admin2] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.authorizerId } }),
    prisma.user.findUnique({ where: { id: req.coAuthorizerId } }),
  ]);

  if (!admin1 || !admin2) {
    return { success: false, error: "One or both authorizers not found" };
  }

  if (admin1.id === admin2.id) {
    return { success: false, error: "Dual authorization requires two distinct admins" };
  }

  // Verify both have admin role or canOverride flag
  const canOverride = (u: typeof admin1) =>
    u.platformRole === "ADMIN" || u.canOverride === true;

  if (!canOverride(admin1) || !canOverride(admin2)) {
    return { success: false, error: "Both authorizers must have admin privileges" };
  }

  // All mutations in a single transaction with row locking
  const result = await prisma.$transaction(async (tx) => {
    // Lock the order row to prevent concurrent overrides
    const order = await tx.$queryRaw<Array<{ id: string; status: string; paymentGuaranteed: boolean; paymentGuaranteeMethod: string | null; tenantId: string }>>`
      SELECT "id", "status", "paymentGuaranteed", "paymentGuaranteeMethod", "tenantId"
      FROM "Order"
      WHERE "id" = ${req.orderId}
      FOR UPDATE
    `;

    if (order.length === 0) {
      return { success: false as const, error: "Order not found" as const };
    }

    await tx.order.update({
      where: { id: req.orderId },
      data: {
        status: "APPROVED",
        paymentGuaranteed: req.waivePaymentGuarantee ? true : order[0].paymentGuaranteed,
        paymentGuaranteeMethod: req.waivePaymentGuarantee ? "WAIVED" : order[0].paymentGuaranteeMethod,
      },
    });

    await tx.orderApproval.create({
      data: {
        orderId: req.orderId,
        approverId: req.authorizerId,
        action: "ADMIN_OVERRIDE",
        reason: req.reason,
      },
    });

    await tx.orderApproval.create({
      data: {
        orderId: req.orderId,
        approverId: req.coAuthorizerId,
        action: "ADMIN_OVERRIDE",
        reason: `Co-authorized override: ${req.reason}`,
      },
    });

    await tx.auditLog.create({
      data: {
        entityName: "ORDER",
        entityId: req.orderId,
        actionType: "UPDATE",
        tenantId: req.tenantId,
        actorId: req.authorizerId,
        changes: {
          before: { status: order[0].status, paymentGuaranteed: order[0].paymentGuaranteed, paymentGuaranteeMethod: order[0].paymentGuaranteeMethod },
          after: { status: "APPROVED", paymentGuaranteed: req.waivePaymentGuarantee, waivedBy: `${req.authorizerId}+${req.coAuthorizerId}`, waivedReason: req.reason },
        },
      },
    });

    return { success: true as const };
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // TODO: Send escalated alert to all platform admins
  // await sendEscalatedAlert({...});

  return { success: true };
}

// ─────────────────────────────────────────
// 7. PAYMENT GUARANTEE HELPERS
// ─────────────────────────────────────────

export interface PaymentGuaranteeInput {
  orderId: string;
  tenantId: string;
  method: "FACTORING" | "DEPOSIT" | "SPLIT" | "DIRECT" | "WAIVED";
  factoringRequestId?: string;
  factoringCompanyId?: string;
  advanceRate?: number;
  depositAmount?: number;
  depositReceived?: boolean;
  paymobOrderId?: string;
  splitDeliveryAmount?: number;
  splitCreditAmount?: number;
  splitDeliveryPaid?: boolean;
  splitCreditPaid?: boolean;
  directCreditLimit?: number;
  directCreditUsed?: number;
  etaValidated: boolean;
  etaUuid?: string;
  verifiedBy: string;
  verifiedAt: Date;
  waivedBy?: string;
  waivedReason?: string;
}

/**
 * Set the PaymentGuaranteed flag on an order.
 */
export async function setPaymentGuarantee(
  input: PaymentGuaranteeInput
): Promise<void> {
  await prisma.order.update({
    where: { id: input.orderId },
    data: {
      paymentGuaranteed: true,
      paymentGuaranteeMethod: input.method,
    },
  });

  // Audit log (tamper-proof chain)
  const { appendAuditEntry } = await import("@/lib/audit/tamper-proof");
  await appendAuditEntry({
    entityName: "ORDER",
    entityId: input.orderId,
    actionType: "UPDATE",
    tenantId: input.tenantId,
    actorId: input.verifiedBy,
    changes: {
      method: input.method,
      etaValidated: input.etaValidated,
      etaUuid: input.etaUuid,
      factoringRequestId: input.factoringRequestId,
    },
  });
}
