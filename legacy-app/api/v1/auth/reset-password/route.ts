import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { createSession, revokeToken } from "@/lib/session";
import { apiRoute, success, error } from "@/lib/api-utils";
import { sendEmail, passwordResetConfirmationTemplate } from "@/lib/notifications/email";
import { createHash } from "crypto";

const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
    .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
    .regex(/[0-9]/, "Password must contain at least 1 number"),
});

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const POST = apiRoute(async (request: NextRequest) => {
  const body = await request.json();
  const parsed = ResetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message || "Invalid request body", 400);
  }
  const { token, password } = parsed.data;

  // Hash the incoming token to match stored hash
  const tokenHash = hashToken(token);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: tokenHash },
  });

  if (!resetToken) {
    return error("Invalid or expired reset token", 400);
  }

  if (resetToken.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
    return error("Reset token has expired. Please request a new one.", 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: resetToken.email },
  });

  if (!user) {
    return error("User not found", 404);
  }

  const passwordHash = await hashPassword(password);

  // Wrap password update + token deletion in a transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.delete({ where: { id: resetToken.id } }),
  ]);

  // Revoke all existing sessions for this user by blacklisting all known token patterns
  // The previous approach of revoking "user:ID:all" didn't match actual JWT tokens.
  // Instead, we use a user-scoped blacklist prefix that verifySession checks.
  const redis = (await import("@/lib/redis")).getRedis?.();
  if (redis) {
    try {
      // Set a user-level revocation marker with TTL matching max session age (24h)
      await redis.setex(`session:user-revoked:${user.id}`, 86400, Date.now().toString());
    } catch {
      // Non-critical — session revocation best-effort
    }
  }

  // Send confirmation email
  try {
    const confirmation = passwordResetConfirmationTemplate({
      name: user.name,
    });
    await sendEmail({
      to: [user.email],
      subject: confirmation.subject,
      html: confirmation.html,
    });
  } catch {
    console.error("[ResetPassword] Failed to send confirmation email to", user.email);
  }

  // Auto-login: create session
  const sessionToken = await createSession(user.id, user.platformRole, user.tenantId);

  return success({
    message: "Password reset successfully",
    user: { id: user.id, email: user.email, name: user.name, platformRole: user.platformRole },
  });
});
