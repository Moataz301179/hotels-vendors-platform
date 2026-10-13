-- RFQ requests can begin from a public market reference or a free-text
-- requirement. A supplier is matched internally and must not be required at
-- request creation time.
DO $$
BEGIN
  IF to_regclass('public."RfqRequest"') IS NULL THEN
    RAISE EXCEPTION 'RfqRequest table is missing; reconcile the base procurement schema before applying this migration';
  END IF;
END $$;

ALTER TABLE "RfqRequest" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "RfqRequest" ALTER COLUMN "supplierId" DROP NOT NULL;
ALTER TABLE "RfqRequest" ADD COLUMN IF NOT EXISTS "catalogItemId" TEXT;
ALTER TABLE "RfqRequest" ADD COLUMN IF NOT EXISTS "itemName" TEXT;
ALTER TABLE "RfqRequest" ADD COLUMN IF NOT EXISTS "unitOfMeasure" TEXT;
ALTER TABLE "RfqRequest" ADD COLUMN IF NOT EXISTS "deliveryLocation" TEXT;
ALTER TABLE "RfqRequest" ADD COLUMN IF NOT EXISTS "matchingStatus" TEXT NOT NULL DEFAULT 'QUEUED';

CREATE INDEX IF NOT EXISTS "RfqRequest_tenant_catalogItem_idx"
  ON "RfqRequest"("tenantId", "catalogItemId");
CREATE INDEX IF NOT EXISTS "RfqRequest_tenant_buyer_status_idx"
  ON "RfqRequest"("tenantId", "buyerId", "status");
