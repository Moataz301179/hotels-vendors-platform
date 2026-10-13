DO $$ BEGIN
  CREATE TYPE "QuoteStatus" AS ENUM ('SUBMITTED','ACCEPTED','REJECTED','EXPIRED','WITHDRAWN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ProcurementQuote" (
  "id" TEXT NOT NULL,
  "rfqId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "unitPrice" DECIMAL(12,2) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EGP',
  "leadTimeDays" INTEGER,
  "deliveryFee" DECIMAL(12,2),
  "validUntil" TIMESTAMP,
  "notes" TEXT,
  "status" "QuoteStatus" NOT NULL DEFAULT 'SUBMITTED',
  "submittedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uuid" UUID DEFAULT gen_random_uuid(),
  "deletedAt" TIMESTAMP,
  CONSTRAINT "ProcurementQuote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProcurementQuote_uuid_key" ON "ProcurementQuote"("uuid") WHERE "uuid" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "ProcurementQuote_tenant_rfq_idx" ON "ProcurementQuote"("tenantId","rfqId");
CREATE INDEX IF NOT EXISTS "ProcurementQuote_supplier_status_idx" ON "ProcurementQuote"("supplierId","status");
CREATE INDEX IF NOT EXISTS "ProcurementQuote_buyer_status_idx" ON "ProcurementQuote"("buyerId","status");

DO $$ BEGIN
  ALTER TABLE "ProcurementQuote" ADD CONSTRAINT "ProcurementQuote_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RfqRequest"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProcurementQuote" ADD CONSTRAINT "ProcurementQuote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProcurementQuote" ADD CONSTRAINT "ProcurementQuote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProcurementQuote" ADD CONSTRAINT "ProcurementQuote_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
