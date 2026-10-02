import { NextRequest } from "next/server";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";

import { detectNeeds } from "@/lib/intelligence/need-detection/engine";
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request); await requirePermission(auth, "intelligence:read");
  const url = new URL(request.url); const entityId = url.searchParams.get("entityId") || auth.userId;
  const findings = await detectNeeds({ entityId: entityId || auth.userId, tenantId: auth.tenantId });
  return success({ findings: findings || [] });
});
