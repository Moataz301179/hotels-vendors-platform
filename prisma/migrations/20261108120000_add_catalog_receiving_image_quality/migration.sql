-- Image quality is an independent publication concern, not a product acceptance barrier.
ALTER TABLE "CatalogReceivingRecord"
  ADD COLUMN IF NOT EXISTS "approvedImageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "imageQualityOutput" JSONB;
