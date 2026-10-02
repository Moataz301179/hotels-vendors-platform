-- Idempotent repair of the phone/OTP schema. The production database already
-- contains these fields and indexes from an earlier schema sync, so the
-- migration must be safe both on a fresh database and on that live database.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "refreshTokenHash" TEXT;

CREATE TABLE IF NOT EXISTS "OtpVerification" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "codeHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uuid" UUID DEFAULT gen_random_uuid(),
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OtpVerification_phone_key" ON "OtpVerification"("phone");
CREATE INDEX IF NOT EXISTS "OtpVerification_phone_purpose_createdAt_idx" ON "OtpVerification"("phone", "purpose", "createdAt");
CREATE INDEX IF NOT EXISTS "OtpVerification_deletedAt_idx" ON "OtpVerification"("deletedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");
