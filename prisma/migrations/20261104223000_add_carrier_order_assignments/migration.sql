CREATE TABLE "CarrierOrderAssignment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "carrierProfileId" TEXT NOT NULL,
  "hotelTenantId" TEXT NOT NULL,
  "carrierTenantId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
  "assignedById" TEXT NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "respondedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "deliveryEvidence" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "CarrierOrderAssignment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Shipment" ADD COLUMN "assignmentId" TEXT;
ALTER TABLE "GoodsReceiptNote" ADD COLUMN "shipmentId" TEXT;

CREATE UNIQUE INDEX "CarrierOrderAssignment_orderId_key" ON "CarrierOrderAssignment"("orderId");
CREATE INDEX "CarrierOrderAssignment_carrierTenantId_status_idx" ON "CarrierOrderAssignment"("carrierTenantId", "status");
CREATE INDEX "CarrierOrderAssignment_hotelTenantId_status_idx" ON "CarrierOrderAssignment"("hotelTenantId", "status");
CREATE INDEX "CarrierOrderAssignment_carrierProfileId_idx" ON "CarrierOrderAssignment"("carrierProfileId");
CREATE INDEX "CarrierOrderAssignment_deletedAt_idx" ON "CarrierOrderAssignment"("deletedAt");
CREATE UNIQUE INDEX "Shipment_assignmentId_key" ON "Shipment"("assignmentId");
CREATE INDEX "GoodsReceiptNote_shipmentId_idx" ON "GoodsReceiptNote"("shipmentId");

ALTER TABLE "CarrierOrderAssignment" ADD CONSTRAINT "CarrierOrderAssignment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CarrierOrderAssignment" ADD CONSTRAINT "CarrierOrderAssignment_carrierProfileId_fkey" FOREIGN KEY ("carrierProfileId") REFERENCES "CarrierProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "CarrierOrderAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GoodsReceiptNote" ADD CONSTRAINT "GoodsReceiptNote_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
