/**
 * AI Quota API — HotelsVendors
 * Returns current user's AI usage quota status.
 */

import { NextRequest } from "next/server";
import { apiRoute, authenticate, success } from "@/lib/api-utils";
import { getQuotaStatus } from "@/lib/ai/quota";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const status = await getQuotaStatus(auth.userId);
  return success({ quota: status });
});
