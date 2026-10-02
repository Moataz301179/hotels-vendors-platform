import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { OtpLoginSchema } from "@/lib/zod";
import { apiRoute, validateBody, success, error } from "@/lib/api-utils";
import { verifyOtp, normalizePhone } from "@/lib/auth/otp";
import { isValidEgyptianPhone } from "@/lib/auth/phone";
import { audit } from "@/lib/api-utils";
import { createSessionPair } from "@/lib/session";
import { checkRateLimit } from "@/lib/redis";

export const POST = apiRoute(async (request: NextRequest) => {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";

  const rateLimit = await checkRateLimit(`otp-login:${clientIp}`, 60, 5);
  if (!rateLimit.allowed) {
    return error("Too many login attempts. Please try again later.", 429);
  }

  const body = await request.json();
  const data = validateBody(OtpLoginSchema, body);

  // Normalize and validate Egyptian phone
  const normalizedPhone = normalizePhone(data.phone);
  if (!isValidEgyptianPhone(normalizedPhone)) {
    return error("Invalid Egyptian mobile number format", 400);
  }

  try {
    // Verify OTP with LOGIN purpose
    const verifyResult = await verifyOtp(normalizedPhone, data.code, "LOGIN");
    if (!verifyResult.success) {
      return error(verifyResult.message, 400);
    }

    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      include: { hotel: true },
    });

    if (!user) {
      return error("No account found for this number. Please register.", 404);
    }

    if (user.status !== "ACTIVE") {
      return error("Account is not active. Please contact support.", 403);
    }

    // Issue session pair (access + refresh tokens)
    const { accessToken, refreshToken } = await createSessionPair(user.id, user.platformRole, user.tenantId || user.hotelId || "legacy");

    await audit({
      entityType: "USER",
      entityId: user.id,
      action: "LOGIN",
      tenantId: user.tenantId || user.hotelId || "legacy",
      actorId: user.id,
      actorRole: user.platformRole,
      afterState: { loginAlias: normalizedPhone, method: "otp" },
      ipAddress: clientIp,
      userAgent: request.headers.get("user-agent"),
    });

    // Return user object matching mobile app expectations
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      platformRole: user.platformRole,
      tenantId: user.tenantId,
      phone: user.phone,
      phoneVerifiedAt: user.phoneVerifiedAt,
      supplierId: user.supplierId,
      hotelId: user.hotelId,
    };

    return success({ accessToken, refreshToken, user: userResponse });
  } catch (err) {
    console.error("[otp-login] Error:", err);
    return error("Failed to sign in. Please try again.", 500);
  }
});