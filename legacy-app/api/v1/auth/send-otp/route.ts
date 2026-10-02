import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { SendOtpSchema } from "@/lib/zod";
import { apiRoute, validateBody, success, error } from "@/lib/api-utils";
import { checkRateLimit } from "@/lib/redis";
import { sendOtp, normalizePhone } from "@/lib/auth/otp";
import { isValidEgyptianPhone } from "@/lib/auth/phone";
import { audit } from "@/lib/api-utils";

export const POST = apiRoute(async (request: NextRequest) => {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";

  const body = await request.json();
  const data = validateBody(SendOtpSchema, body);

  // Normalize and validate Egyptian phone
  const normalizedPhone = normalizePhone(data.phone);
  if (!isValidEgyptianPhone(normalizedPhone)) {
    return error("Invalid Egyptian mobile number format", 400);
  }

  // Rate limit: 10 per hour per IP, 5 per hour per phone (also checked in sendOtp)
  const rateLimit = await checkRateLimit(`otp:send:${clientIp}`, 3600, 10);
  if (!rateLimit.allowed) {
    return error("Too many OTP requests. Please try again later.", 429);
  }

  const purpose = data.purpose || "LOGIN";

  try {
    const result = await sendOtp(normalizedPhone, purpose, clientIp);

    await audit({
      entityType: "OTP",
      entityId: normalizedPhone,
      action: "OTP_SEND",
      tenantId: "public",
      actorId: null,
      actorRole: null,
      afterState: { phone: normalizedPhone, purpose, provider: result.provider },
      ipAddress: clientIp,
      userAgent: request.headers.get("user-agent"),
    });

    return success({
      message: "Code sent",
      // Dev-only: mock provider surfaces the code for local testing.
      // Never expose in production, regardless of provider config.
      devCode: process.env.NODE_ENV !== "production" ? result.devCode : undefined,
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("60 seconds")) {
      return error(err.message, 429);
    }
    if (err instanceof Error && err.message.includes("Rate limit")) {
      return error(err.message, 429);
    }
    console.error("[send-otp] Error:", err);
    return error("Failed to send code. Please try again.", 500);
  }
});