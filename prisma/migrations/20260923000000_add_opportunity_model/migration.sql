-- Create Opportunity enums
DO $$ BEGIN
  CREATE TYPE "OpportunityType" AS ENUM (
    'PRICE_DRIFT',
    'SUPPLIER_CONCENTRATION',
    'VOLUME_OPPORTUNITY',
    'ALTERNATIVE_SOURCE',
    'MAVERICK_SPEND',
    'CONSOLIDATION',
    'CONTRACT_VIOLATION',
    'INVENTORY_LINKED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "OpportunityStatus" AS ENUM (
    'DETECTED',
    'REVIEWING',
    'RESEARCHING',
    'ACTION_READY',
    'RFQ_SENT',
    'APPROVED',
    'EXECUTING',
    'RESULT_PENDING',
    'VERIFIED',
    'CLOSED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Create Opportunity table
CREATE TABLE "Opportunity" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "type" "OpportunityType" NOT NULL,
  "status" "OpportunityStatus" NOT NULL DEFAULT 'DETECTED',
  "title" TEXT NOT NULL,
  "description" TEXT,
  "evidence" JSONB,
  "baseline" DECIMAL(14, 2),
  "currentValue" DECIMAL(14, 2),
  "potentialImpact" DECIMAL(14, 2),
  "confidence" DOUBLE PRECISION,
  "recommendedAction" TEXT,
  "affectedSupplierId" TEXT,
  "affectedProductId" TEXT,
  "affectedCategory" TEXT,
  "ownerId" TEXT,
  "resultingTransactionId" TEXT,
  "realizedResult" JSONB,
  "verificationState" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "uuid" TEXT,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Opportunity_uuid_key" ON "Opportunity"("uuid");
CREATE INDEX "Opportunity_tenantId_idx" ON "Opportunity"("tenantId");
CREATE INDEX "Opportunity_type_idx" ON "Opportunity"("type");
CREATE INDEX "Opportunity_status_idx" ON "Opportunity"("status");
CREATE INDEX "Opportunity_ownerId_idx" ON "Opportunity"("ownerId");
CREATE INDEX "Opportunity_affectedSupplierId_idx" ON "Opportunity"("affectedSupplierId");
CREATE INDEX "Opportunity_createdAt_idx" ON "Opportunity"("createdAt");
CREATE INDEX "Opportunity_deleted_idx" ON "Opportunity"("deletedAt");

ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_affectedSupplierId_fkey"
  FOREIGN KEY ("affectedSupplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_affectedProductId_fkey"
  FOREIGN KEY ("affectedProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
