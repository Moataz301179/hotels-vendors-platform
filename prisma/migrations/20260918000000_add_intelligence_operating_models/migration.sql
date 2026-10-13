-- CreateTable
CREATE TABLE "evidence_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sourceId" TEXT,
    "sourceType" TEXT,
    "provenance" TEXT NOT NULL DEFAULT 'OBSERVED',
    "contentType" TEXT,
    "contentHash" TEXT,
    "beforeState" JSONB,
    "afterState" JSONB,
    "actorId" TEXT,
    "reviewStatus" TEXT NOT NULL DEFAULT 'review-required',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidence_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intelligence_updates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "entityId" TEXT,
    "entityType" TEXT,
    "beforeValue" JSONB,
    "afterValue" JSONB,
    "detectionEngine" TEXT,
    "confidenceScore" DOUBLE PRECISION DEFAULT 0.0,
    "provenance" TEXT NOT NULL DEFAULT 'INFERRED',
    "reviewStatus" TEXT NOT NULL DEFAULT 'review-required',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intelligence_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "need_findings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'medium',
    "evidence_record_id" TEXT,
    "impactEstimate" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DETECTED',
    "actorId" TEXT,
    "reviewStatus" TEXT NOT NULL DEFAULT 'review-required',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "need_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_packages" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "evidenceIds" TEXT[],
    "recommendation" TEXT NOT NULL,
    "expectedValue" DOUBLE PRECISION,
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "approvalChain" TEXT,
    "actorId" TEXT,
    "provenance" TEXT NOT NULL DEFAULT 'INFERRED',
    "reviewStatus" TEXT NOT NULL DEFAULT 'review-required',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_insights" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sourceEntityType" TEXT NOT NULL,
    "sourceEntityId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "targetEntityType" TEXT NOT NULL,
    "targetEntityId" TEXT NOT NULL,
    "strengthScore" DOUBLE PRECISION DEFAULT 0.0,
    "provenance" TEXT NOT NULL DEFAULT 'INFERRED',
    "reviewStatus" TEXT NOT NULL DEFAULT 'review-required',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "network_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "evidence_records_tenantId_provenance_idx" ON "evidence_records"("tenantId", "provenance");

-- CreateIndex
CREATE INDEX "evidence_records_tenantId_reviewStatus_idx" ON "evidence_records"("tenantId", "reviewStatus");

-- CreateIndex
CREATE INDEX "intelligence_updates_tenantId_kind_idx" ON "intelligence_updates"("tenantId", "kind");

-- CreateIndex
CREATE INDEX "need_findings_tenantId_category_status_idx" ON "need_findings"("tenantId", "category", "status");

-- CreateIndex
CREATE INDEX "opportunity_packages_tenantId_status_idx" ON "opportunity_packages"("tenantId", "status");

-- CreateIndex
CREATE INDEX "network_insights_tenantId_sourceEntityType_relationshipType_idx" ON "network_insights"("tenantId", "sourceEntityType", "relationshipType");

