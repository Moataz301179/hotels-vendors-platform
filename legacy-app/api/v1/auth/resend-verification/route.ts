import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiRoute, success, error } from "@/lib/api-utils";
import { checkRateLimit } from "@/lib/redis";
import { sendEmail, emailVerificationTemplate } from "@/lib/notifications/email";
import { randomBytes, createHash } from "crypto";

const ResendVerificationSchema = z.object({
  email: z.string().email("Valid email is required"),
});

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const POST = apiRoute(async (request: NextRequest) => {
  const body = await request.json();
  const parsed = ResendVerificationSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message || "Invalid request body", 400);
  }
  const { email } = parsed.data;

  // Rate limit: 3 resends per hour per email
  const rateLimit = await checkRateLimit(`resend-verify:${email.toLowerCase()}`, 3600, 3);
  if (!rateLimit.allowed) {
    return error("Too many requests. Please try again later.", 429);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    // Return success to prevent email enumeration
    return success({ message: "If an account exists, a verification email has been sent." });
  }

  if (user.emailVerifiedAt) {
    return success({ message: "Email is already verified." });
  }

  // Delete any existing tokens for this email
  await prisma.emailVerificationToken.deleteMany({
    where: { email: user.email },
  });

  const token = generateToken();
  const tokenHash = hashToken(token);
  await prisma.emailVerificationToken.create({
    data: {
      email: user.email,
      token: tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hotels-vendors.com";

  try {
    const verification = emailVerificationTemplate({
      name: user.name,
      verificationUrl: `${baseUrl}/verify-email?token=${token}`,
    });
    await sendEmail({
      to: [user.email],
      subject: verification.subject,
      html: verification.html,
    });
  } catch {
    console.error("[ResendVerify] Failed to send verification email to", user.email);
  }

  return success({ message: "If an account exists, a verification email has been sent." });
});
