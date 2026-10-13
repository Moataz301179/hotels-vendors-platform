import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { ApiError, type AuthContext } from "@/lib/api-utils";
import { getUserPermissions } from "@/lib/auth/rbac";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { assertApprovalEligible, changePermission, pendingChangeSchema, type PendingChange, type requestChange, type approveChange } from "./approval-contract";

async function target(tx: Prisma.TransactionClient, action: PendingChange["action"], id: string) {
  const where = { id, deletedAt: null, tenant: { deletedAt: null } };
  if (action.startsWith("USER_")) return tx.user.findFirst({ where, select: { id: true, tenantId: true, status: true, platformRole: true, updatedAt: true } });
  if (action.startsWith("SUPPLIER_")) return tx.supplier.findFirst({ where, select: { id: true, tenantId: true, status: true, isVerified: true, updatedAt: true } });
  return tx.product.findFirst({ where, select: { id: true, tenantId: true, status: true, source: true, updatedAt: true } });
}
async function requireGrants(tx: Prisma.TransactionClient, ctx: AuthContext, permission: string) {
  const grants = await getUserPermissions(ctx, tx);
  if (!["admin:read", "admin:manage_tenants", permission].every(code => grants.includes(code))) throw new ApiError("Administrator grants are missing or revoked", 403);
}
function entity(action: PendingChange["action"]) { return action.startsWith("USER_") ? "USER" : action.startsWith("SUPPLIER_") ? "SUPPLIER" : "PRODUCT"; }
/** Owner confirmation is limited to the routine allowlist; never financial or Authority Matrix overrides. */
export async function canConfirmOwnRoutineChange(ctx: AuthContext, db: Prisma.TransactionClient | typeof prisma = prisma) {
  if (ctx.platformRole !== "ADMIN") return false;
  const owner = await db.user.findFirst({ where: { id: ctx.userId, tenantId: ctx.tenantId, platformRole: "ADMIN", role: "OWNER", status: "ACTIVE", deletedAt: null, tenant: { type: "PLATFORM", status: "ACTIVE", deletedAt: null } }, select: { id: true } });
  return owner?.id === ctx.userId;
}

