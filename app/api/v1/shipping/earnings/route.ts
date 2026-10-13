import { NextRequest } from "next/server";
import { apiRoute, authenticate, requirePermission, success, validateQuery } from "@/lib/api-utils";
import { z } from "zod";
const QuerySchema = z.object({ period: z.enum(["7d", "30d", "90d", "all"]).default("30d") });
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "shipping:read");
  const { period } = validateQuery(QuerySchema, request.nextUrl.searchParams);
  // No approved rate/settlement source exists; never invent revenue/payables.
  return success({ available: false, period, summary: null, daily: [], topVehicles: [], message: "Carrier earnings are unavailable until approved settlement records are connected." });
});
