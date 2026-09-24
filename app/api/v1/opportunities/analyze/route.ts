/**
 * POST /api/v1/opportunities/analyze
 *
 * Triggers cost opportunity analysis for the authenticated user's tenant.
 * Requires 'opportunity:analyze' permission.
 * Idempotent — safe to call repeatedly without creating duplicate opportunities.
 */

import { NextRequest } from "next/server";
import {
  apiRoute,
  authenticate,
  requirePermission,
  success,
  audit,
} from "../../../../../lib/api-utils";
import { runFullAnalysis } from "../../../../../lib/opportunity/cost-engine";

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "opportunity:analyze");
  const tenantId = auth.tenantId;

  const summary = await runFullAnalysis(tenantId);

  await audit({
    entityType: "OPPORTUNITY",
    entityId: `analysis:${tenantId}:${Date.now()}`,
    action: "ANALYZE_OPPORTUNITIES",
    tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: {
      detected: summary.detected,
      priceDrift: summary.priceDrift,
      supplierConcentration: summary.supplierConcentration,
      volumeOpportunity: summary.volumeOpportunity,
      duplicatePurchases: summary.duplicatePurchases,
      totalPotentialSavings: summary.totalPotentialSavings,
    },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  return success(summary);
}, { rateLimit: "api" });
