-- Do not apply this migration until the production backup/clone and migration
-- approval gate are complete. It enables sealed multi-vendor RFQ responses;
-- it does not expose vendor identities to buyers.

ALTER TABLE "RfqRequest" ADD COLUMN IF NOT EXISTS "responseDeadline" TIMESTAMP(3);
ALTER TABLE "RfqRequest" ADD COLUMN IF NOT EXISTS "procurementMethod" TEXT NOT NULL DEFAULT 'SEALED_RFQ';
ALTER TABLE "RfqRequest" ADD COLUMN IF NOT EXISTS "exceptionReason" TEXT;

ALTER TABLE "RfqSupplierAccess" ADD COLUMN IF NOT EXISTS "productId" TEXT;
ALTER TABLE "RfqSupplierAccess" ADD COLUMN IF NOT EXISTS "respondedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "RfqSupplierAccess_rfqId_respondedAt_idx"
  ON "RfqSupplierAccess"("rfqId", "respondedAt");

ALTER TABLE "ProcurementQuote" ADD COLUMN IF NOT EXISTS "productId" TEXT;
