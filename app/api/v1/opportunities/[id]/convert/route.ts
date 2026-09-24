/**
 * POST /api/v1/opportunities/[id]/convert — Convert opportunity to savings record
 *
 * Creates a SavingsLedger entry from Opportunity data and updates the
 * opportunity status to ACTION_READY or EXECUTING.
 */

import { NextRequest } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import {
  apiRoute,
  authenticate,
  validateBody,
  success,
  error,
  audit,
  requirePermission,
} from "../../../../../../lib/api-utils";
import { OpportunityConvertSchema } from "../../../../../../lib/zod";
import { createSavingsRecord } from "../../../../../../lib/savings/ledger";

export const POST = apiRoute(
  async (request: NextRequest, { params }: { params?: Promise<{ id: string }> }) => {
    const auth = await authenticate(request);
    await requirePermission(auth, "opportunity:convert");
    const resolved = await params;
    if (!resolved) return error("Missing parameter", 400);
    const { id } = resolved;

    const body = await request.json();
    const data = validateBody(OpportunityConvertSchema, body);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const opportunity = await (prisma as any).opportunity.findFirst({
      where: { id, tenantId: auth.tenantId, deletedAt: null },
    });
    if (!opportunity) return error("Opportunity not found", 404);

    // Validate status transition — can only convert from certain states
    const convertibleStatuses = ["ACTION_READY", "APPROVED", "EXECUTING", "RESEARCHING"];
    if (!convertibleStatuses.includes(opportunity.status)) {
      return error(
        `Cannot convert opportunity in status ${opportunity.status}. Must be one of: ${convertibleStatuses.join(", ")}`,
        409
      );
    }

    // Create the savings record from opportunity data
    const savingsRecord = await createSavingsRecord({
      tenantId: auth.tenantId,
      opportunityId: opportunity.id,
      type: data.type || "NEGOTIATED",
      baseline: data.baseline ?? (opportunity.baseline ? Number(opportunity.baseline) : undefined),
      potentialSaving: data.potentialSaving ?? (opportunity.potentialImpact ? Number(opportunity.potentialImpact) : undefined),
      expectedSaving: data.expectedSaving,
      supplierId: data.supplierId ?? opportunity.affectedSupplierId,
      category: data.category ?? opportunity.affectedCategory,
      productId: data.productId ?? opportunity.affectedProductId,
      ownerId: data.ownerId ?? opportunity.ownerId ?? auth.userId,
      evidence: data.evidence,
    });

    // Update opportunity status
    const newStatus = data.targetStatus || "EXECUTING";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedOpportunity = await (prisma as any).opportunity.update({
      where: { id },
      data: {
        status: newStatus,
        resultingTransactionId: savingsRecord.id,
        verificationState: "SAVINGS_CREATED",
      },
      include: {
        affectedSupplier: { select: { id: true, name: true } },
        affectedProduct: { select: { id: true, name: true, sku: true } },
        owner: { select: { id: true, name: true, email: true } },
        savingsLedgers: {
          where: { id: savingsRecord.id },
          include: {
            supplier: { select: { id: true, name: true } },
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    await audit({
      entityType: "OPPORTUNITY",
      entityId: id,
      action: "CONVERT_TO_SAVINGS",
      tenantId: auth.tenantId,
      actorId: auth.userId,
      actorRole: auth.platformRole,
      beforeState: { status: opportunity.status },
      afterState: {
        status: newStatus,
        savingsId: savingsRecord.id,
        savingsStatus: savingsRecord.status,
      },
      ipAddress: request.headers.get("x-forwarded-for") || null,
      userAgent: request.headers.get("user-agent"),
    });

    return success(
      {
        opportunity: updatedOpportunity,
        savings: savingsRecord,
      },
      201
    );
  },
  { rateLimit: "api" }
);
