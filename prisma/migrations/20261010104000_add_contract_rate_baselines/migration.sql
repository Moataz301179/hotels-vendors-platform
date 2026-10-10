-- Local development artifact only. Do not apply until the release migration plan is approved.
ALTER TYPE "EntityName" ADD VALUE IF NOT EXISTS 'CONTRACT_RATE_BASELINE';
CREATE TABLE "ContractRateBaseline" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "hotelId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "unitPrice" DECIMAL(12,2) NOT NULL,
  "rateQuantity" INTEGER NOT NULL,
  "deliveryFee" DECIMAL(12,2),
  "taxAmount" DECIMAL(12,2),
  "currency" TEXT NOT NULL DEFAULT 'EGP',
  "sourceReference" TEXT NOT NULL,
  "validFrom" TIMESTAMP(3) NOT NULL,
  "validUntil" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ContractRateBaseline_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ContractRateBaseline_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ContractRateBaseline_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ContractRateBaseline_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ContractRateBaseline_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "ContractRateBaseline_tenantId_hotelId_productId_idx" ON "ContractRateBaseline"("tenantId", "hotelId", "productId");
CREATE INDEX "ContractRateBaseline_tenantId_supplierId_idx" ON "ContractRateBaseline"("tenantId", "supplierId");
CREATE INDEX "ContractRateBaseline_deletedAt_idx" ON "ContractRateBaseline"("deletedAt");