export async function createChange(ctx: AuthContext, input: z.infer<typeof requestChange>) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`admin-change:${input.targetId}`}))`;
    await requireGrants(tx, ctx, changePermission(input.action));
    const record = await target(tx, input.action, input.targetId);
    if (!record) throw new ApiError("Target not found", 404);
    if (record.id === ctx.userId || ("platformRole" in record && record.platformRole === "ADMIN")) throw new ApiError("Self changes and platform-admin account changes require a separate access-governance process", 403);
    if ((input.action === "USER_SUSPEND" && record.status !== "ACTIVE") || (input.action === "USER_REACTIVATE" && record.status !== "SUSPENDED")) throw new ApiError("This user status transition is not allowed", 409);
    if ("source" in record && record.source === "FIXTURE") throw new ApiError("Fixture products cannot be promoted through this workflow", 403);
    if (input.action === "SUPPLIER_VERIFY") {
      if (!input.evidenceId || !await tx.document.findFirst({ where: { id: input.evidenceId, tenantId: record.tenantId, entityId: record.id, deletedAt: null }, select: { id: true } })) throw new ApiError("A document belonging to the target supplier is required", 400);
    }
    const change: PendingChange = { kind: "ADMIN_CHANGE_REQUEST", action: input.action, targetId: input.targetId, targetTenantId: record.tenantId, reason: input.reason, evidenceId: input.evidenceId ?? null, snapshot: JSON.stringify(record), expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() };
    const requestId = await appendAuditEntry({ tenantId: ctx.tenantId, entityName: entity(input.action), entityId: input.targetId, actorId: ctx.userId, actorRole: ctx.platformRole, actionType: "CREATE", changes: { ...change } }, tx);
    return { requestId, expiresAt: change.expiresAt, status: "PENDING_CONFIRMATION" };
  });
}

export async function decideChange(ctx: AuthContext, input: z.infer<typeof approveChange>) {
  return prisma.$transaction(async tx => {
    const request = await tx.auditLog.findFirst({ where: { id: input.requestId, tenantId: ctx.tenantId } });
    if (!request || !request.actorId || !request.changes || typeof request.changes !== "object" || Array.isArray(request.changes) || request.changes.kind !== "ADMIN_CHANGE_REQUEST") throw new ApiError("Approval request not found", 404);
    const parsed = pendingChangeSchema.safeParse(request.changes);
    if (!parsed.success) throw new ApiError("Invalid approval request", 409);
    const change = parsed.data;
    if (request.actionType !== "CREATE" || request.entityName !== entity(change.action) || request.entityId !== change.targetId) throw new ApiError("Approval request identity mismatch", 409);
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`admin-change:${change.targetId}`}))`;
    await requireGrants(tx, ctx, changePermission(change.action));
    const previousDecision = await tx.auditLog.findFirst({ where: { tenantId: ctx.tenantId, entityId: change.targetId, changes: { path: ["requestId"], equals: input.requestId } } });
    if (previousDecision) throw new ApiError("Request already decided", 409);
    const record = await target(tx, change.action, change.targetId);
    if (!record || record.tenantId !== change.targetTenantId) throw new ApiError("Target is no longer available", 409);
    if (input.decision === "APPROVE") {
      await requireGrants(tx, { ...ctx, userId: request.actorId }, changePermission(change.action));
      const ownerConfirmation = request.actorId === ctx.userId && await canConfirmOwnRoutineChange(ctx, tx);
      try { assertApprovalEligible(change, request.actorId, ctx.userId, JSON.stringify(record), Date.now(), ownerConfirmation); } catch (cause) { throw new ApiError(cause instanceof Error ? cause.message : "Approval denied", 409); }
      if ("platformRole" in record && record.platformRole === "ADMIN") throw new ApiError("Protected administrator account", 403);
      if (change.action === "SUPPLIER_VERIFY" && (!change.evidenceId || !await tx.document.findFirst({ where: { id: change.evidenceId, tenantId: change.targetTenantId, entityId: change.targetId, deletedAt: null }, select: { id: true } }))) throw new ApiError("Verification evidence is no longer available", 409);
      const where = { id: change.targetId, tenantId: change.targetTenantId, updatedAt: record.updatedAt, deletedAt: null };
      const mutation = change.action.startsWith("USER_") ? await tx.user.updateMany({ where, data: { status: change.action === "USER_SUSPEND" ? "SUSPENDED" : "ACTIVE" } })
        : change.action.startsWith("SUPPLIER_") ? await tx.supplier.updateMany({ where, data: { isVerified: change.action === "SUPPLIER_VERIFY" } })
        : await tx.product.updateMany({ where, data: { status: change.action === "CATALOG_SUSPEND" ? "INACTIVE" : "ACTIVE" } });
      if (mutation.count !== 1) throw new ApiError("Target changed during approval; no change applied", 409);
    } else if (ctx.userId !== request.actorId) throw new ApiError("Only the requester may cancel", 403);
    await appendAuditEntry({ tenantId: ctx.tenantId, entityName: entity(change.action), entityId: change.targetId, actorId: ctx.userId, actorRole: ctx.platformRole, actionType: "UPDATE", changes: { kind: "ADMIN_CHANGE_DECISION", requestId: input.requestId, decision: input.decision, requesterId: request.actorId, reason: input.reason, before: JSON.parse(JSON.stringify(record)), after: input.decision === "APPROVE" ? JSON.parse(JSON.stringify(await target(tx, change.action, change.targetId))) : null } }, tx);
    return { requestId: input.requestId, status: input.decision === "APPROVE" ? "APPLIED" : "CANCELLED" };
  });
}
