-- CreateTable
CREATE TABLE "InvoPartner" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'unknown',
    "taxId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "contactName" TEXT,
    "address" TEXT,
    "categories" TEXT[],
    "documents" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewerNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoPartner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvoPartner_partnerId_key" ON "InvoPartner"("partnerId");

-- CreateIndex
CREATE INDEX "InvoPartner_tenantId_idx" ON "InvoPartner"("tenantId");

-- CreateIndex
CREATE INDEX "InvoPartner_name_idx" ON "InvoPartner"("name");

-- CreateIndex
CREATE INDEX "InvoPartner_type_idx" ON "InvoPartner"("type");

-- AddForeignKey
ALTER TABLE "InvoPartner" ADD CONSTRAINT "InvoPartner_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
