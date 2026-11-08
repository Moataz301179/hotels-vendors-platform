-- Receiving Dock: append-only raw market intake and two-agent processing evidence.
-- Additive only. It does not create Product or Supplier rows and does not publish buyer entries.

DO $$ BEGIN
  CREATE TYPE "CatalogReceivingBatchStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'READY_FOR_EXPORT', 'EXPORTED', 'PARTIAL', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "CatalogReceivingQualityStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVIEW_REQUIRED', 'REJECTED', 'DUPLICATE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "CatalogReceivingTaxonomyStatus" AS ENUM ('PENDING', 'MAPPED', 'REVIEW_REQUIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "CatalogSubagentStage" AS ENUM ('QUALITY_FILTER', 'HOSPITALITY_TAXONOMY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "CatalogSubagentRunStatus" AS ENUM ('COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "CatalogReceivingBatch" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "sourceName" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourcePermissionStatus" TEXT NOT NULL DEFAULT 'PERMISSION_UNKNOWN',
  "sourcePermissionNote" TEXT,
  "sourceObservedAt" TIMESTAMP(3) NOT NULL,
  "payloadChecksum" TEXT NOT NULL,
  "status" "CatalogReceivingBatchStatus" NOT NULL DEFAULT 'RECEIVED',
  "receivedById" TEXT NOT NULL,
  "recordCount" INTEGER NOT NULL DEFAULT 0,
  "acceptedCount" INTEGER NOT NULL DEFAULT 0,
  "rejectedCount" INTEGER NOT NULL DEFAULT 0,
  "exportedCount" INTEGER NOT NULL DEFAULT 0,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "CatalogReceivingBatch_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogReceivingBatch_counts_check" CHECK (
    "recordCount" >= 0 AND "acceptedCount" >= 0 AND "rejectedCount" >= 0 AND "exportedCount" >= 0
  ),
  CONSTRAINT "CatalogReceivingBatch_tenant_fkey" FOREIGN KEY ("tenantId")
    REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "CatalogReceivingBatch_tenant_checksum_key"
  ON "CatalogReceivingBatch"("tenantId", "payloadChecksum");
CREATE INDEX IF NOT EXISTS "CatalogReceivingBatch_tenant_status_received_idx"
  ON "CatalogReceivingBatch"("tenantId", "status", "receivedAt");
CREATE INDEX IF NOT EXISTS "CatalogReceivingBatch_sourceUrl_idx" ON "CatalogReceivingBatch"("sourceUrl");
CREATE INDEX IF NOT EXISTS "CatalogReceivingBatch_deletedAt_idx" ON "CatalogReceivingBatch"("deletedAt");

CREATE TABLE IF NOT EXISTS "CatalogReceivingRecord" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "sourceRecordKey" TEXT,
  "dedupeKey" TEXT NOT NULL,
  "productUrl" TEXT,
  "rawSupplierName" TEXT,
  "rawSupplierWebsite" TEXT,
  "rawProductName" TEXT NOT NULL,
  "rawProductDescription" TEXT,
  "rawCategory" TEXT,
  "rawSku" TEXT,
  "rawBrand" TEXT,
  "rawPackSize" TEXT,
  "rawUnitOfMeasure" TEXT,
  "rawPurchaseUnit" TEXT,
  "observedPrice" DECIMAL(14,2),
  "observedCurrency" TEXT NOT NULL DEFAULT 'EGP',
  "rawStockText" TEXT,
  "imageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "rawPayload" JSONB NOT NULL,
  "qualityStatus" "CatalogReceivingQualityStatus" NOT NULL DEFAULT 'PENDING',
  "taxonomyStatus" "CatalogReceivingTaxonomyStatus" NOT NULL DEFAULT 'PENDING',
  "qualityOutput" JSONB,
  "taxonomyOutput" JSONB,
  "normalizedName" TEXT,
  "normalizedDescription" TEXT,
  "mappedCategoryCode" TEXT,
  "mappedSubcategoryCode" TEXT,
  "normalizedUnitOfMeasure" TEXT,
  "normalizedPurchaseUnit" TEXT,
  "normalizedSpecifications" JSONB,
  "directoryCandidateId" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "exportedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "CatalogReceivingRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogReceivingRecord_price_check" CHECK ("observedPrice" IS NULL OR "observedPrice" >= 0),
  CONSTRAINT "CatalogReceivingRecord_batch_fkey" FOREIGN KEY ("batchId")
    REFERENCES "CatalogReceivingBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CatalogReceivingRecord_directoryCandidate_fkey" FOREIGN KEY ("directoryCandidateId")
    REFERENCES "DirectoryCandidate"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "CatalogReceivingRecord_batch_quality_taxonomy_idx"
  ON "CatalogReceivingRecord"("batchId", "qualityStatus", "taxonomyStatus");
CREATE INDEX IF NOT EXISTS "CatalogReceivingRecord_dedupe_received_idx"
  ON "CatalogReceivingRecord"("dedupeKey", "receivedAt");
CREATE INDEX IF NOT EXISTS "CatalogReceivingRecord_directoryCandidate_idx"
  ON "CatalogReceivingRecord"("directoryCandidateId");
CREATE INDEX IF NOT EXISTS "CatalogReceivingRecord_supplier_idx"
  ON "CatalogReceivingRecord"("rawSupplierName");
CREATE INDEX IF NOT EXISTS "CatalogReceivingRecord_deletedAt_idx" ON "CatalogReceivingRecord"("deletedAt");

CREATE TABLE IF NOT EXISTS "CatalogAgentRun" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "stage" "CatalogSubagentStage" NOT NULL,
  "status" "CatalogSubagentRunStatus" NOT NULL DEFAULT 'COMPLETED',
  "engineVersion" TEXT NOT NULL,
  "inputCount" INTEGER NOT NULL DEFAULT 0,
  "acceptedCount" INTEGER NOT NULL DEFAULT 0,
  "rejectedCount" INTEGER NOT NULL DEFAULT 0,
  "reviewCount" INTEGER NOT NULL DEFAULT 0,
  "output" JSONB NOT NULL,
  "requestedById" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CatalogAgentRun_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogAgentRun_counts_check" CHECK (
    "inputCount" >= 0 AND "acceptedCount" >= 0 AND "rejectedCount" >= 0 AND "reviewCount" >= 0
  ),
  CONSTRAINT "CatalogAgentRun_batch_fkey" FOREIGN KEY ("batchId")
    REFERENCES "CatalogReceivingBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "CatalogAgentRun_batch_stage_created_idx"
  ON "CatalogAgentRun"("batchId", "stage", "createdAt");
