-- Runtime tables reconciled on 2026-10-02. Intentionally idempotent:
-- legacy intelligence tables are preserved; this migration only creates the
-- current Prisma runtime tables required by the production application.

CREATE TABLE IF NOT EXISTS "Opportunity" (
  "id" TEXT PRIMARY KEY, "tenantId" TEXT NOT NULL,
  "type" "OpportunityType" NOT NULL, "status" "OpportunityStatus" NOT NULL DEFAULT 'DETECTED',
  "title" TEXT NOT NULL, "description" TEXT, "evidence" JSONB,
  "baseline" DECIMAL(14,2), "currentValue" DECIMAL(14,2), "potentialImpact" DECIMAL(14,2),
  "confidence" DOUBLE PRECISION, "recommendedAction" TEXT, "affectedSupplierId" TEXT,
  "affectedProductId" TEXT, "affectedCategory" TEXT, "ownerId" TEXT,
  "resultingTransactionId" TEXT, "realizedResult" JSONB, "verificationState" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uuid" UUID DEFAULT gen_random_uuid(), "deletedAt" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SavingsLedger" (
  "id" TEXT PRIMARY KEY, "tenantId" TEXT NOT NULL, "opportunityId" TEXT,
  "type" "SavingsType" NOT NULL, "status" "SavingsStatus" NOT NULL DEFAULT 'POTENTIAL',
  "baseline" DECIMAL(14,2), "potentialSaving" DECIMAL(14,2), "expectedSaving" DECIMAL(14,2),
  "negotiatedAmount" DECIMAL(14,2), "realizedAmount" DECIMAL(14,2), "verifiedAmount" DECIMAL(14,2),
  "evidence" JSONB, "transactionId" TEXT, "supplierId" TEXT, "category" TEXT, "productId" TEXT,
  "ownerId" TEXT, "verifiedById" TEXT, "verifiedAt" TIMESTAMP, "disputeReason" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uuid" UUID DEFAULT gen_random_uuid(), "deletedAt" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "EvidenceRecord" (
  "id" TEXT PRIMARY KEY, "tenantId" TEXT NOT NULL, "sourceUrl" TEXT, "sourceReference" TEXT,
  "rawEvidenceHash" TEXT, "extractedFact" TEXT, "entityId" TEXT, "entityName" TEXT,
  "entityUuid" TEXT UNIQUE, "provenanceClass" "EvidenceClass" NOT NULL DEFAULT 'OBSERVED',
  "confidenceScore" DOUBLE PRECISION, "retrievalTimestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "auditLogId" TEXT, "status" "EvidenceStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uuid" UUID DEFAULT gen_random_uuid(), "deletedAt" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "IntelligenceEdge" (
  "id" TEXT PRIMARY KEY, "tenantId" TEXT NOT NULL, "entityId" TEXT NOT NULL,
  "relatedEntityId" TEXT NOT NULL, "relationshipType" TEXT NOT NULL, "validFrom" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validTo" TIMESTAMP, "confidence" DOUBLE PRECISION, "auditLogId" TEXT,
  "provenanceClass" "EvidenceClass" NOT NULL DEFAULT 'OBSERVED', "entityUuid" UUID DEFAULT gen_random_uuid(),
  "status" TEXT DEFAULT 'ACTIVE', "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "deletedAt" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SpendUploadRecord" (
  "id" TEXT PRIMARY KEY, "tenantId" TEXT NOT NULL, "sourceType" "SpendSourceType" NOT NULL,
  "rawData" JSONB NOT NULL, "normalizedDate" TIMESTAMP, "supplierId" TEXT,
  "supplierName" TEXT NOT NULL DEFAULT 'Unknown', "productId" TEXT, "productName" TEXT, "sku" TEXT,
  "category" TEXT, "quantity" INTEGER, "unitPrice" DECIMAL(12,2), "totalAmount" DECIMAL(12,2),
  "poNumber" TEXT, "invoiceNumber" TEXT, "resolutionStatus" "SpendResolutionStatus" NOT NULL DEFAULT 'UNRESOLVED',
  "resolutionNotes" TEXT, "opportunityId" TEXT, "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "uuid" UUID DEFAULT gen_random_uuid(), "deletedAt" TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Opportunity_uuid_key" ON "Opportunity"("uuid") WHERE "uuid" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "SavingsLedger_uuid_key" ON "SavingsLedger"("uuid") WHERE "uuid" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "IntelligenceEdge_entityUuid_key" ON "IntelligenceEdge"("entityUuid") WHERE "entityUuid" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "SpendUploadRecord_uuid_key" ON "SpendUploadRecord"("uuid") WHERE "uuid" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Opportunity_tenant_idx" ON "Opportunity"("tenantId");
CREATE INDEX IF NOT EXISTS "Opportunity_type_idx" ON "Opportunity"("type");
CREATE INDEX IF NOT EXISTS "Opportunity_status_idx" ON "Opportunity"("status");
CREATE INDEX IF NOT EXISTS "SavingsLedger_tenant_idx" ON "SavingsLedger"("tenantId");
CREATE INDEX IF NOT EXISTS "SavingsLedger_opportunity_idx" ON "SavingsLedger"("opportunityId");
CREATE INDEX IF NOT EXISTS "EvidenceRecord_tenant_idx" ON "EvidenceRecord"("tenantId");
CREATE INDEX IF NOT EXISTS "EvidenceRecord_status_idx" ON "EvidenceRecord"("status");
CREATE INDEX IF NOT EXISTS "IntelligenceEdge_tenant_idx" ON "IntelligenceEdge"("tenantId");
CREATE INDEX IF NOT EXISTS "SpendUploadRecord_tenant_idx" ON "SpendUploadRecord"("tenantId");

DO $$ BEGIN ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_tenant_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_supplier_fkey" FOREIGN KEY ("affectedSupplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_product_fkey" FOREIGN KEY ("affectedProductId") REFERENCES "Product"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_owner_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SavingsLedger" ADD CONSTRAINT "SavingsLedger_tenant_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SavingsLedger" ADD CONSTRAINT "SavingsLedger_opportunity_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SavingsLedger" ADD CONSTRAINT "SavingsLedger_supplier_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SavingsLedger" ADD CONSTRAINT "SavingsLedger_product_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SavingsLedger" ADD CONSTRAINT "SavingsLedger_owner_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SavingsLedger" ADD CONSTRAINT "SavingsLedger_verified_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "EvidenceRecord" ADD CONSTRAINT "EvidenceRecord_tenant_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "EvidenceRecord" ADD CONSTRAINT "EvidenceRecord_audit_fkey" FOREIGN KEY ("auditLogId") REFERENCES "AuditLog"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "IntelligenceEdge" ADD CONSTRAINT "IntelligenceEdge_tenant_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "IntelligenceEdge" ADD CONSTRAINT "IntelligenceEdge_audit_fkey" FOREIGN KEY ("auditLogId") REFERENCES "AuditLog"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SpendUploadRecord" ADD CONSTRAINT "SpendUploadRecord_tenant_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SpendUploadRecord" ADD CONSTRAINT "SpendUploadRecord_supplier_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SpendUploadRecord" ADD CONSTRAINT "SpendUploadRecord_product_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
