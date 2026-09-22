import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiRoute, success, error } from "@/lib/api-utils";
import { createHash } from "crypto";

const VerifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const POST = apiRoute(async (request: NextRequest) => {
  const body = await request.json();
  const parsed = VerifyEmailSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message || "Invalid request body", 400);
  }
  const { token } = parsed.data;

  // Hash the incoming token to match stored hash
  const tokenHash = hashToken(token);

  const verification = await prisma.emailVerificationToken.findUnique({
    where: { token: tokenHash },
  });

  if (!verification) {
    return error("Invalid or expired verification token", 400);
  }

  if (verification.expiresAt < new Date()) {
    await prisma.emailVerificationToken.delete({ where: { id: verification.id } });
    return error("Verification token has expired. Please request a new one.", 400);
  }

  await prisma.user.update({
    where: { email: verification.email },
    data: { emailVerifiedAt: new Date() },
  });

  await prisma.emailVerificationToken.delete({ where: { id: verification.id } });

  return success({ message: "Email verified successfully" });
});
