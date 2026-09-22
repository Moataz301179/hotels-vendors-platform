import { NextRequest } from "next/server";
import { getRiskHeatmapData } from "@/lib/fintech/risk-engine";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:read");

  const data = await getRiskHeatmapData(auth.tenantId);
  return success({ heatmap: data });
});
