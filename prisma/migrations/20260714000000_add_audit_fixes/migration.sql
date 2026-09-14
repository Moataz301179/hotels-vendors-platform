-- Audit Fixes Migration: Consent, KYC, Refresh Tokens, Disputes, Evidence
-- Generated from schema changes — applied via db push on production

-- 1. User consent fields
ALTER TABLE "User" ADD COLUMN "marketingConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "privacyPolicyVersion" TEXT;

-- 2. KYC fields on User
ALTER TABLE "User" ADD COLUMN "kycLevel" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "kycStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED';
ALTER TABLE "User" ADD COLUMN "kycVerifiedAt" TIMESTAMP(3);

-- 3. KYC fields on Tenant (already added via db push)
-- ALTER TABLE "Tenant" ADD COLUMN "kycLevel" INTEGER NOT NULL DEFAULT 0;
-- ALTER TABLE "Tenant" ADD COLUMN "kycStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED';
-- ALTER TABLE "Tenant" ADD COLUMN "kycVerifiedAt" TIMESTAMP(3);

-- 4. Refresh tokens table (if not exists)
CREATE TABLE IF NOT EXISTS "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedBy" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX IF NOT EXISTS "RefreshToken_family_idx" ON "RefreshToken"("family");

-- 5. Disputes table (if not exists)
CREATE TABLE IF NOT EXISTS "Dispute" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT,
    "invoiceId" TEXT,
    "raisedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);
