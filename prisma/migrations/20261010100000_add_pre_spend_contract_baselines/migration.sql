-- Local-only migration artifact. Do not apply until the documented migration
-- reconciliation, backup/restore proof, and release approval are complete.

DO $$ BEGIN
  CREATE TYPE "ContractBaselineStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'RETIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "EntityName" ADD VALUE IF NOT EXISTS 'CONTRACT_RATE_BASELINE';

CREATE TABLE IF NOT EXISTS "ContractRateBaseline" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "hotelId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "normalizedItemKey" TEXT NOT NULL,
  "unitOfMeasure" TEXT NOT NULL,
  "packDescription" TEXT,
  "rateQuantity" INTEGER NOT NULL,
  "unitPrice" DECIMAL(12,2) NOT NULL,
  "deliveryFee" DECIMAL(12,2),
  "taxAmount" DECIMAL(12,2),
  "currency" TEXT NOT NULL DEFAULT 'EGP',
  "minimumOrderQty" INTEGER,
  "deliveryTerms" TEXT,
  "sourceReference" TEXT NOT NULL,
  "validFrom" TIMESTAMP,
  "validUntil" TIMESTAMP,
  "status" "ContractBaselineStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdById" TEXT NOT NULL,
  "approvalOwnerId" TEXT,
  "approvedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uuid" UUID DEFAULT gen_random_uuid(),
  "deletedAt" TIMESTAMP,
  CONSTRAINT "ContractRateBaseline_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ContractRateBaseline_uuid_key"
  ON "ContractRateBaseline"("uuid") WHERE "uuid" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "ContractRateBaseline_tenant_hotel_status_idx"
  ON "ContractRateBaseline"("tenantId", "hotelId", "status");
CREATE INDEX IF NOT EXISTS "ContractRateBaseline_tenant_product_idx"
  ON "ContractRateBaseline"("tenantId", "productId");
CREATE INDEX IF NOT EXISTS "ContractRateBaseline_tenant_supplier_idx"
  ON "ContractRateBaseline"("tenantId", "supplierId");
CREATE INDEX IF NOT EXISTS "ContractRateBaseline_tenant_item_key_idx"
  ON "ContractRateBaseline"("tenantId", "normalizedItemKey");
CREATE INDEX IF NOT EXISTS "ContractRateBaseline_deleted_idx"
  ON "ContractRateBaseline"("deletedAt");

DO $$ BEGIN
  ALTER TABLE "ContractRateBaseline" ADD CONSTRAINT "ContractRateBaseline_tenant_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "RfqRequest" ADD COLUMN IF NOT EXISTS "baselineId" TEXT;
ALTER TABLE "RfqRequest" ADD COLUMN IF NOT EXISTS "normalizedItemKey" TEXT;
ALTER TABLE "RfqRequest" ADD COLUMN IF NOT EXISTS "packDescription" TEXT;
CREATE INDEX IF NOT EXISTS "RfqRequest_tenant_baseline_idx"
  ON "RfqRequest"("tenantId", "baselineId");

ALTER TABLE "ProcurementQuote" ADD COLUMN IF NOT EXISTS "supplierProductId" TEXT;
ALTER TABLE "ProcurementQuote" ADD COLUMN IF NOT EXISTS "normalizedItemKey" TEXT;
ALTER TABLE "ProcurementQuote" ADD COLUMN IF NOT EXISTS "unitOfMeasure" TEXT;
ALTER TABLE "ProcurementQuote" ADD COLUMN IF NOT EXISTS "packDescription" TEXT;
ALTER TABLE "ProcurementQuote" ADD COLUMN IF NOT EXISTS "taxAmount" DECIMAL(12,2);
