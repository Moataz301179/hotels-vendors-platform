import { NextRequest } from "next/server";
import { apiRoute, authenticate, requirePermission, success, validateBody } from "@/lib/api-utils";
import { transitionLiveOpportunity } from "@/lib/intelligence/live-store";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { z } from "zod";

const Schema = z.object({ toStatus: z.enum(["REVIEWED","ACTION_READY","ACTIONED","OUTCOME_PENDING","COMPLETED","REJECTED"]), reason: z.string().max(1000).optional() });

export const POST = apiRoute(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "intelligence:write");
  const body = validateBody(Schema, await request.json());
  const { id } = await params;
  const result = await transitionLiveOpportunity({ tenantId: auth.tenantId, opportunityId: id, toStatus: body.toStatus, actorId: auth.userId, reason: body.reason });
  await appendAuditEntry({ entityId: id, actionType: "UPDATE", tenantId: auth.tenantId, actorId: auth.userId, actorRole: auth.platformRole, changes: { from: result.previousStatus, to: body.toStatus, reason: body.reason ?? null }, ipAddress: request.headers.get("x-forwarded-for"), userAgent: request.headers.get("user-agent") });
  return success({ opportunity: result.opportunity, previousStatus: result.previousStatus });
});
