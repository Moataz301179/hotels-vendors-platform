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
import type { HotelTier, SupplierTier, UserRole, OrderStatus, Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api-utils";
import { randomUUID } from "node:crypto";

async function getOrderRequesterRole(requesterId: string, tenantId: string): Promise<UserRole | null> {
  const user = await prisma.user.findUnique({
    where: { id: requesterId, tenantId },
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
  // G10 payment guarantees are absolute. ETA is mandatory for factoring;
  // explicitly configured database ETA requirements also remain enforceable.
  const allRules = mergeRules(BUILT_IN_RULES, dbRules.map(r => ({
    ...r,
    minValue: Number(r.minValue),
    maxValue: Number(r.maxValue),
    requiresPaymentGuarantee: true,
    requiresEtaValidation: r.requiresEtaValidation,
    requiresDualSignOff: r.requiresDualSignOff ?? false,
  })) as AuthorityRule[]);
  const databaseRuleIds = new Set(dbRules.map(rule => rule.id));

  // 4. Evaluate each rule in priority order
  for (const rule of allRules) {
    const etaRequired = order.paymentGuaranteeMethod === "FACTORING" || (databaseRuleIds.has(rule.id) && rule.requiresEtaValidation);
    if (rule.id === "rule_eta_invalid" && !etaRequired) continue;
    const match = checkRuleMatch(rule, {
      total: Number(order.total ?? 0),
      hotel: { tier: order.hotel.tier, riskTier: order.hotel.riskTier },
      supplier: { tier: order.supplier.tier },
      requesterRole: order.requesterId ? (await getOrderRequesterRole(order.requesterId, ctx.tenantId)) : null,
    }, riskAssessment.riskTier);
    if (!match) continue;
    if (rule.id === "rule_critical_block" && order.paymentGuaranteed) continue;
    if (["rule_eta_invalid", "rule_payment_guarantee_gate", "rule_smart_fix"].includes(rule.id) && order.paymentGuaranteed) {
      if (rule.id !== "rule_eta_invalid") continue;
      const invoice = order.invoices[0];
      if (invoice && (await validateForFactoring(invoice.id)).valid) continue;
    }

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
    if (etaRequired) {
      const invoice = order.invoices[0];
      if (!invoice) return { action: "REJECT", rule, canProceed: false, requiresAction: true, reason: "Invoice required for ETA validation", etaValidationRequired: true };
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
      etaValidationRequired: etaRequired,
    };
  }

  // 8. Default fallback
  return {
    action: "REJECT",
    rule: null,
    canProceed: false,
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
  currentRiskTier: RiskTier
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
  if (rule.requesterRole && order.requesterRole !== rule.requesterRole) return false;

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
  if (action === "ADMIN_OVERRIDE") throw new ApiError("Use the dual authorization override flow", 403);
  const approver = await prisma.user.findFirst({ where: { id: approverId, tenantId }, select: { role: true } });
  if (!approver) throw new ApiError("Approver not found", 404);
  const scopedOrder = await prisma.order.findFirst({ where: { id: orderId, tenantId }, select: { requesterId: true } });
  if (!scopedOrder) throw new ApiError("Order not found", 404);
  if (scopedOrder.requesterId === approverId) throw new ApiError("Self approval is not allowed", 403);
  if (action === "APPROVED") {
    const evaluation = await evaluateAuthority(orderId, { userId: approverId, userRole: approver.role, tenantId });
    if (!evaluation.canProceed || (evaluation.routeToRole && evaluation.routeToRole !== approver.role) || (evaluation.action === "REQUIRE_OWNER" && approver.role !== "OWNER")) throw new ApiError(evaluation.reason ?? "Authority Matrix approval requirements are not satisfied", 403);
  }
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
      WHERE "id" = ${orderId} AND "tenantId" = ${tenantId}
      FOR UPDATE
    `;

    if (locked.length === 0) {
      throw new Error("Order not found during approval");
    }
    if (action === "REJECTED") await releaseGuaranteeReservations(tx, orderId, tenantId, approverId);

    await tx.orderApproval.create({
      data: {
        orderId,
        approverId,
        action,
        reason,
      },
    });

    await tx.order.update({
      where: { id: orderId, tenantId },
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
    }, tx);
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
  coAuthorizerId?: string; // Legacy hint only; never proof of authorization
  tenantId: string;
}

/**
 * Admin override with dual authorization.
 * Requires two admin signatures and generates escalated alert.
 */
export async function adminOverride(
  req: AdminOverrideRequest
): Promise<{ success: boolean; error?: string; pending?: boolean; requestId?: string }> {
  const { getUserPermissions } = await import("@/lib/auth/rbac");
  // Validate reason length
  if (req.reason.length < 20) {
    return { success: false, error: "Reason must be at least 20 characters" };
  }

  const admin = await prisma.user.findFirst({ where: { id: req.authorizerId, tenantId: req.tenantId, platformRole: "ADMIN", status: "ACTIVE", deletedAt: null, tenant: { status: "ACTIVE", deletedAt: null } } });
  if (!admin) return { success: false, error: "Authenticated platform admin required" };

  // All mutations in a single transaction with row locking
  const result = await prisma.$transaction(async (tx) => {
    const currentPermissions = await getUserPermissions({ userId: admin.id, tenantId: req.tenantId, platformRole: "ADMIN" }, tx);
    if (!currentPermissions.includes("admin:override_authority")) return { success: false as const, error: "Current authorizer no longer has override permission" };
    // Lock the order row to prevent concurrent overrides
    const order = await tx.$queryRaw<Array<{ id: string; status: string; paymentGuaranteed: boolean; paymentGuaranteeMethod: string | null; tenantId: string }>>`
      SELECT "id", "status", "paymentGuaranteed", "paymentGuaranteeMethod", "tenantId"
      FROM "Order"
      WHERE "id" = ${req.orderId} AND "tenantId" = ${req.tenantId}
      FOR UPDATE
    `;

    if (order.length === 0) {
      return { success: false as const, error: "Order not found" as const };
    }

    const snapshot = JSON.stringify(order[0]);
    const candidates = await tx.auditLog.findMany({ where: { tenantId: req.tenantId, entityName: "ORDER", entityId: req.orderId, createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, orderBy: { createdAt: "desc" }, take: 100 });
    const completed = new Set(candidates.flatMap((entry) => {
      const value = entry.changes;
      return value && typeof value === "object" && !Array.isArray(value) && value.kind === "AUTHORITY_OVERRIDE_APPLIED" && typeof value.requestId === "string" ? [value.requestId] : [];
    }));
    const pending = candidates.find((entry) => {
      const value = entry.changes;
      return !completed.has(entry.id) && value && typeof value === "object" && !Array.isArray(value) && value.kind === "AUTHORITY_OVERRIDE_REQUEST" && value.reason === req.reason && value.waivePaymentGuarantee === req.waivePaymentGuarantee && value.snapshot === snapshot;
    });
    if (!pending) {
      const { appendAuditEntry } = await import("@/lib/audit/tamper-proof");
      const requestId = await appendAuditEntry({ tenantId: req.tenantId, entityName: "ORDER", entityId: req.orderId, actionType: "UPDATE", actorId: admin.id, actorRole: admin.role, changes: { kind: "AUTHORITY_OVERRIDE_REQUEST", reason: req.reason, waivePaymentGuarantee: req.waivePaymentGuarantee, snapshot } }, tx);
      return { success: true as const, pending: true, requestId };
    }
    if (pending.actorId === admin.id) return { success: false as const, error: "A second independently authenticated admin must authorize this request" };
    const firstAdmin = await tx.user.findFirst({ where: { id: pending.actorId ?? "", tenantId: req.tenantId, platformRole: "ADMIN", status: "ACTIVE", deletedAt: null, tenant: { status: "ACTIVE", deletedAt: null } } });
    if (!firstAdmin) return { success: false as const, error: "First authorizer is no longer an eligible admin" };
    const firstPermissions = await getUserPermissions({ userId: firstAdmin.id, tenantId: req.tenantId, platformRole: "ADMIN" }, tx);
    if (!firstPermissions.includes("admin:override_authority")) return { success: false as const, error: "First authorizer no longer has override permission" };

    await tx.order.update({
      where: { id: req.orderId, tenantId: req.tenantId },
      data: {
        status: "APPROVED",
        paymentGuaranteed: req.waivePaymentGuarantee ? true : order[0].paymentGuaranteed,
        paymentGuaranteeMethod: req.waivePaymentGuarantee ? "WAIVED" : order[0].paymentGuaranteeMethod,
      },
    });

    await tx.orderApproval.create({
      data: {
        orderId: req.orderId,
        approverId: firstAdmin.id,
        action: "ADMIN_OVERRIDE",
        reason: req.reason,
      },
    });

    await tx.orderApproval.create({
      data: {
        orderId: req.orderId,
        approverId: admin.id,
        action: "ADMIN_OVERRIDE",
        reason: `Co-authorized override: ${req.reason}`,
      },
    });

    const { appendAuditEntry } = await import("@/lib/audit/tamper-proof");
    await appendAuditEntry({
        entityName: "ORDER",
        entityId: req.orderId,
        actionType: "UPDATE",
        tenantId: req.tenantId,
        actorId: req.authorizerId,
        changes: {
          kind: "AUTHORITY_OVERRIDE_APPLIED",
          requestId: pending.id,
          before: { status: order[0].status, paymentGuaranteed: order[0].paymentGuaranteed, paymentGuaranteeMethod: order[0].paymentGuaranteeMethod },
          after: { status: "APPROVED", paymentGuaranteed: req.waivePaymentGuarantee || order[0].paymentGuaranteed, waivedBy: `${firstAdmin.id}+${admin.id}`, waivedReason: req.reason },
        },
    }, tx);

    const admins = await tx.user.findMany({ where: { tenantId: req.tenantId, platformRole: "ADMIN" }, select: { id: true } });
    await tx.notification.createMany({ data: admins.map((recipient) => ({ id: randomUUID(), tenantId: req.tenantId, userId: recipient.id, type: "SYSTEM", channel: "IN_APP", subject: "Escalated Authority Matrix override", body: `Order ${req.orderId} overridden by ${firstAdmin.id} and ${admin.id}. Reason: ${req.reason}` })) });
    return { success: true as const, pending: false, requestId: pending.id };
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return result;
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

export async function releaseGuaranteeReservations(tx: Prisma.TransactionClient, orderId: string, tenantId: string, actorId: string): Promise<void> {
  const entries = await tx.auditLog.findMany({ where: { tenantId, entityName: "ORDER", entityId: orderId }, orderBy: { createdAt: "desc" }, take: 100 });
  const released = new Set(entries.flatMap((entry) => {
    const value = entry.changes;
    return value && typeof value === "object" && !Array.isArray(value) && value.kind === "GUARANTEE_RESERVATIONS_RELEASED" && typeof value.guaranteeAuditId === "string" ? [value.guaranteeAuditId] : [];
  }));
  const guarantee = entries.find((entry) => { const value = entry.changes; return !released.has(entry.id) && value && typeof value === "object" && !Array.isArray(value) && Array.isArray(value.creditReservations); });
  if (!guarantee) return;
  const changes = guarantee.changes;
  if (!changes || typeof changes !== "object" || Array.isArray(changes) || !Array.isArray(changes.creditReservations)) return;
  for (const allocation of changes.creditReservations) {
    if (!allocation || typeof allocation !== "object" || Array.isArray(allocation) || typeof allocation.facilityId !== "string" || typeof allocation.amount !== "number" || allocation.amount <= 0) throw new ApiError("Invalid guarantee reservation audit", 409);
    const updated = await tx.creditFacility.updateMany({ where: { id: allocation.facilityId, tenantId, utilized: { gte: allocation.amount } }, data: { utilized: { decrement: allocation.amount } } });
    if (updated.count !== 1) throw new ApiError("Credit reservation cannot be safely released", 409);
  }
  await tx.order.update({ where: { id: orderId, tenantId }, data: { paymentGuaranteed: false, paymentGuaranteeMethod: null } });
  const { appendAuditEntry } = await import("@/lib/audit/tamper-proof");
  await appendAuditEntry({ tenantId, entityName: "ORDER", entityId: orderId, actorId, actionType: "UPDATE", changes: { kind: "GUARANTEE_RESERVATIONS_RELEASED", guaranteeAuditId: guarantee.id } }, tx);
}

/**
 * Set the PaymentGuaranteed flag on an order.
 */
export async function setPaymentGuarantee(
  input: PaymentGuaranteeInput
): Promise<void> {
  await prisma.$transaction(async (tx) => {
  await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${input.orderId} AND "tenantId" = ${input.tenantId} FOR UPDATE`;
  const order = await tx.order.findFirst({ where: { id: input.orderId, tenantId: input.tenantId }, include: { invoices: true } });
  if (!order) throw new ApiError("Order not found", 404);
  if (input.method === "WAIVED") throw new ApiError("Waivers require dual admin authorization", 403);
  if (order.paymentGuaranteed) return;
  // Serialize credit reservations for all orders belonging to this hotel.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${order.hotelId}), hashtext(${input.tenantId}))`;
  const total = Number(order.total ?? 0);
  const creditReservations: { facilityId: string; amount: number }[] = [];
  if (!Number.isFinite(total) || total <= 0) throw new ApiError("Invalid order value", 409);
  if (input.method === "FACTORING") {
    const funding = await tx.factoringRequest.findFirst({ where: { id: input.factoringRequestId ?? "", tenantId: input.tenantId, isNonRecourse: true, status: { in: ["DISBURSED", "SETTLED"] }, invoice: { orderId: order.id, tenantId: input.tenantId } } });
    if (!funding?.invoiceId || !funding.disbursedAt || Number(funding.grossAmount ?? funding.requestedAmount ?? 0) < total || !(await validateForFactoring(funding.invoiceId)).valid) throw new ApiError("Verified factoring disbursement and ETA validation required", 409);
  } else {
    const paid = await tx.payment.aggregate({ where: { tenantId: input.tenantId, hotelId: order.hotelId, status: "PAID", currency: order.currency, invoice: { orderId: order.id, tenantId: input.tenantId } }, _sum: { amount: true } });
    const paidAmount = Number(paid._sum.amount ?? 0);
    if (input.method === "DEPOSIT" && paidAmount < total * 0.2) throw new ApiError("Verified deposit of at least 20% required", 409);
    if (input.method === "SPLIT" && paidAmount < total * 0.5) throw new ApiError("Verified split payment of at least 50% required", 409);
    const remaining = Math.max(0, total - paidAmount);
    if (remaining > 0) {
      if (order.currency !== "EGP") throw new ApiError("Credit facility currency cannot cover this order", 409);
      await tx.$queryRaw`SELECT "id" FROM "CreditFacility" WHERE "hotelId" = ${order.hotelId} AND "tenantId" = ${input.tenantId} FOR UPDATE`;
      const facilities = await tx.creditFacility.findMany({ where: { hotelId: order.hotelId, tenantId: input.tenantId, status: "ACTIVE", approvedAt: { not: null }, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, orderBy: { id: "asc" } });
      const available = facilities.reduce((sum, f) => sum + Math.max(0, Number(f.limit ?? 0) - Number(f.utilized ?? 0)), 0);
      if (available < remaining) throw new ApiError("Verified credit facility required for unpaid balance", 409);
      let toReserve = remaining;
      for (const facility of facilities) {
        const amount = Math.min(toReserve, Math.max(0, Number(facility.limit ?? 0) - Number(facility.utilized ?? 0)));
        if (amount > 0) {
          await tx.creditFacility.update({ where: { id: facility.id, tenantId: input.tenantId }, data: { utilized: Number(facility.utilized ?? 0) + amount } });
          creditReservations.push({ facilityId: facility.id, amount });
        }
        toReserve -= amount;
        if (toReserve <= 0) break;
      }
    }
  }
  await tx.order.update({
    where: { id: input.orderId, tenantId: input.tenantId },
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
      etaValidated: input.method === "FACTORING",
      factoringRequestId: input.factoringRequestId,
      creditReservations,
    },
  }, tx);
  });
}
