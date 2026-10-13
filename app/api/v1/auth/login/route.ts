import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { createMobileSession, isNativeTokenRequest } from "@/lib/auth/mobile-session";
import { findActiveAccount } from "@/lib/auth/account-identity";
import { LoginSchema } from "@/lib/zod";
import { apiRoute, validateBody, success, error, audit } from "@/lib/api-utils";
import { checkRateLimit } from "@/lib/redis";

export const POST = apiRoute(async (request: NextRequest) => {
  if (!isNativeTokenRequest(request)) return error("Use Clerk to sign in on the website", 403);
  // Rate limit: 5 attempts per minute per IP
  const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const rateLimit = await checkRateLimit(`login:${clientIp}`, 60, 5);
  if (!rateLimit.allowed) {
    return error("Too many login attempts. Please try again later.", 429);
  }

  const body = await request.json();
  const data = validateBody(LoginSchema, body);

  const loginValue = data.email || data.phone;
  const loginField = data.email ? "email" : "phone";

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: loginValue },
        { phone: loginValue },
      ],
    },
    include: { hotel: true },
  });

  if (!user || !user.passwordHash) {
    return error("Invalid email or password", 401);
  }

  // If user was found by phone, require email verification only if they have an email
  if (loginField === "phone" && user.email && !user.emailVerifiedAt) {
    return error("Please verify your email address before logging in. Check your inbox for the verification link.", 403);
  }

  const valid = await verifyPassword(data.password, user.passwordHash);
  if (!valid) {
    return error("Invalid email or password", 401);
  }

  // Enforce email verification before allowing login (only if user has an email)
  if (user.email && !user.emailVerifiedAt) {
    return error("Please verify your email address before logging in. Check your inbox for the verification link.", 403);
  }

  const account = await findActiveAccount({ id: user.id });
  if (!account) return error("Account is not active", 403);
  const tokens = await createMobileSession(account);

  await audit({
    entityType: "USER",
    entityId: user.id,
    action: "LOGIN",
    tenantId: account.tenantId,
    actorId: user.id,
    actorRole: user.platformRole,
    afterState: {
      loginField: loginField,
      platformRole: user.platformRole,
      loginAlias: data.email === "admin" ? "admin" : undefined
    },
    ipAddress: request.headers.get("x-forwarded-for") || null,
    userAgent: request.headers.get("user-agent"),
  });

  return success({
    ...tokens,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      platformRole: user.platformRole,
      hotelId: user.hotelId,
      phone: user.phone,
      tenantId: user.tenantId,
    }
  });
});
