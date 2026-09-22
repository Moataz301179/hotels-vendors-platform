import { NextRequest } from "next/server";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";
import { getControlCenterData } from "@/lib/admin/override-tools";
import type { OverrideContext } from "@/lib/admin/override-tools";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:read");

  const ctx: OverrideContext = {
    auth,
    tenantId: auth.tenantId,
    userId: auth.userId,
    platformRole: auth.platformRole,
    ipAddress: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  };

  try {
    const data = await getControlCenterData(ctx);
    return success({ data });
  } catch (err) {
    console.error("[Control Center] Error:", err);
    return error("Failed to fetch control center data", 500);
  }
});
