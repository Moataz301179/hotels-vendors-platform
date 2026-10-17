-- Supplier-neutral directory foundation. All objects are additive; existing
-- supplier listings, RFQs, quotes, orders, and evidence records are untouched.
CREATE TABLE "DirectorySource" (
  "id" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "permissionStatus" TEXT NOT NULL DEFAULT 'PERMISSION_UNKNOWN',
  "permissionNote" TEXT,
  "observedAt" TIMESTAMP(3) NOT NULL,
  "lastAttemptAt" TIMESTAMP(3),
  "lastSuccessAt" TIMESTAMP(3),
  "refreshStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "DirectorySource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DirectoryCandidate" (
  "id" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "sourceRecordKey" TEXT,
  "sourceFingerprint" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "searchText" TEXT NOT NULL,
  "itemType" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "nameAr" TEXT,
  "category" TEXT NOT NULL,
  "subcategory" TEXT,
  "description" TEXT,
  "attributes" JSONB NOT NULL,
  "unitOfMeasure" TEXT,
  "purchaseUnit" TEXT,
  "images" JSONB NOT NULL,
  "searchTerms" JSONB NOT NULL,
  "sourceSnapshot" JSONB NOT NULL,
  "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  "duplicateOfId" TEXT,
  "reviewNote" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "DirectoryCandidate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DirectoryProfile" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "itemType" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "nameAr" TEXT,
  "category" TEXT NOT NULL,
  "subcategory" TEXT,
  "description" TEXT,
  "attributes" JSONB NOT NULL,
  "unitOfMeasure" TEXT,
  "purchaseUnit" TEXT,
  "images" JSONB NOT NULL,
  "searchTerms" JSONB NOT NULL,
  "searchText" TEXT NOT NULL,
  "publicationStatus" TEXT NOT NULL DEFAULT 'PUBLISHED',
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "DirectoryProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DirectorySource_sourceUrl_key" ON "DirectorySource"("sourceUrl");
CREATE UNIQUE INDEX "DirectoryCandidate_sourceFingerprint_key" ON "DirectoryCandidate"("sourceFingerprint");
CREATE UNIQUE INDEX "DirectoryProfile_candidateId_key" ON "DirectoryProfile"("candidateId");
CREATE INDEX "DirectorySource_refreshStatus_idx" ON "DirectorySource"("refreshStatus");
CREATE INDEX "DirectorySource_deletedAt_idx" ON "DirectorySource"("deletedAt");
CREATE INDEX "DirectoryCandidate_sourceId_idx" ON "DirectoryCandidate"("sourceId");
CREATE INDEX "DirectoryCandidate_reviewStatus_idx" ON "DirectoryCandidate"("reviewStatus");
CREATE INDEX "DirectoryCandidate_normalizedName_category_idx" ON "DirectoryCandidate"("normalizedName", "category");
CREATE INDEX "DirectoryCandidate_searchText_idx" ON "DirectoryCandidate"("searchText");
CREATE INDEX "DirectoryCandidate_duplicateOfId_idx" ON "DirectoryCandidate"("duplicateOfId");
CREATE INDEX "DirectoryCandidate_deletedAt_idx" ON "DirectoryCandidate"("deletedAt");
CREATE INDEX "DirectoryProfile_publicationStatus_idx" ON "DirectoryProfile"("publicationStatus");
CREATE INDEX "DirectoryProfile_itemType_category_idx" ON "DirectoryProfile"("itemType", "category");
CREATE INDEX "DirectoryProfile_name_idx" ON "DirectoryProfile"("name");
CREATE INDEX "DirectoryProfile_searchText_idx" ON "DirectoryProfile"("searchText");
CREATE INDEX "DirectoryProfile_deletedAt_idx" ON "DirectoryProfile"("deletedAt");

ALTER TABLE "DirectoryCandidate" ADD CONSTRAINT "DirectoryCandidate_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DirectorySource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DirectoryProfile" ADD CONSTRAINT "DirectoryProfile_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "DirectoryCandidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TYPE "EntityName" ADD VALUE IF NOT EXISTS 'DIRECTORY_SOURCE';
ALTER TYPE "EntityName" ADD VALUE IF NOT EXISTS 'DIRECTORY_CANDIDATE';
ALTER TYPE "EntityName" ADD VALUE IF NOT EXISTS 'DIRECTORY_PROFILE';
