import { auth as clerkAuth } from "@clerk/nextjs/server";
import { ApiError, authenticate, requirePermission, type AuthContext } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function requirePlatformAdmin(ctx: AuthContext, permission: string) {
  await requirePermission(ctx, "admin:read");
  await requirePermission(ctx, permission);
  const account = await prisma.user.findFirst({
    where: { id: ctx.userId, tenantId: ctx.tenantId, platformRole: "ADMIN", status: "ACTIVE", deletedAt: null,
      tenant: { type: "PLATFORM", status: "ACTIVE", deletedAt: null } }, select: { id: true },
  });
  if (!account) throw new ApiError("Active platform administrator required", 403);
}

/** Client headers and native bearer tokens never supply step-up assurance. */
export async function requireSensitiveAdmin(request: NextRequest, permission: string) {
  const ctx = await authenticate(request);
  await requirePlatformAdmin(ctx, permission);
  if (request.headers.has("authorization")) throw new ApiError("Sensitive actions require browser session reverification", 403);
  const session = await clerkAuth();
  if (!session.userId || !session.sessionId || !session.has({ reverification: { level: "second_factor", afterMinutes: 5 } })) {
    throw new ReverificationRequiredError();
  }
  return ctx;
}

export class ReverificationRequiredError extends ApiError {
  constructor() { super("Recent second-factor verification required", 403); this.name = "ReverificationRequiredError"; }
}
