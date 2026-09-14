import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { VerifyOtpSchema } from "@/lib/zod";
import { apiRoute, validateBody, success, error } from "@/lib/api-utils";
import { verifyOtp, normalizePhone } from "@/lib/auth/otp";
import { isValidEgyptianPhone } from "@/lib/auth/phone";
import { audit } from "@/lib/api-utils";

export const POST = apiRoute(async (request: NextRequest) => {
  // Rate limit: auth tier = 5 attempts per 5 minutes per IP (brute-force protection)
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";

  const body = await request.json();
  const data = validateBody(VerifyOtpSchema, body);

  // Normalize and validate Egyptian phone
  const normalizedPhone = normalizePhone(data.phone);
  if (!isValidEgyptianPhone(normalizedPhone)) {
    return error("Invalid Egyptian mobile number format", 400);
  }

  const purpose = data.purpose || "LOGIN";

  try {
    const result = await verifyOtp(normalizedPhone, data.code, purpose);

    await audit({
      entityType: "OTP",
      entityId: normalizedPhone,
      action: "OTP_VERIFY",
      tenantId: "public",
      actorId: null,
      actorRole: null,
      afterState: { phone: normalizedPhone, purpose, success: result.success },
      ipAddress: clientIp,
      userAgent: request.headers.get("user-agent"),
    });

    if (!result.success) {
      return error(result.message, 400);
    }

    return success({ message: result.message });
  } catch (err) {
    console.error("[verify-otp] Error:", err);
    return error("Failed to verify code. Please try again.", 500);
  }
}, { rateLimit: "auth" });