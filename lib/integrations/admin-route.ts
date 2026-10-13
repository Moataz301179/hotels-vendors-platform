import { NextRequest, NextResponse } from "next/server";
import { apiRoute, authenticate, requirePermission } from "@/lib/api-utils";

type IntegrationHandler = (
  request: NextRequest,
  context: unknown
) => Promise<NextResponse | Response>;

export function integrationAdminRoute(handler: IntegrationHandler) {
  return apiRoute(async (request: NextRequest, context: unknown) => {
    const auth = await authenticate(request);
    await requirePermission(auth, "admin:manage_platform");
    return handler(request, context);
  }, { rateLimit: "api" });
}
