-- Explicit, tenant-bound supplier access for cross-tenant RFQ responses.
CREATE TABLE "RfqSupplierAccess" (
  "id" TEXT NOT NULL,
  "rfqId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "hotelTenantId" TEXT NOT NULL,
  "supplierTenantId" TEXT NOT NULL,
  "grantedById" TEXT,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RfqSupplierAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RfqSupplierAccess_rfqId_supplierId_supplierTenantId_key"
  ON "RfqSupplierAccess"("rfqId", "supplierId", "supplierTenantId");
CREATE INDEX "RfqSupplierAccess_supplierTenantId_supplierId_revokedAt_idx"
  ON "RfqSupplierAccess"("supplierTenantId", "supplierId", "revokedAt");
CREATE INDEX "RfqSupplierAccess_hotelTenantId_rfqId_idx"
  ON "RfqSupplierAccess"("hotelTenantId", "rfqId");

-- Backfill only RFQs that can be bound to the assigned supplier's tenant.
-- Every subsequent supplier-side RFQ lookup must first resolve this grant.
INSERT INTO "RfqSupplierAccess" ("id", "rfqId", "supplierId", "hotelTenantId", "supplierTenantId", "createdAt", "updatedAt")
SELECT concat('rfq_access_', r."id"), r."id", r."supplierId", r."tenantId", s."tenantId", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "RfqRequest" r
JOIN "Supplier" s ON s."id" = r."supplierId" AND s."deletedAt" IS NULL
WHERE r."deletedAt" IS NULL
ON CONFLICT ("rfqId", "supplierId", "supplierTenantId") DO NOTHING;
