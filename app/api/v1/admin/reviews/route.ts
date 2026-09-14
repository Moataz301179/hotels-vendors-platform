import { NextRequest } from "next/server";
import { apiRoute, authenticate, success } from "@/lib/api-utils";

/**
 * GET /api/v1/admin/reviews — DEPRECATED: Review model not yet in schema.
 */
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  void auth;

  return success({
    reviews: [],
    total: 0,
    pagination: { total: 0, limit: 50, offset: 0 },
    _deprecated: "Review model not yet in Prisma schema. Endpoint returns empty data.",
  });
}, { rateLimit: "api" });
