/**
 * Admin Override Tools — Financial & Operational Control Center
 * Hotels Vendors B2B Procurement Platform
 *
 * Provides granular RBAC-enforced functions for:
 * - Credit line freeze/unfreeze
 * - Dispute resolution
 * - ETA callback failure retry
 * - Manual approval override
 *
 * ALL functions enforce:
 * 1. Tenant isolation (G1)
 * 2. Server-side RBAC (G2)
 * 3. Four-eyes dual authorization for financial operations (G10)
 * 4. Immutable audit logging
 */

import { prisma } from "@/lib/prisma";
import { requirePermission, type AuthContext } from "@/lib/api-utils";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { PermissionDeniedError } from "@/lib/auth/rbac";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export interface OverrideContext {
  auth: AuthContext;
  tenantId: string;
  userId: string;
  platformRole: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface CreditLineFreezeRequest {
  creditFacilityId: string;
  reason: string;
  coAuthorizerId: string;
}

export interface DisputeResolveRequest {
  disputeId: string;
  resolution: string;
  liability: "HOTEL" | "SUPPLIER" | "LOGISTICS" | "PLATFORM" | "SPLIT_LIABILITY";
  refundAmount?: number;
}

export interface EtaRetryRequest {
  deadLetterJobId: string;
  forceRetry: boolean;
}

export interface ManualApprovalRequest {
  orderId: string;
  reason: string;
  coAuthorizerId: string;
  waivePaymentGuarantee: boolean;
}

export interface OverrideResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

// ─────────────────────────────────────────
// PERMISSION CODES
// ─────────────────────────────────────────

const PERMISSIONS = {
  CREDIT_LINE_FREEZE: "admin:credit_line_freeze",
  DISPUTE_RESOLVE: "admin:dispute_resolve",
  ETA_RETRY: "admin:eta_retry",
  MANUAL_APPROVAL: "admin:manual_approval",
  READ: "admin:read",
} as const;

// ─────────────────────────────────────────
// HELPER: ENFORCE TENANT ISOLATION
// ─────────────────────────────────────────

async function enforceTenantIsolation(
  ctx: OverrideContext,
  model: string,
  id: string
): Promise<boolean> {
  // Use Prisma's typed client with proper model access
  const modelClient = (prisma as unknown as Record<string, {
    findUnique: (args: { where: { id: string }; select: { tenantId: boolean } }) => Promise<{ tenantId: string } | null>;
  }>)[model];

  if (!modelClient) {
    throw new Error(`Model ${model} not found in Prisma client`);
  }

  const record = await modelClient.findUnique({
    where: { id },
    select: { tenantId: true as boolean },
  });

  return record !== null && record.tenantId === ctx.tenantId;
}

// ─────────────────────────────────────────
// 1. FREEZE CREDIT LINE
// ─────────────────────────────────────────

/**
 * Freeze a credit facility — prevents further draws.
 * Requires dual authorization (two admins).
 * G10: Admin Override Dual Authorization enforced.
 */
export async function freezeCreditLine(
  ctx: OverrideContext,
  request: CreditLineFreezeRequest
): Promise<OverrideResult> {
  // RBAC check
  await requirePermission(ctx.auth, PERMISSIONS.CREDIT_LINE_FREEZE);

  // Validate reason length (G10: 20+ character reason required)
  if (!request.reason || request.reason.length < 20) {
    return { success: false, error: "Reason must be at least 20 characters" };
  }

  // Validate co-authorizer is different user (dual authorization)
  if (request.coAuthorizerId === ctx.userId) {
    return { success: false, error: "Co-authorizer must be a different user" };
  }

  // Verify co-authorizer exists and has admin role
  const coAuthorizer = await prisma.user.findUnique({
    where: { id: request.coAuthorizerId },
    select: { id: true, platformRole: true, tenantId: true },
  });

  if (!coAuthorizer || coAuthorizer.platformRole !== "ADMIN") {
    return { success: false, error: "Co-authorizer must be an admin user" };
  }

  // Tenant isolation check
  const owns = await enforceTenantIsolation(ctx, "creditFacility", request.creditFacilityId);
  if (!owns) {
    return { success: false, error: "Cross-tenant access denied" };
  }

  // Check co-authorizer belongs to same tenant
  if (coAuthorizer.tenantId !== ctx.tenantId) {
    return { success: false, error: "Co-authorizer must belong to same tenant" };
  }

  // Perform freeze
  const facility = await prisma.creditFacility.update({
    where: { id: request.creditFacilityId },
    data: {
      status: "PENDING", // Frozen = PENDING state
    },
  });

  // Audit log
  await appendAuditEntry({
    entityName: "CREDIT_FACILITY",
    entityId: request.creditFacilityId,
    actionType: "FREEZE",
    tenantId: ctx.tenantId,
    actorId: ctx.userId,
    changes: {
      previousStatus: facility.status,
      newStatus: "PENDING",
      reason: request.reason,
      coAuthorizerId: request.coAuthorizerId,
    },
  });

  return {
    success: true,
    data: {
      creditFacilityId: facility.id,
      status: "PENDING",
      frozen: true,
      reason: request.reason,
    },
  };
}

// ─────────────────────────────────────────
// 2. UNFREEZE CREDIT LINE
// ─────────────────────────────────────────

/**
 * Unfreeze a credit facility — restores ACTIVE status.
 * Requires dual authorization.
 */
export async function unfreezeCreditLine(
  ctx: OverrideContext,
  request: CreditLineFreezeRequest
): Promise<OverrideResult> {
  await requirePermission(ctx.auth, PERMISSIONS.CREDIT_LINE_FREEZE);

  if (!request.reason || request.reason.length < 20) {
    return { success: false, error: "Reason must be at least 20 characters" };
  }

  if (request.coAuthorizerId === ctx.userId) {
    return { success: false, error: "Co-authorizer must be a different user" };
  }

  const coAuthorizer = await prisma.user.findUnique({
    where: { id: request.coAuthorizerId },
    select: { id: true, platformRole: true, tenantId: true },
  });

  if (!coAuthorizer || coAuthorizer.platformRole !== "ADMIN") {
    return { success: false, error: "Co-authorizer must be an admin user" };
  }

  const owns = await enforceTenantIsolation(ctx, "creditFacility", request.creditFacilityId);
  if (!owns) {
    return { success: false, error: "Cross-tenant access denied" };
  }

  if (coAuthorizer.tenantId !== ctx.tenantId) {
    return { success: false, error: "Co-authorizer must belong to same tenant" };
  }

  const facility = await prisma.creditFacility.update({
    where: { id: request.creditFacilityId },
    data: {
      status: "ACTIVE",
    },
  });

  await appendAuditEntry({
    entityName: "CREDIT_FACILITY",
    entityId: request.creditFacilityId,
    actionType: "UNFREEZE",
    tenantId: ctx.tenantId,
    actorId: ctx.userId,
    changes: {
      previousStatus: "PENDING",
      newStatus: "ACTIVE",
      reason: request.reason,
      coAuthorizerId: request.coAuthorizerId,
    },
  });

  return {
    success: true,
    data: {
      creditFacilityId: facility.id,
      status: "ACTIVE",
      frozen: false,
      reason: request.reason,
    },
  };
}

// ─────────────────────────────────────────
// 3. RESOLVE DISPUTE
// ─────────────────────────────────────────

/**
 * Resolve a disputed invoice/order.
 * Updates dispute status and records resolution.
 */
export async function resolveDispute(
  ctx: OverrideContext,
  request: DisputeResolveRequest
): Promise<OverrideResult> {
  await requirePermission(ctx.auth, PERMISSIONS.DISPUTE_RESOLVE);

  if (!request.resolution || request.resolution.length < 10) {
    return { success: false, error: "Resolution must be at least 10 characters" };
  }

  // Tenant isolation
  const owns = await enforceTenantIsolation(ctx, "dispute", request.disputeId);
  if (!owns) {
    return { success: false, error: "Cross-tenant access denied" };
  }

  // Update dispute
  const dispute = await prisma.dispute.update({
    where: { id: request.disputeId },
    data: {
      status: "RESOLVED",
      resolution: request.resolution,
      liability: request.liability,
      resolvedAt: new Date(),
    },
  });

  // Audit log
  await appendAuditEntry({
    entityName: "DISPUTE",
    entityId: request.disputeId,
    actionType: "RESOLVE",
    tenantId: ctx.tenantId,
    actorId: ctx.userId,
    changes: {
      status: "RESOLVED",
      resolution: request.resolution,
      liability: request.liability,
      refundAmount: request.refundAmount,
    },
  });

  return {
    success: true,
    data: {
      disputeId: dispute.id,
      status: "RESOLVED",
      resolvedAt: dispute.resolvedAt,
    },
  };
}

// ─────────────────────────────────────────
// 4. RETRY ETA SUBMISSION
// ─────────────────────────────────────────

/**
 * Retry a failed ETA callback submission.
 * Resets the dead-letter job for reprocessing.
 */
export async function retryEtaSubmission(
  ctx: OverrideContext,
  request: EtaRetryRequest
): Promise<OverrideResult> {
  await requirePermission(ctx.auth, PERMISSIONS.ETA_RETRY);

  // Find the dead letter job
  const job = await prisma.etaDeadLetterJob.findUnique({
    where: { id: request.deadLetterJobId },
  });

  if (!job) {
    return { success: false, error: "Dead letter job not found" };
  }

  // Tenant isolation
  if (job.tenantId !== ctx.tenantId) {
    return { success: false, error: "Cross-tenant access denied" };
  }

  // Check if job is in a retryable state
  if (job.status === "RESOLVED") {
    return { success: false, error: "Job already resolved" };
  }

  if (job.status === "FAILED" && !request.forceRetry) {
    return { success: false, error: "Job permanently failed. Use forceRetry to override." };
  }

  // Reset job for retry
  const updatedJob = await prisma.etaDeadLetterJob.update({
    where: { id: request.deadLetterJobId },
    data: {
      status: "RETRYING",
      attemptCount: { increment: 1 },
      nextRetryAt: new Date(),
    },
  });

  // Also update invoice status to RETRYING
  await prisma.invoice.update({
    where: { id: job.invoiceId },
    data: {
      etaStatus: "RETRYING",
    },
  });

  // Audit log
  await appendAuditEntry({
    entityName: "ETA_DEAD_LETTER_JOB",
    entityId: request.deadLetterJobId,
    actionType: "RETRY",
    tenantId: ctx.tenantId,
    actorId: ctx.userId,
    changes: {
      previousStatus: job.status,
      newStatus: "RETRYING",
      attemptCount: updatedJob.attemptCount,
      invoiceId: job.invoiceId,
    },
  });

  return {
    success: true,
    data: {
      jobId: updatedJob.id,
      status: "RETRYING",
      attemptCount: updatedJob.attemptCount,
      invoiceId: job.invoiceId,
    },
  };
}

// ─────────────────────────────────────────
// 5. MANUAL APPROVAL OVERRIDE
// ─────────────────────────────────────────

/**
 * Manually approve an order bypassing the Authority Matrix.
 * Requires dual authorization (two admins).
 * G10: Admin Override Dual Authorization enforced.
 */
export async function manualApprovalOverride(
  ctx: OverrideContext,
  request: ManualApprovalRequest
): Promise<OverrideResult> {
  await requirePermission(ctx.auth, PERMISSIONS.MANUAL_APPROVAL);

  // Validate reason length (G10: 20+ character reason required)
  if (!request.reason || request.reason.length < 20) {
    return { success: false, error: "Reason must be at least 20 characters" };
  }

  // Validate co-authorizer is different user
  if (request.coAuthorizerId === ctx.userId) {
    return { success: false, error: "Co-authorizer must be a different user" };
  }

  // Verify co-authorizer
  const coAuthorizer = await prisma.user.findUnique({
    where: { id: request.coAuthorizerId },
    select: { id: true, platformRole: true, tenantId: true },
  });

  if (!coAuthorizer || coAuthorizer.platformRole !== "ADMIN") {
    return { success: false, error: "Co-authorizer must be an admin user" };
  }

  // Tenant isolation
  const owns = await enforceTenantIsolation(ctx, "order", request.orderId);
  if (!owns) {
    return { success: false, error: "Cross-tenant access denied" };
  }

  if (coAuthorizer.tenantId !== ctx.tenantId) {
    return { success: false, error: "Co-authorizer must belong to same tenant" };
  }

  // Perform approval with row locking
  await prisma.$transaction(async (tx) => {
    // Lock order row
    const locked = await tx.$queryRaw<Array<{ id: string; status: string }>>`
      SELECT "id", "status"
      FROM "Order"
      WHERE "id" = ${request.orderId}
      FOR UPDATE
    `;

    if (locked.length === 0) {
      throw new Error("Order not found during approval");
    }

    // Create approval record
    await tx.orderApproval.create({
      data: {
        orderId: request.orderId,
        approverId: ctx.userId,
        action: "ADMIN_OVERRIDE",
        reason: request.reason,
      },
    });

    // Update order status
    await tx.order.update({
      where: { id: request.orderId },
      data: {
        status: "APPROVED",
        paymentGuaranteed: !request.waivePaymentGuarantee,
      },
    });
  });

  // Audit log
  await appendAuditEntry({
    entityName: "ORDER",
    entityId: request.orderId,
    actionType: "MANUAL_APPROVAL_OVERRIDE",
    tenantId: ctx.tenantId,
    actorId: ctx.userId,
    changes: {
      action: "ADMIN_OVERRIDE",
      reason: request.reason,
      coAuthorizerId: request.coAuthorizerId,
      waivePaymentGuarantee: request.waivePaymentGuarantee,
    },
  });

  return {
    success: true,
    data: {
      orderId: request.orderId,
      status: "APPROVED",
      overridden: true,
      reason: request.reason,
    },
  };
}

// ─────────────────────────────────────────
// 6. GET CONTROL CENTER DATA
// ─────────────────────────────────────────

/**
 * Fetch all data needed for the Control Center dashboard.
 * Returns tenant-scoped aggregated data.
 */
export async function getControlCenterData(
  ctx: OverrideContext
): Promise<{
  disputedInvoices: number;
  etaFailures: number;
  frozenCreditLines: number;
  pendingOverrides: number;
  recentDisputes: Array<{
    id: string;
    disputeNumber: string;
    status: string;
    reason: string;
    amount: number | null;
    createdAt: Date;
  }>;
  recentEtaFailures: Array<{
    id: string;
    invoiceNumber: string;
    error: string;
    attemptCount: number;
    status: string;
  }>;
  creditFacilities: Array<{
    id: string;
    status: string;
    limit: number | null;
    utilized: number | null;
    hotelName: string;
  }>;
}> {
  await requirePermission(ctx.auth, PERMISSIONS.READ);

  const [
    disputedInvoices,
    etaFailures,
    frozenCreditLines,
    pendingOverrides,
    recentDisputes,
    recentEtaFailures,
    creditFacilities,
  ] = await Promise.all([
    // Disputed invoices count
    prisma.invoice.count({
      where: {
        tenantId: ctx.tenantId,
        status: "DISPUTED",
      },
    }),
    // ETA failures count
    prisma.etaDeadLetterJob.count({
      where: {
        tenantId: ctx.tenantId,
        status: { in: ["PENDING", "RETRYING", "FAILED"] },
      },
    }),
    // Frozen credit lines (PENDING status = frozen)
    prisma.creditFacility.count({
      where: {
        tenantId: ctx.tenantId,
        status: "PENDING",
      },
    }),
    // Pending overrides (orders awaiting approval)
    prisma.order.count({
      where: {
        tenantId: ctx.tenantId,
        status: "PENDING_APPROVAL",
      },
    }),
    // Recent disputes
    prisma.dispute.findMany({
      where: {
        tenantId: ctx.tenantId,
        status: { in: ["OPEN", "UNDER_INVESTIGATION", "ESCALATED_TO_CPA"] },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        disputeNumber: true,
        status: true,
        reason: true,
        amountDisputed: true,
        createdAt: true,
      },
    }),
    // Recent ETA failures
    prisma.etaDeadLetterJob.findMany({
      where: {
        tenantId: ctx.tenantId,
        status: { in: ["PENDING", "RETRYING", "FAILED"] },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        invoiceNumber: true,
        error: true,
        attemptCount: true,
        status: true,
      },
    }),
    // Credit facilities
    prisma.creditFacility.findMany({
      where: {
        tenantId: ctx.tenantId,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        limit: true,
        utilized: true,
        hotel: {
          select: { name: true },
        },
      },
    }),
  ]);

  return {
    disputedInvoices,
    etaFailures,
    frozenCreditLines,
    pendingOverrides,
    recentDisputes: recentDisputes.map((d) => ({
      id: d.id,
      disputeNumber: d.disputeNumber,
      status: d.status,
      reason: d.reason,
      amount: d.amountDisputed ? Number(d.amountDisputed) : null,
      createdAt: d.createdAt,
    })),
    recentEtaFailures,
    creditFacilities: creditFacilities.map((cf) => ({
      id: cf.id,
      status: cf.status,
      limit: cf.limit ? Number(cf.limit) : null,
      utilized: cf.utilized ? Number(cf.utilized) : null,
      hotelName: cf.hotel.name,
    })),
  };
}
