CREATE TABLE "ReconciliationUpload" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "checksum" TEXT NOT NULL,
  "sourceReference" TEXT,
  "orderId" TEXT,
  "shipmentId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'UPLOADED',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ReconciliationUpload_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ReconciliationJob" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "uploadId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "provider" TEXT,
  "attempt" INTEGER NOT NULL DEFAULT 0,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReconciliationJob_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ExtractedLineItem" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "uploadId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "sku" TEXT,
  "quantity" DECIMAL(12,3),
  "unitPrice" DECIMAL(12,2),
  "confidence" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExtractedLineItem_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ReconciliationMatch" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "uploadId" TEXT NOT NULL,
  "lineItemId" TEXT,
  "poItemId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  "reviewerId" TEXT,
  "reviewNote" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReconciliationMatch_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LedgerMappingSuggestion" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceKey" TEXT NOT NULL,
  "sourceLabel" TEXT NOT NULL,
  "usaliCode" TEXT NOT NULL,
  "usaliLabel" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "rationale" TEXT,
  "status" TEXT NOT NULL DEFAULT 'SUGGESTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LedgerMappingSuggestion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LedgerMappingOverride" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "suggestionId" TEXT NOT NULL,
  "usaliCode" TEXT NOT NULL,
  "usaliLabel" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LedgerMappingOverride_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LedgerMappingSuggestion_tenantId_sourceType_sourceKey_key" ON "LedgerMappingSuggestion"("tenantId", "sourceType", "sourceKey");
CREATE INDEX "ReconciliationUpload_tenantId_status_idx" ON "ReconciliationUpload"("tenantId", "status");
CREATE INDEX "ReconciliationUpload_checksum_idx" ON "ReconciliationUpload"("checksum");
CREATE INDEX "ReconciliationJob_tenantId_status_idx" ON "ReconciliationJob"("tenantId", "status");
CREATE INDEX "ExtractedLineItem_tenantId_uploadId_idx" ON "ExtractedLineItem"("tenantId", "uploadId");
CREATE INDEX "ReconciliationMatch_tenantId_status_idx" ON "ReconciliationMatch"("tenantId", "status");
CREATE INDEX "LedgerMappingSuggestion_tenantId_status_idx" ON "LedgerMappingSuggestion"("tenantId", "status");
CREATE INDEX "LedgerMappingOverride_tenantId_suggestionId_idx" ON "LedgerMappingOverride"("tenantId", "suggestionId");
ALTER TABLE "ReconciliationUpload" ADD CONSTRAINT "ReconciliationUpload_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReconciliationJob" ADD CONSTRAINT "ReconciliationJob_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "ReconciliationUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExtractedLineItem" ADD CONSTRAINT "ExtractedLineItem_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "ReconciliationUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReconciliationMatch" ADD CONSTRAINT "ReconciliationMatch_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "ReconciliationUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LedgerMappingSuggestion" ADD CONSTRAINT "LedgerMappingSuggestion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LedgerMappingOverride" ADD CONSTRAINT "LedgerMappingOverride_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LedgerMappingOverride" ADD CONSTRAINT "LedgerMappingOverride_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "LedgerMappingSuggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
