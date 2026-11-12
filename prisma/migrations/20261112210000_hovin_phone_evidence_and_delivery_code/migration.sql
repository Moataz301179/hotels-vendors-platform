-- HOVIN phone evidence and delivery-match codes.
-- Additive only. Do not apply to production without Moataz's explicit approval
-- and a verified Neon backup. This file ships on the branch; it is not a deploy.
CREATE TABLE "ReceiptEvidenceFile" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "sha256" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "bytes" BYTEA NOT NULL,
  "exifStripped" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ReceiptEvidenceFile_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ReceiptEvidenceFile_tenantId_createdAt_idx" ON "ReceiptEvidenceFile"("tenantId", "createdAt");

CREATE TABLE "DeliveryConfirmationCode" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "hotelTenantId" TEXT NOT NULL,
  "carrierTenantId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmedAt" TIMESTAMP(3),
  "confirmedByUserId" TEXT,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "DeliveryConfirmationCode_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DeliveryConfirmationCode_orderId_key" ON "DeliveryConfirmationCode"("orderId");
CREATE INDEX "DeliveryConfirmationCode_hotelTenantId_idx" ON "DeliveryConfirmationCode"("hotelTenantId");
CREATE INDEX "DeliveryConfirmationCode_carrierTenantId_idx" ON "DeliveryConfirmationCode"("carrierTenantId");
