-- CreateEnum
CREATE TYPE "SavingsType" AS ENUM ('NEGOTIATED', 'REALIZED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "SavingsStatus" AS ENUM ('POTENTIAL', 'EXPECTED', 'NEGOTIATED', 'REALIZED', 'VERIFIED', 'DISPUTED', 'REVERSED');

-- CreateTable
CREATE TABLE "SavingsLedger" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "type" "SavingsType" NOT NULL,
    "status" "SavingsStatus" NOT NULL DEFAULT 'POTENTIAL',
    "baseline" DECIMAL(14,2),
    "potentialSaving" DECIMAL(14,2),
    "expectedSaving" DECIMAL(14,2),
    "negotiatedAmount" DECIMAL(14,2),
    "realizedAmount" DECIMAL(14,2),
    "verifiedAmount" DECIMAL(14,2),
    "evidence" JSONB,
    "transactionId" TEXT,
    "supplierId" TEXT,
    "category" TEXT,
    "productId" TEXT,
    "ownerId" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "disputeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "uuid" UUID DEFAULT gen_random_uuid(),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SavingsLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavingsLedger_uuid_uniq" ON "SavingsLedger"("uuid");

-- CreateIndex
CREATE INDEX "SavingsLedger_tenantId_idx" ON "SavingsLedger"("tenantId");

-- CreateIndex
CREATE INDEX "SavingsLedger_opportunityId_idx" ON "SavingsLedger"("opportunityId");

-- CreateIndex
CREATE INDEX "SavingsLedger_type_idx" ON "SavingsLedger"("type");

-- CreateIndex
CREATE INDEX "SavingsLedger_status_idx" ON "SavingsLedger"("status");

-- CreateIndex
CREATE INDEX "SavingsLedger_supplierId_idx" ON "SavingsLedger"("supplierId");

-- CreateIndex
CREATE INDEX "SavingsLedger_category_idx" ON "SavingsLedger"("category");

-- CreateIndex
CREATE INDEX "SavingsLedger_ownerId_idx" ON "SavingsLedger"("ownerId");

-- CreateIndex
CREATE INDEX "SavingsLedger_verifiedById_idx" ON "SavingsLedger"("verifiedById");

-- CreateIndex
CREATE INDEX "SavingsLedger_createdAt_idx" ON "SavingsLedger"("createdAt");

-- CreateIndex
CREATE INDEX "SavingsLedger_deleted_idx" ON "SavingsLedger"("deletedAt");

-- AddForeignKey
ALTER TABLE "SavingsLedger" ADD CONSTRAINT "SavingsLedger_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsLedger" ADD CONSTRAINT "SavingsLedger_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsLedger" ADD CONSTRAINT "SavingsLedger_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsLedger" ADD CONSTRAINT "SavingsLedger_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsLedger" ADD CONSTRAINT "SavingsLedger_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsLedger" ADD CONSTRAINT "SavingsLedger_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
