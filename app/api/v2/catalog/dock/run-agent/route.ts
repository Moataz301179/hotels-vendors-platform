import { NextResponse } from "next/server";
import { getActor } from "@/lib/v2-auth";
import { requirePermission } from "@/lib/auth/rbac";
import { PermissionDeniedError } from "@/lib/auth/rbac";
import { runStagingAgent } from "@/lib/catalog/staging-agent";

/**
 * POST /api/v2/catalog/dock/run-agent — run the staging agent over the dock.
 *
 * The agent promotes only records it can identify with evidence against the
 * existing catalog. Everything else is left for human review or rejected.
 */
export async function POST() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  try {
    await requirePermission(
      { userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole },
      "product:create",
    );
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ error: "CATALOG_DOCK_PERMISSION_REQUIRED" }, { status: 403 });
    }
    throw error;
  }

  const result = await runStagingAgent({ tenantId: actor.tenantId, actorId: actor.id });
  return NextResponse.json(result);
}
