ALTER TABLE "GoodsReceiptNote" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "GoodsReceiptNote_tenantId_idempotencyKey_key"
ON "GoodsReceiptNote"("tenantId", "idempotencyKey");
