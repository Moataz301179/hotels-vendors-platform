ALTER TABLE "FactoringRequest" ADD COLUMN "referralIdempotencyKey" TEXT;

CREATE UNIQUE INDEX "FactoringRequest_tenantId_referralIdempotencyKey_key"
ON "FactoringRequest"("tenantId", "referralIdempotencyKey");
