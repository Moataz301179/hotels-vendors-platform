import { NextRequest } from "next/server";
import { clearSession, getSessionToken, verifySession } from "@/lib/session";
import { apiRoute, success, audit } from "@/lib/api-utils";

export const POST = apiRoute(async (request: NextRequest) => {
  const token = await getSessionToken();
  let userId: string | null = null;
  let platformRole: string | null = null;

  let tenantId: string | null = null;

  if (token) {
    const session = await verifySession(token);
    if (session) {
      userId = session.userId;
      platformRole = session.platformRole;
      tenantId = session.tenantId;
    }
  }

  await clearSession();

  if (userId) {
    await audit({
      entityType: "USER",
      entityId: userId,
      action: "LOGOUT",
      tenantId: tenantId || "system",
      actorId: userId,
      actorRole: platformRole,
      ipAddress: request.headers.get("x-forwarded-for") || null,
      userAgent: request.headers.get("user-agent"),
    });
  }

  return success({ message: "Logged out successfully" });
});
