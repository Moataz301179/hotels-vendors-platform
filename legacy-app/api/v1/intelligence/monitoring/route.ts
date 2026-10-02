import { NextRequest } from "next/server";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";

import { evaluateIntelligenceChanges } from "@/lib/intelligence/monitoring/change-detection";
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request); await requirePermission(auth, "intelligence:read");
  const updates = await evaluateIntelligenceChanges(auth.userId, auth.tenantId);
  return success({ updates: updates || [] });
});
