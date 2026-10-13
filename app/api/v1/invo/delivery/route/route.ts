import { NextRequest } from "next/server";
import { z } from "zod";
import { apiRoute, authenticate, requirePermission, validateBody, success } from "@/lib/api-utils";
import { batchAssign } from "@/lib/logistics/assign";
const DispatchInput = z.object({ orderIds: z.array(z.string().min(1).max(128)).min(1).max(50) });
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request); await requirePermission(auth, "shipping:create_trip");
  const { orderIds } = validateBody(DispatchInput, await request.json());
  const results = await batchAssign(orderIds, auth.tenantId, auth);
  return success({ results, assigned: results.filter(item => item.result).length, failed: results.filter(item => !item.result).length });
});
