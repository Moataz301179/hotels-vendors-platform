import { NextResponse } from "next/server";
import { appendAuditEntry } from "@/lib/audit/tamper-proof";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/v2-auth";

const REVIEW_ROLES = ["OWNER", "REGIONAL_GM", "GM", "FINANCIAL_CONTROLLER"];

/**
 * A count is an observation, not an adjustment. A distinct authorized manager
 * may accept or reject it, but this route intentionally never alters stock.
 */
export async function PATCH(request: Request, context: { params: Promise<{ countId: string }> }) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (actor.platformRole !== "HOTEL" || !REVIEW_ROLES.includes(actor.role)) return NextResponse.json({ error: "PHYSICAL_COUNT_REVIEW_ROLE_REQUIRED" }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (body?.decision !== "ACCEPTED" && body?.decision !== "REJECTED") return NextResponse.json({ error: "COUNT_REVIEW_DECISION_REQUIRED" }, { status: 400 });
  const { countId } = await context.params;

  const result = await prisma.$transaction(async (tx) => {
    const count = await tx.physicalInventoryCount.findFirst({ where: { id: countId, tenantId: actor.tenantId, deletedAt: null } });
    if (!count) return { error: "PHYSICAL_COUNT_NOT_FOUND" as const };
    if (count.countedById === actor.id) return { error: "COUNT_REVIEWER_MUST_BE_DISTINCT" as const };
    if (count.status !== "PENDING_REVIEW") return { count, replayed: true };
    const reviewed = await tx.physicalInventoryCount.update({ where: { id: count.id }, data: { status: body.decision, reviewedById: actor.id, reviewedAt: new Date() } });
    await appendAuditEntry({ entityName: "PRODUCT", entityId: reviewed.productId, actionType: "STATUS_CHANGED", tenantId: actor.tenantId, actorId: actor.id, actorRole: actor.platformRole, changes: { event: "PHYSICAL_COUNT_REVIEWED", physicalCountId: reviewed.id, decision: reviewed.status, countedById: reviewed.countedById, observedQuantity: reviewed.observedQuantity } }, tx);
    return { count: reviewed, replayed: false };
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.error === "PHYSICAL_COUNT_NOT_FOUND" ? 404 : 409 });
  return NextResponse.json({ count: { id: result.count.id, status: result.count.status, reviewedAt: result.count.reviewedAt?.toISOString() ?? null }, replayed: result.replayed, message: "Physical count reviewed. Stock remains unchanged until a separately authorized reconciliation." }, { status: result.replayed ? 200 : 201, headers: { "Cache-Control": "private, no-store" } });
}
