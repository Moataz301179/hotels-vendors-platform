ALTER TABLE "Order" ADD COLUMN "carrierId" TEXT;
ALTER TABLE "Order" ADD COLUMN "trackingNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN "estimatedDeliveryAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "actualDeliveryAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "deliveryStatus" TEXT NOT NULL DEFAULT 'PLANNED';
ALTER TABLE "Order" ADD COLUMN "podUrl" TEXT;
CREATE INDEX "Order_trackingNumber_idx" ON "Order"("trackingNumber");
CREATE INDEX "Order_deliveryStatus_idx" ON "Order"("deliveryStatus");
CREATE TABLE "DriverMagicLink" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "shipmentId" TEXT,
  "orderId" TEXT,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" TEXT NOT NULL,
  CONSTRAINT "DriverMagicLink_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DriverMagicLink_tokenHash_key" ON "DriverMagicLink"("tokenHash");
CREATE INDEX "DriverMagicLink_tenantId_expiresAt_idx" ON "DriverMagicLink"("tenantId", "expiresAt");
CREATE INDEX "DriverMagicLink_shipmentId_idx" ON "DriverMagicLink"("shipmentId");
CREATE INDEX "DriverMagicLink_orderId_idx" ON "DriverMagicLink"("orderId");
ALTER TABLE "DriverMagicLink" ADD CONSTRAINT "DriverMagicLink_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
