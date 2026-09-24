/**
 * POST /api/v1/savings/[id]/verify — Trigger verification for a savings record
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
import {
  verifySavings,
  isVerified,
  flagDiscrepancy,
} from "../../../../../../lib/savings/verifier";
import { SavingsVerifySchema } from "../../../../../../lib/zod";

export const POST = apiRoute(
  async (request: NextRequest, { params }: { params?: Promise<{ id: string }> }) => {
    const auth = await authenticate(request);
    await requirePermission(auth, "savings:verify");
    const resolved = await params;
    if (!resolved) return error("Missing parameter", 400);
    const { id } = resolved;

    const body = await request.json();
    const data = validateBody(SavingsVerifySchema, body);

    // Ensure the savings record exists and belongs to the tenant
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record = await (prisma as any).savingsLedger.findFirst({
      where: { id, tenantId: auth.tenantId, deletedAt: null },
    });
    if (!record) return error("Savings record not found", 404);

    if (data.action === "flag") {
      await flagDiscrepancy(id, data.reason ?? "Manual flag by user");
      return success({ flagged: true, reason: data.reason });
    }

    if (data.action === "check") {
      const verified = await isVerified(id);
      return success({ verified });
    }

    // Default: run verification
    const result = await verifySavings(id, auth.userId);

    await audit({
      entityType: "SAVINGS_LEDGER",
      entityId: id,
      action: "VERIFY_SAVINGS",
      tenantId: auth.tenantId,
      actorId: auth.userId,
      actorRole: auth.platformRole,
      afterState: {
        verified: result.verified,
        verifiedAmount: result.verifiedAmount,
        discrepancy: result.discrepancy,
      },
      ipAddress: request.headers.get("x-forwarded-for") || null,
      userAgent: request.headers.get("user-agent"),
    });

    return success(result);
  },
  { rateLimit: "api" }
);
