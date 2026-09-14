import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { LoginSchema } from "@/lib/zod";
import { apiRoute, validateBody, success, error, audit } from "@/lib/api-utils";
import { checkRateLimit } from "@/lib/redis";

export const POST = apiRoute(async (request: NextRequest) => {
  // Rate limit: 5 attempts per minute per IP
  const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const rateLimit = await checkRateLimit(`login:${clientIp}`, 60, 5);
  if (!rateLimit.allowed) {
    return error("Too many login attempts. Please try again later.", 429);
  }

  const body = await request.json();
  const data = validateBody(LoginSchema, body);

  const email = data.email;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { hotel: true },
  });

  if (!user || !user.passwordHash) {
    return error("Invalid email or password", 401);
  }

  const valid = await verifyPassword(data.password, user.passwordHash);
  if (!valid) {
    return error("Invalid email or password", 401);
  }

  // Enforce email verification before allowing login
  if (!user.emailVerifiedAt) {
    return error("Please verify your email address before logging in. Check your inbox for the verification link.", 403);
  }

  const token = await createSession(user.id, user.platformRole, user.tenantId || user.hotelId || "legacy");

  await audit({
    entityType: "USER",
    entityId: user.id,
    action: "LOGIN",
    tenantId: user.tenantId || user.hotelId || "legacy",
    actorId: user.id,
    actorRole: user.platformRole,
    afterState: { email: user.email, platformRole: user.platformRole, loginAlias: data.email === "admin" ? "admin" : undefined },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  return success({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, platformRole: user.platformRole, hotelId: user.hotelId } });
});
