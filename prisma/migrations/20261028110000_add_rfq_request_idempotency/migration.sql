ALTER TABLE "RfqRequest" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "RfqRequest_tenantId_buyerId_idempotencyKey_key"
  ON "RfqRequest"("tenantId", "buyerId", "idempotencyKey");
