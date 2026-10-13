import { NextRequest } from "next/server";
import { apiRoute, success, authenticate, audit, getBearerToken, error } from "@/lib/api-utils";
import { revokeMobileSession, isNativeTokenRequest } from "@/lib/auth/mobile-session";

export const POST = apiRoute(async (request: NextRequest) => {
  if (!isNativeTokenRequest(request)) return error("Use Clerk to sign out of the website", 403);
  const ctx = await authenticate(request);
  const token = getBearerToken(request);
  if (!token) return error("Unauthorized", 401);
  await revokeMobileSession(token);
  await audit({ entityType: "USER", entityId: ctx.userId, action: "LOGOUT",
    tenantId: ctx.tenantId, actorId: ctx.userId, actorRole: ctx.platformRole });
  return success({ message: "Logged out successfully" });
});
