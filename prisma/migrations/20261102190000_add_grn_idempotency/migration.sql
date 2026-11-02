-- Additive, nullable GRN request idempotency fields.
-- Existing receipts remain unchanged; only requests carrying an Idempotency-Key
-- are deduplicated by the application.
ALTER TABLE "GoodsReceiptNote"
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "idempotencyRequestHash" TEXT,
  ADD COLUMN "idempotencyOrderStatus" TEXT;

CREATE UNIQUE INDEX "GoodsReceiptNote_tenant_order_idempotency_key"
  ON "GoodsReceiptNote" ("tenantId", "orderId", "idempotencyKey");
