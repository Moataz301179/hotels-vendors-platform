-- A receiver records observed quantities; a hotel approver separately accepts
-- any difference before external-funder packet review. This is additive and is
-- intentionally not applied by local development commands.
ALTER TABLE "GoodsReceiptNote"
  ADD COLUMN IF NOT EXISTS "quantityVarianceAcceptedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "quantityVarianceAcceptedById" TEXT;
