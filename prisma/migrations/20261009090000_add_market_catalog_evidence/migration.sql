-- Public market-catalogue evidence layer.
-- Additive only: no Product or Supplier rows are created by this migration.
DO $$ BEGIN
  CREATE TYPE "CatalogItemStatus" AS ENUM ('PENDING_REVIEW', 'ACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CatalogSourceType" AS ENUM ('SUPPLIER_SITE', 'MARKETPLACE', 'BUSINESS_DIRECTORY', 'HOTEL_UPLOAD', 'PARTNER_FEED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE "CatalogItem" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "canonicalKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "brand" TEXT,
  "category" TEXT NOT NULL,
  "subcategory" TEXT,
  "unitOfMeasure" TEXT,
  "description" TEXT,
  "status" "CatalogItemStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "imageUrl" TEXT,
  "imageSourceUrl" TEXT,
  "imageRightsStatus" TEXT,
  "firstObservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastObservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "uuid" UUID DEFAULT gen_random_uuid(),
  CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CatalogSource" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sourceType" "CatalogSourceType" NOT NULL,
  "baseUrl" TEXT NOT NULL,
  "accessPolicy" TEXT NOT NULL DEFAULT 'PUBLIC_REFERENCE',
  "lastCheckedAt" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatalogSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CatalogEvidence" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "catalogItemId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "externalKey" TEXT,
  "sourceUrl" TEXT NOT NULL,
  "sourceHash" TEXT NOT NULL,
  "observedName" TEXT NOT NULL,
  "observedBrand" TEXT,
  "observedPrice" DECIMAL(12,2),
  "currency" TEXT,
  "imageUrl" TEXT,
  "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confidence" INTEGER NOT NULL DEFAULT 0,
  "provenance" "EvidenceClass" NOT NULL DEFAULT 'OBSERVED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CatalogEvidence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CatalogItem_uuid_key" ON "CatalogItem"("uuid");
CREATE UNIQUE INDEX "CatalogItem_tenantId_canonicalKey_key" ON "CatalogItem"("tenantId", "canonicalKey");
CREATE INDEX "CatalogItem_tenantId_category_idx" ON "CatalogItem"("tenantId", "category");
CREATE INDEX "CatalogItem_tenantId_brand_idx" ON "CatalogItem"("tenantId", "brand");
CREATE INDEX "CatalogItem_tenantId_status_idx" ON "CatalogItem"("tenantId", "status");
CREATE UNIQUE INDEX "CatalogSource_tenantId_baseUrl_key" ON "CatalogSource"("tenantId", "baseUrl");
CREATE INDEX "CatalogSource_tenantId_sourceType_idx" ON "CatalogSource"("tenantId", "sourceType");
CREATE UNIQUE INDEX "CatalogEvidence_tenantId_sourceHash_key" ON "CatalogEvidence"("tenantId", "sourceHash");
CREATE INDEX "CatalogEvidence_tenantId_catalogItemId_idx" ON "CatalogEvidence"("tenantId", "catalogItemId");
CREATE INDEX "CatalogEvidence_tenantId_observedAt_idx" ON "CatalogEvidence"("tenantId", "observedAt");

ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogSource" ADD CONSTRAINT "CatalogSource_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogEvidence" ADD CONSTRAINT "CatalogEvidence_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogEvidence" ADD CONSTRAINT "CatalogEvidence_catalogItemId_fkey"
  FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogEvidence" ADD CONSTRAINT "CatalogEvidence_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "CatalogSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
