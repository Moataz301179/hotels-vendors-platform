/**
 * GET /api/v1/savings/[id] — Get single savings record with details
 * PATCH /api/v1/savings/[id] — Update status/amounts with lifecycle transition
 * DELETE /api/v1/savings/[id] — Soft delete a savings record
 */

import { NextRequest } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import {
  apiRoute,
  authenticate,
  validateBody,
  success,
  error,
  audit,
  requirePermission,
} from "../../../../../lib/api-utils";
import { SavingsUpdateSchema, SavingsDisputeSchema } from "../../../../../lib/zod";
import { updateStatus, getSavingsSummary } from "../../../../../lib/savings/ledger";

export const GET = apiRoute(async (request: NextRequest, { params }: { params?: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "savings:read");
  const resolved = await params;
  if (!resolved) return error("Missing parameter", 400);
  const { id } = resolved;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const record = await (prisma as any).savingsLedger.findFirst({
    where: { id, tenantId: auth.tenantId, deletedAt: null },
    include: {
      opportunity: { select: { id: true, title: true, type: true, status: true } },
      supplier: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, sku: true } },
      owner: { select: { id: true, name: true, email: true } },
      verifiedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!record) return error("Savings record not found", 404);

  // Include summary in response
  const summary = await getSavingsSummary(auth.tenantId);
  return success({ record, summary });
}, { rateLimit: "api" });

export const PATCH = apiRoute(async (request: NextRequest, { params }: { params?: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "savings:update");
  const resolved = await params;
  if (!resolved) return error("Missing parameter", 400);
  const { id } = resolved;

  const body = await request.json();
  const data = validateBody(SavingsUpdateSchema, body);

  // Verify record exists and belongs to tenant
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = await (prisma as any).savingsLedger.findFirst({
    where: { id, tenantId: auth.tenantId, deletedAt: null },
  });
  if (!existing) return error("Savings record not found", 404);

  // If status transition requested, use the lifecycle service
  let updated;
  if (data.status) {
    try {
      updated = await updateStatus(id, data.status, {
        type: data.type,
        baseline: data.baseline,
        potentialSaving: data.potentialSaving,
        expectedSaving: data.expectedSaving,
        negotiatedAmount: data.negotiatedAmount,
        realizedAmount: data.realizedAmount,
        verifiedAmount: data.verifiedAmount,
        evidence: data.evidence,
        transactionId: data.transactionId,
        supplierId: data.supplierId,
        category: data.category,
        productId: data.productId,
        ownerId: data.ownerId,
        verifiedById: data.verifiedById,
        verifiedAt: data.verifiedById ? new Date().toISOString() : undefined,
        disputeReason: data.disputeReason,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Status transition failed";
      return error(errorMessage, 400);
    }
  } else {
    // No status transition, just update fields
    const updateData: Record<string, unknown> = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.baseline !== undefined) updateData.baseline = data.baseline;
    if (data.potentialSaving !== undefined) updateData.potentialSaving = data.potentialSaving;
    if (data.expectedSaving !== undefined) updateData.expectedSaving = data.expectedSaving;
    if (data.negotiatedAmount !== undefined) updateData.negotiatedAmount = data.negotiatedAmount;
    if (data.realizedAmount !== undefined) updateData.realizedAmount = data.realizedAmount;
    if (data.verifiedAmount !== undefined) updateData.verifiedAmount = data.verifiedAmount;
    if (data.evidence !== undefined) updateData.evidence = data.evidence;
    if (data.transactionId !== undefined) updateData.transactionId = data.transactionId;
    if (data.supplierId !== undefined) updateData.supplierId = data.supplierId;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.productId !== undefined) updateData.productId = data.productId;
    if (data.ownerId !== undefined) updateData.ownerId = data.ownerId;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updated = await (prisma as any).savingsLedger.update({
      where: { id },
      data: updateData,
      include: {
        opportunity: { select: { id: true, title: true, type: true } },
        supplier: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, sku: true } },
        owner: { select: { id: true, name: true, email: true } },
        verifiedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  await audit({
    entityType: "SAVINGS_LEDGER",
    entityId: id,
    action: "UPDATE_SAVINGS",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    beforeState: { status: existing.status },
    afterState: { status: updated.status ?? existing.status },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  return success({ record: updated });
}, { rateLimit: "api" });

export const DELETE = apiRoute(async (request: NextRequest, { params }: { params?: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "savings:delete");
  const resolved = await params;
  if (!resolved) return error("Missing parameter", 400);
  const { id } = resolved;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = await (prisma as any).savingsLedger.findFirst({
    where: { id, tenantId: auth.tenantId, deletedAt: null },
  });
  if (!existing) return error("Savings record not found", 404);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).savingsLedger.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await audit({
    entityType: "SAVINGS_LEDGER",
    entityId: id,
    action: "DELETE_SAVINGS",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    beforeState: { status: existing.status },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  return success({ message: "Savings record deleted" });
}, { rateLimit: "api" });
