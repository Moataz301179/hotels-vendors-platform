import { NextRequest } from "next/server";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";

import { detectNetworkPattern } from "@/lib/intelligence/network/network-engine";
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request); await requirePermission(auth, "intelligence:read");
  const insights = await detectNetworkPattern(auth.tenantId);
  return success({ insights: insights || [] });
});
