-- HoReCa master catalogue staging. This migration is additive and deliberately
-- does not attach public references to Vendors, live stock, or binding offers.
-- Apply to a cloned Neon branch before production.

DO $$ BEGIN
  CREATE TYPE "CatalogReferenceStatus" AS ENUM ('STAGED', 'PENDING_REVIEW', 'PUBLISHED_REFERENCE', 'REJECTED', 'RETIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CatalogTaxCodeScheme" AS ENUM ('EGS', 'GS1', 'HV_INTERNAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CatalogImportStatus" AS ENUM ('UPLOADED', 'VALIDATING', 'REVIEW_REQUIRED', 'COMPLETED', 'REJECTED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "CatalogTaxonomy" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "parentId" TEXT,
  "depth" INTEGER NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatalogTaxonomy_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogTaxonomy_depth_check" CHECK ("depth" >= 0 AND "depth" <= 4)
);

CREATE UNIQUE INDEX IF NOT EXISTS "CatalogTaxonomy_code_key" ON "CatalogTaxonomy"("code");
CREATE INDEX IF NOT EXISTS "CatalogTaxonomy_parentId_sortOrder_idx" ON "CatalogTaxonomy"("parentId", "sortOrder");

ALTER TABLE "CatalogTaxonomy" DROP CONSTRAINT IF EXISTS "CatalogTaxonomy_parentId_fkey";
ALTER TABLE "CatalogTaxonomy" ADD CONSTRAINT "CatalogTaxonomy_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "CatalogTaxonomy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "CatalogImportBatch" (
  "id" TEXT NOT NULL,
  "sourceName" TEXT NOT NULL,
  "attributionSource" TEXT NOT NULL,
  "accessPolicy" TEXT NOT NULL,
  "sourceChecksum" TEXT NOT NULL,
  "status" "CatalogImportStatus" NOT NULL DEFAULT 'UPLOADED',
  "submittedById" TEXT,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "rowCount" INTEGER NOT NULL DEFAULT 0,
  "acceptedCount" INTEGER NOT NULL DEFAULT 0,
  "rejectedCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatalogImportBatch_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogImportBatch_counts_check" CHECK ("rowCount" >= 0 AND "acceptedCount" >= 0 AND "rejectedCount" >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS "CatalogImportBatch_sourceChecksum_key" ON "CatalogImportBatch"("sourceChecksum");
CREATE INDEX IF NOT EXISTS "CatalogImportBatch_status_createdAt_idx" ON "CatalogImportBatch"("status", "createdAt");

CREATE TABLE IF NOT EXISTS "CatalogStagingItem" (
  "id" TEXT NOT NULL,
  "importBatchId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "itemNameAr" TEXT,
  "normalizedKey" TEXT NOT NULL,
  "technicalSpecs" JSONB NOT NULL,
  "imageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "imageRightsStatus" TEXT NOT NULL,
  "defaultMoq" INTEGER NOT NULL,
  "estimatedPriceEgp" DECIMAL(14,2),
  "egsCode" TEXT NOT NULL,
  "taxCodeScheme" "CatalogTaxCodeScheme" NOT NULL,
  "attributionSource" TEXT NOT NULL,
  "sourceRecordKey" TEXT,
  "sourceObservedAt" TIMESTAMP(3) NOT NULL,
  "status" "CatalogReferenceStatus" NOT NULL DEFAULT 'STAGED',
  "reviewNote" TEXT,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "CatalogStagingItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CatalogStagingItem_moq_check" CHECK ("defaultMoq" > 0),
  CONSTRAINT "CatalogStagingItem_price_check" CHECK ("estimatedPriceEgp" IS NULL OR "estimatedPriceEgp" >= 0),
  CONSTRAINT "CatalogStagingItem_code_format_check" CHECK (
    ("taxCodeScheme" = 'GS1' AND "egsCode" ~ '^[0-9]{8,14}$') OR
    ("taxCodeScheme" = 'EGS' AND length(trim("egsCode")) >= 3) OR
    ("taxCodeScheme" = 'HV_INTERNAL' AND "egsCode" ~ '^HV-[A-Z0-9][A-Z0-9-]{4,63}$')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS "CatalogStagingItem_normalizedKey_categoryId_importBatchId_key"
  ON "CatalogStagingItem"("normalizedKey", "categoryId", "importBatchId");
CREATE INDEX IF NOT EXISTS "CatalogStagingItem_categoryId_status_idx" ON "CatalogStagingItem"("categoryId", "status");
CREATE INDEX IF NOT EXISTS "CatalogStagingItem_taxCodeScheme_egsCode_idx" ON "CatalogStagingItem"("taxCodeScheme", "egsCode");
CREATE INDEX IF NOT EXISTS "CatalogStagingItem_deletedAt_idx" ON "CatalogStagingItem"("deletedAt");

ALTER TABLE "CatalogStagingItem" DROP CONSTRAINT IF EXISTS "CatalogStagingItem_importBatchId_fkey";
ALTER TABLE "CatalogStagingItem" ADD CONSTRAINT "CatalogStagingItem_importBatchId_fkey"
  FOREIGN KEY ("importBatchId") REFERENCES "CatalogImportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CatalogStagingItem" DROP CONSTRAINT IF EXISTS "CatalogStagingItem_categoryId_fkey";
ALTER TABLE "CatalogStagingItem" ADD CONSTRAINT "CatalogStagingItem_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "CatalogTaxonomy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RfqRequest" ADD COLUMN IF NOT EXISTS "catalogStagingItemId" TEXT;
CREATE INDEX IF NOT EXISTS "RfqRequest_catalogStagingItemId_idx" ON "RfqRequest"("catalogStagingItemId");
ALTER TABLE "RfqRequest" DROP CONSTRAINT IF EXISTS "RfqRequest_catalogStagingItemId_fkey";
ALTER TABLE "RfqRequest" ADD CONSTRAINT "RfqRequest_catalogStagingItemId_fkey"
  FOREIGN KEY ("catalogStagingItemId") REFERENCES "CatalogStagingItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
