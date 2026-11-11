-- Private receipt photos. Additive. Apply only with the deployment handshake.
CREATE TABLE "ReceiptEvidenceFile" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "sha256" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "bytes" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ReceiptEvidenceFile_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ReceiptEvidenceFile_tenantId_createdAt_idx" ON "ReceiptEvidenceFile"("tenantId", "createdAt");
