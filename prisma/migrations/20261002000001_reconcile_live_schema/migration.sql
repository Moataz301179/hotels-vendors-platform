-- Generated from a live database-to-schema diff; legacy drops are limited to verified-empty tables/columns.
-- DropForeignKey
ALTER TABLE IF EXISTS "EvidenceRecord" DROP CONSTRAINT IF EXISTS "EvidenceRecord_auditLogId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "IntelligenceEdge" DROP CONSTRAINT IF EXISTS "IntelligenceEdge_auditLogId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "Lead_dataClassification_idx";

-- AlterTable
ALTER TABLE IF EXISTS "Hotel" ADD COLUMN IF NOT EXISTS "taxIdSearch" TEXT;

-- AlterTable
ALTER TABLE IF EXISTS "Lead" DROP COLUMN IF EXISTS "dataClassification", DROP COLUMN IF EXISTS "rawEvidence", DROP COLUMN IF EXISTS "retrievalTimestamp";

-- AlterTable
ALTER TABLE IF EXISTS "Supplier" ADD COLUMN IF NOT EXISTS "taxIdSearch" TEXT;

-- DropTable
DROP TABLE IF EXISTS "EvidenceRecord";

-- DropTable
DROP TABLE IF EXISTS "IntelligenceEdge";

-- DropEnum
-- Keep legacy enum types temporarily: the verified rollback snapshot in hv_backup_20261002 still references them.
-- They are not used by the current public-schema models and can be retired after an external backup is available.

-- CreateTable
CREATE TABLE IF NOT EXISTS "Rfq" (
    "id" TEXT NOT NULL,
    "rfqNumber" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "status" "RfqStatus" NOT NULL DEFAULT 'DRAFT',
    "deadline" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "uuid" UUID DEFAULT gen_random_uuid(),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Rfq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "RfqItem" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "productId" TEXT,
    "category" "ProductCategory" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "specs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uuid" UUID DEFAULT gen_random_uuid(),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RfqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "RfqResponse" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2),
    "validUntil" TIMESTAMP(3),
    "status" "ResponseStatus" NOT NULL DEFAULT 'SUBMITTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "uuid" UUID DEFAULT gen_random_uuid(),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RfqResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EtaSubmission" (
    "id" TEXT NOT NULL,
    "documentUuid" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" "EtaSubmissionStatus" NOT NULL DEFAULT 'PENDING_SUBMISSION',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "etaLongId" TEXT,
    "etaStatus" TEXT,
    "payloadHash" TEXT,
    "responseJson" JSONB,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EtaSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "savings_ledger" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'POTENTIAL',
    "baseline" DECIMAL(14,2),
    "potentialSaving" DECIMAL(14,2),
    "expectedSaving" DECIMAL(14,2),
    "negotiatedAmount" DECIMAL(14,2),
    "realizedAmount" DECIMAL(14,2),
    "verifiedAmount" DECIMAL(14,2),
    "evidence" JSONB,
    "transactionId" TEXT,
    "supplierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "savings_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "spend_upload_record" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spend_upload_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "intelligence_edge" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "relatedEntityId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "confidence" DOUBLE PRECISION,
    "auditLogId" TEXT,
    "provenanceClass" TEXT NOT NULL DEFAULT 'OBSERVED',
    "entityUuid" UUID DEFAULT gen_random_uuid(),
    "status" TEXT DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intelligence_edge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Rfq_rfqNumber_key" ON "Rfq"("rfqNumber");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Rfq_uuid_uniq" ON "Rfq"("uuid");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Rfq_tenantId_idx" ON "Rfq"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Rfq_hotelId_idx" ON "Rfq"("hotelId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Rfq_status_idx" ON "Rfq"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Rfq_deleted_idx" ON "Rfq"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "RfqItem_uuid_uniq" ON "RfqItem"("uuid");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RfqItem_rfqId_idx" ON "RfqItem"("rfqId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RfqItem_productId_idx" ON "RfqItem"("productId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RfqItem_deleted_idx" ON "RfqItem"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "RfqResponse_uuid_uniq" ON "RfqResponse"("uuid");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RfqResponse_rfqId_idx" ON "RfqResponse"("rfqId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RfqResponse_supplierId_idx" ON "RfqResponse"("supplierId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RfqResponse_status_idx" ON "RfqResponse"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RfqResponse_deleted_idx" ON "RfqResponse"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EtaSubmission_documentUuid_uniq" ON "EtaSubmission"("documentUuid");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EtaSubmission_status_nextRetryAt_idx" ON "EtaSubmission"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EtaSubmission_tenantId_idx" ON "EtaSubmission"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EtaSubmission_invoiceId_idx" ON "EtaSubmission"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "intelligence_edge_entityUuid_key" ON "intelligence_edge"("entityUuid");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Hotel_taxIdSearch_key" ON "Hotel"("taxIdSearch");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Supplier_taxIdSearch_key" ON "Supplier"("taxIdSearch");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Rfq_hotelId_fkey' AND conrelid = to_regclass('public."Rfq"')) THEN
    ALTER TABLE "Rfq" ADD CONSTRAINT "Rfq_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Rfq_tenantId_fkey' AND conrelid = to_regclass('public."Rfq"')) THEN
    ALTER TABLE "Rfq" ADD CONSTRAINT "Rfq_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RfqItem_productId_fkey' AND conrelid = to_regclass('public."RfqItem"')) THEN
    ALTER TABLE "RfqItem" ADD CONSTRAINT "RfqItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RfqItem_rfqId_fkey' AND conrelid = to_regclass('public."RfqItem"')) THEN
    ALTER TABLE "RfqItem" ADD CONSTRAINT "RfqItem_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RfqResponse_rfqId_fkey' AND conrelid = to_regclass('public."RfqResponse"')) THEN
    ALTER TABLE "RfqResponse" ADD CONSTRAINT "RfqResponse_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RfqResponse_supplierId_fkey' AND conrelid = to_regclass('public."RfqResponse"')) THEN
    ALTER TABLE "RfqResponse" ADD CONSTRAINT "RfqResponse_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
