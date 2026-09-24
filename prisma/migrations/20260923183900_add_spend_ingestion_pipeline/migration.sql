-- Create Spend Ingestion enums
DO $$ BEGIN
  CREATE TYPE "SpendSourceType" AS ENUM ('CSV', 'EXCEL', 'MANUAL', 'INVOICE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "SpendResolutionStatus" AS ENUM ('RESOLVED', 'PARTIAL', 'UNRESOLVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Create SpendUploadRecord table
CREATE TABLE "SpendUploadRecord" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "sourceType" "SpendSourceType" NOT NULL,
  "rawData" JSONB NOT NULL,
  "normalizedDate" TIMESTAMP(3),
  "supplierId" TEXT,
  "supplierName" TEXT NOT NULL DEFAULT 'Unknown',
  "productId" TEXT,
  "productName" TEXT,
  "sku" TEXT,
  "category" TEXT,
  "quantity" INTEGER,
  "unitPrice" DECIMAL(12,2),
  "totalAmount" DECIMAL(12,2),
  "poNumber" TEXT,
  "invoiceNumber" TEXT,
  "resolutionStatus" "SpendResolutionStatus" NOT NULL DEFAULT 'UNRESOLVED',
  "resolutionNotes" TEXT,
  "opportunityId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "uuid" UUID DEFAULT gen_random_uuid(),
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "SpendUploadRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SpendUploadRecord_uuid_key" ON "SpendUploadRecord"("uuid");
CREATE INDEX "SpendUploadRecord_tenantId_idx" ON "SpendUploadRecord"("tenantId");
CREATE INDEX "SpendUploadRecord_resolutionStatus_idx" ON "SpendUploadRecord"("resolutionStatus");
CREATE INDEX "SpendUploadRecord_normalizedDate_idx" ON "SpendUploadRecord"("normalizedDate");
CREATE INDEX "SpendUploadRecord_supplierId_idx" ON "SpendUploadRecord"("supplierId");
CREATE INDEX "SpendUploadRecord_category_idx" ON "SpendUploadRecord"("category");

ALTER TABLE "SpendUploadRecord" ADD CONSTRAINT "SpendUploadRecord_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SpendUploadRecord" ADD CONSTRAINT "SpendUploadRecord_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SpendUploadRecord" ADD CONSTRAINT "SpendUploadRecord_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
