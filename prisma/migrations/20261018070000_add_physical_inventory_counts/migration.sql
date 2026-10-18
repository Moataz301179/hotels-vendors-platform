-- Camera-assisted observations never mutate stock on capture.
CREATE TYPE "PhysicalCountStatus" AS ENUM ('PENDING_REVIEW', 'ACCEPTED', 'REJECTED');

CREATE TABLE "PhysicalInventoryCount" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "hotelId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "countedById" TEXT NOT NULL,
  "clientSubmissionId" TEXT NOT NULL,
  "observedQuantity" INTEGER NOT NULL,
  "barcode" TEXT,
  "capturedAt" TIMESTAMP(3) NOT NULL,
  "status" "PhysicalCountStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PhysicalInventoryCount_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PhysicalInventoryCount_tenantId_clientSubmissionId_key" ON "PhysicalInventoryCount"("tenantId", "clientSubmissionId");
CREATE INDEX "PhysicalInventoryCount_tenantId_productId_createdAt_idx" ON "PhysicalInventoryCount"("tenantId", "productId", "createdAt");
CREATE INDEX "PhysicalInventoryCount_hotelId_status_createdAt_idx" ON "PhysicalInventoryCount"("hotelId", "status", "createdAt");
CREATE INDEX "PhysicalInventoryCount_deletedAt_idx" ON "PhysicalInventoryCount"("deletedAt");
ALTER TABLE "PhysicalInventoryCount" ADD CONSTRAINT "PhysicalInventoryCount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PhysicalInventoryCount" ADD CONSTRAINT "PhysicalInventoryCount_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PhysicalInventoryCount" ADD CONSTRAINT "PhysicalInventoryCount_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
