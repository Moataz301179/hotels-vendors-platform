import { NextRequest } from "next/server";
import { apiRoute, authenticate, requirePermission, error } from "@/lib/api-utils";

/** Legacy storage cannot establish tenant ownership; use the canonical API. */
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "invoice:read");
  return error("This connection is unavailable. Use /api/v1/factoring/requests.", 503);
});
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "invoice:factor");
  return error("This connection is unavailable. Use /api/v1/factoring/requests.", 503);
});
