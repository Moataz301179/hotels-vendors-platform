/**
 * OTP Service — Hotels Vendors
 * Provider abstraction for SMS OTP delivery (Twilio Verify + mock for development)
 */

import { prisma } from "@/lib/prisma";
import { createHash, randomBytes } from "crypto";
import { checkRateLimit } from "@/lib/redis";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";

export type OtpProvider = "mock" | "twilio" | "whatsapp";
export type OtpPurpose = "LOGIN" | "REGISTER" | "PASSWORD_RESET" | "MFA";

export interface OtpSendResult {
  provider: OtpProvider;
  devCode?: string; // Only in non-production mock mode
}

export interface OtpVerificationResult {
  success: boolean;
  message: string;
}

// Environment configuration
const OTP_PROVIDER: OtpProvider = (process.env.OTP_PROVIDER as OtpProvider) || "mock";
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

const COOLDOWN_SECONDS = 60;
const CODE_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;

// Twilio client (lazy initialization)
let twilioClient: ReturnType<typeof import("twilio")> | null = null;

async function getTwilioClient() {
  if (!twilioClient && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    const twilio = await import("twilio");
    twilioClient = twilio.default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

/**
 * Check cooldown - prevent sending OTP too frequently
 */
async function checkCooldown(phone: string, purpose: OtpPurpose): Promise<boolean> {
  const existing = await prisma.otpVerification.findFirst({
    where: {
      phone,
      purpose,
      createdAt: { gte: new Date(Date.now() - COOLDOWN_SECONDS * 1000) },
    },
    orderBy: { createdAt: "desc" },
  });
  return !existing; // true = can send, false = cooldown active
}

/**
 * Rate limiting for OTP sends
 */
async function checkOtpRateLimits(phone: string, ip: string): Promise<{ allowed: boolean; message?: string }> {
  // Per IP: 10 requests/hour
  const ipLimit = await checkRateLimit(`otp:send:${ip}`, 3600, 10);
  if (!ipLimit.allowed) {
    return { allowed: false, message: "Too many requests from this IP. Please try again later." };
  }

  // Per phone: 5 requests/hour
  const phoneLimit = await checkRateLimit(`otp:phone:${phone}`, 3600, 5);
  if (!phoneLimit.allowed) {
    return { allowed: false, message: "Too many requests for this phone number. Please try again later." };
  }

  return { allowed: true };
}

/**
 * Send OTP via provider
 */
export async function sendOtp(phone: string, purpose: OtpPurpose, ip: string): Promise<OtpSendResult> {
  const normalizedPhone = normalizePhoneForStorage(phone);

  // Rate limiting
  const rateLimit = await checkOtpRateLimits(normalizedPhone, ip);
  if (!rateLimit.allowed) {
    throw new Error(rateLimit.message || "Rate limit exceeded");
  }

  // Cooldown check
  const canSend = await checkCooldown(normalizedPhone, purpose);
  if (!canSend) {
    throw new Error(`Please wait ${COOLDOWN_SECONDS} seconds before requesting a new code`);
  }

  // Create verification record
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
  const verification = await prisma.otpVerification.create({
    data: {
      phone: normalizedPhone,
      purpose,
      provider: OTP_PROVIDER,
      codeHash: null, // Will be set for mock provider
      expiresAt,
    },
  });

  if (OTP_PROVIDER === "twilio") {
    return sendOtpTwilio(normalizedPhone, verification.id);
  } else if (OTP_PROVIDER === "whatsapp") {
    return sendOtpWhatsApp(normalizedPhone, verification.id);
  } else {
    return sendOtpMock(normalizedPhone, verification.id);
  }
}

/**
 * Send OTP via WhatsApp Cloud API (Meta). Reuses the verified sendWhatsApp path.
 * Recipient must use WhatsApp; falls back to mock code if WhatsApp isn't configured.
 */
async function sendOtpWhatsApp(phone: string, verificationId: string): Promise<OtpSendResult> {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  const codeHash = createHash("sha256").update(code).digest("hex");
  await prisma.otpVerification.update({
    where: { id: verificationId },
    data: { codeHash },
  });

  const sent = await sendWhatsApp({
    to: phone,
    body: `HotelsVendors login code: ${code}. Valid for 5 minutes. Do not share it.`,
  });
  if (!sent) {
    console.warn(`[OTP] WhatsApp send failed for ${phone}; code was not delivered.`);
    throw new Error("Failed to send your code on WhatsApp. Please try again or use email login.");
  }
  console.log(`[OTP WhatsApp] code delivered to ${phone}`);
  return { provider: "whatsapp" };
}

/**
 * Send OTP via Twilio Verify
 */
async function sendOtpTwilio(phone: string, verificationId: string): Promise<OtpSendResult> {
  const client = await getTwilioClient();
  if (!client || !TWILIO_VERIFY_SERVICE_SID) {
    throw new Error("Twilio Verify not configured");
  }

  try {
    await client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID).verifications.create({
      to: phone,
      channel: "sms",
    });
    return { provider: "twilio" };
  } catch (error) {
    console.error("[OTP] Twilio send failed:", error);
    throw new Error("Failed to send SMS. Please try again.");
  }
}

/**
 * Send OTP via mock provider (development only)
 * Generates 6-digit code, stores hash, returns devCode in non-production
 */
async function sendOtpMock(phone: string, verificationId: string): Promise<OtpSendResult> {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  const codeHash = createHash("sha256").update(code).digest("hex");

  // Store the code hash
  await prisma.otpVerification.update({
    where: { id: verificationId },
    data: { codeHash },
  });

  // Log to console for development
  console.log(`[OTP Mock] Code for ${phone}: ${code}`);

  // Only return devCode in non-production
  if (process.env.NODE_ENV !== "production") {
    return { provider: "mock", devCode: code };
  }

  return { provider: "mock" };
}

/**
 * Verify OTP code
 */
export async function verifyOtp(phone: string, code: string, purpose: OtpPurpose): Promise<OtpVerificationResult> {
  const normalizedPhone = normalizePhoneForStorage(phone);

  // Find the latest unverified, non-expired verification record
  const verification = await prisma.otpVerification.findFirst({
    where: {
      phone: normalizedPhone,
      purpose,
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!verification) {
    return { success: false, message: "Invalid or expired code" };
  }

  // Check attempts
  if (verification.attempts >= MAX_ATTEMPTS) {
    await prisma.otpVerification.update({
      where: { id: verification.id },
      data: { verifiedAt: new Date() }, // Invalidate by marking as verified
    });
    return { success: false, message: "Too many failed attempts. Please request a new code." };
  }

  // Increment attempts
  await prisma.otpVerification.update({
    where: { id: verification.id },
    data: { attempts: { increment: 1 } },
  });

  let isValid = false;

  if (OTP_PROVIDER === "twilio") {
    isValid = await verifyOtpTwilio(normalizedPhone, code);
  } else {
    isValid = await verifyOtpMock(verification, code);
  }

  if (isValid) {
    await prisma.otpVerification.update({
      where: { id: verification.id },
      data: { verifiedAt: new Date() },
    });
    return { success: true, message: "Verified" };
  }

  return { success: false, message: "Invalid or expired code" };
}

/**
 * Verify OTP via Twilio Verify
 */
async function verifyOtpTwilio(phone: string, code: string): Promise<boolean> {
  const client = await getTwilioClient();
  if (!client || !TWILIO_VERIFY_SERVICE_SID) {
    throw new Error("Twilio Verify not configured");
  }

  try {
    const check = await client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID).verificationChecks.create({
      to: phone,
      code,
    });
    return check.status === "approved";
  } catch (error) {
    console.error("[OTP] Twilio verify failed:", error);
    return false;
  }
}

/**
 * Verify OTP via mock provider (compares hash)
 */
async function verifyOtpMock(verification: { codeHash: string | null }, code: string): Promise<boolean> {
  if (!verification.codeHash) return false;
  const codeHash = createHash("sha256").update(code).digest("hex");
  return codeHash === verification.codeHash;
}

/**
 * Normalize phone for storage (E.164 format)
 */
function normalizePhoneForStorage(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
  if (cleaned.startsWith("0020")) cleaned = cleaned.slice(4);
  if (cleaned.startsWith("0")) cleaned = cleaned.slice(1);
  if (!cleaned.startsWith("20")) cleaned = "20" + cleaned;
  return "+" + cleaned;
}

/**
 * Re-export normalizePhone for external use
 */
export { normalizePhoneForStorage as normalizePhone };

/**
 * Check if OTP is already verified for a phone/purpose
 */
export async function isOtpVerified(phone: string, purpose: OtpPurpose): Promise<boolean> {
  const normalizedPhone = normalizePhoneForStorage(phone);
  const verification = await prisma.otpVerification.findFirst({
    where: {
      phone: normalizedPhone,
      purpose,
      verifiedAt: { not: null },
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  return !!verification;
}