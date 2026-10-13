-- Additive carrier ownership migration. Reviewed locally; do not apply without deployment handshake.
-- Register only. Grant explicitly to a reviewed tenant driver role; no automatic role expansion.
INSERT INTO "Permission" ("id", "code", "name", "description", "createdAt") VALUES ('shipping-capture-proof-v1', 'shipping:capture_proof', 'Capture Delivery Proof', 'Record private proof for authenticated assigned delivery stops', CURRENT_TIMESTAMP) ON CONFLICT ("code") DO NOTHING;
CREATE UNIQUE INDEX "User_id_tenantId_key" ON "User"("id", "tenantId");
ALTER TABLE "Trip" ADD COLUMN "assignedDriverId" TEXT;
CREATE INDEX "Trip_tenantId_assignedDriverId_scheduledDate_idx" ON "Trip"("tenantId", "assignedDriverId", "scheduledDate");
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_assignedDriverId_tenantId_fkey" FOREIGN KEY ("assignedDriverId", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "TripStop_id_tenantId_key" ON "TripStop"("id", "tenantId");
CREATE TABLE "DeliveryProof" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "stopId" TEXT NOT NULL,
  "uploadedById" TEXT NOT NULL, "idempotencyKey" TEXT NOT NULL,
  "content" BYTEA NOT NULL, "mimeType" TEXT NOT NULL, "sha256" TEXT NOT NULL,
  "receivedBy" TEXT NOT NULL, "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeliveryProof_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DeliveryProof_tenantId_uploadedById_idempotencyKey_key" ON "DeliveryProof"("tenantId", "uploadedById", "idempotencyKey");
CREATE UNIQUE INDEX "DeliveryProof_tenantId_stopId_key" ON "DeliveryProof"("tenantId", "stopId");
ALTER TABLE "DeliveryProof" ADD CONSTRAINT "DeliveryProof_stopId_tenantId_fkey" FOREIGN KEY ("stopId", "tenantId") REFERENCES "TripStop"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DeliveryProof" ADD CONSTRAINT "DeliveryProof_uploadedById_tenantId_fkey" FOREIGN KEY ("uploadedById", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
