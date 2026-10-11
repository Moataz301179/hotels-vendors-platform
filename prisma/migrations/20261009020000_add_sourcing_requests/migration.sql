CREATE TABLE "SourcingRequest" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "specification" TEXT,
  "quantity" INTEGER NOT NULL,
  "deliveryLocation" TEXT NOT NULL,
  "requiredDate" TIMESTAMP(3),
  "attachmentRef" TEXT,
  "category" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "SourcingRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SourcingRequest_tenantId_status_idx" ON "SourcingRequest"("tenantId", "status");
CREATE INDEX "SourcingRequest_requesterId_idx" ON "SourcingRequest"("requesterId");
ALTER TABLE "SourcingRequest" ADD CONSTRAINT "SourcingRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
