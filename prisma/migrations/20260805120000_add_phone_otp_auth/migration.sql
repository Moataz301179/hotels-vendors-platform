-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phoneVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "refreshTokenHash" TEXT;
-- CreateTable
CREATE TABLE "OtpVerification" (
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
-- CreateIndex
CREATE UNIQUE INDEX "OtpVerification_uuid_uniq" ON "OtpVerification"("uuid");
-- CreateIndex
CREATE INDEX "OtpVerification_phone_purpose_createdAt_idx" ON "OtpVerification"("phone", "purpose", "createdAt");
-- CreateIndex
CREATE INDEX "OtpVerification_deleted_idx" ON "OtpVerification"("deletedAt");
-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
