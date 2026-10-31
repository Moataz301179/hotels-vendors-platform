-- B47/B48: Hotel e-invoice ingestion and supplier price comparison models

CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIAL');
CREATE TYPE "IngestionStatus" AS ENUM ('PENDING', 'MATCHED', 'UNMATCHED', 'REVIEWED', 'REJECTED');
CREATE TYPE "ComparisonStatus" AS ENUM ('OBSERVED', 'CALCULATED', 'VERIFIED', 'DISPUTED', 'ARCHIVED');
CREATE TYPE "ConnectorStatus" AS ENUM ('ACTIVE', 'PAUSED', 'FAILED', 'PENDING');
CREATE TYPE "SupplierConsentStatus" AS ENUM ('NOT_REQUESTED', 'REQUESTED', 'GRANTED', 'REJECTED', 'EXPIRED', 'REVOKED');
CREATE TYPE "ConsentLegalBasis" AS ENUM ('EXPLICIT_CONSENT', 'CONTRACT', 'LEGITIMATE_INTEREST', 'LEGAL_OBLIGATION', 'VITAL_INTERESTS', 'PUBLIC_TASK');

ALTER TABLE "Tenant" ADD COLUMN "defaultConsentLegalBasis" "ConsentLegalBasis" NOT NULL DEFAULT 'EXPLICIT_CONSENT';
ALTER TABLE "Supplier" ADD COLUMN "priceFeedConsentStatus" "SupplierConsentStatus" NOT NULL DEFAULT 'NOT_REQUESTED';
ALTER TABLE "Supplier" ADD COLUMN "priceFeedConsentedAt" TIMESTAMP(3);
ALTER TABLE "Supplier" ADD COLUMN "priceFeedConsentExpiresAt" TIMESTAMP(3);
ALTER TABLE "Supplier" ADD COLUMN "priceFeedSlaLevel" TEXT;
ALTER TABLE "ConsentRecord" ADD COLUMN "legalBasis" "ConsentLegalBasis" NOT NULL DEFAULT 'EXPLICIT_CONSENT';
ALTER TABLE "ConsentRecord" ADD COLUMN "legalBasisReference" TEXT;
ALTER TABLE "ConsentRecord" ADD COLUMN "processingPurposes" TEXT NOT NULL DEFAULT 'NOT_SPECIFIED';
ALTER TABLE "ConsentRecord" ADD COLUMN "retentionPeriodDays" INTEGER;
ALTER TABLE "ConsentRecord" ADD COLUMN "hotelJurisdiction" TEXT;

CREATE TABLE "HotelEInvoiceImport" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "hotelId" TEXT NOT NULL REFERENCES "Hotel"("id") ON DELETE RESTRICT,
  "sourceType" TEXT NOT NULL,
  "sourceReference" TEXT NOT NULL,
  "payloadSummary" JSONB NOT NULL,
  "recordCount" INTEGER NOT NULL DEFAULT 0,
  "successfulCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
  "errorSummary" TEXT,
  "importedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uuid" UUID UNIQUE DEFAULT gen_random_uuid(),
  "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "SupplierListIngestion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "hotelEInvoiceImportId" TEXT NOT NULL REFERENCES "HotelEInvoiceImport"("id") ON DELETE CASCADE,
  "supplierName" TEXT NOT NULL,
  "supplierTaxId" TEXT,
  "productName" TEXT NOT NULL,
  "productCategory" TEXT,
  "quantity" INTEGER NOT NULL,
  "unitPrice" DECIMAL(12,2) NOT NULL,
  "totalAmount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EGP',
  "invoiceDate" TIMESTAMP(3) NOT NULL,
  "sourceLineItemId" TEXT,
  "matchedProductId" TEXT,
  "matchedSupplierId" TEXT,
  "matchConfidence" DOUBLE PRECISION,
  "status" "IngestionStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uuid" UUID UNIQUE DEFAULT gen_random_uuid(),
  "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "ConnectedSupplierPriceComparison" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "hotelId" TEXT NOT NULL REFERENCES "Hotel"("id") ON DELETE RESTRICT,
  "supplierId" TEXT NOT NULL REFERENCES "Supplier"("id") ON DELETE RESTRICT,
  "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE RESTRICT,
  "historicalPrice" DECIMAL(12,2) NOT NULL,
  "currentSupplierPrice" DECIMAL(12,2) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EGP',
  "comparisonDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "priceDifference" DECIMAL(12,2) NOT NULL,
  "percentageChange" DECIMAL(5,4),
  "comparisonBasis" TEXT NOT NULL,
  "sourceReference" TEXT,
  "status" "ComparisonStatus" NOT NULL DEFAULT 'OBSERVED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uuid" UUID UNIQUE DEFAULT gen_random_uuid(),
  "deletedAt" TIMESTAMP(3)
);

CREATE TABLE "HotelConnector" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "hotelId" TEXT NOT NULL REFERENCES "Hotel"("id") ON DELETE RESTRICT,
  "adapterType" TEXT NOT NULL,
  "status" "ConnectorStatus" NOT NULL DEFAULT 'PENDING',
  "config" JSONB NOT NULL,
  "credentialsRef" TEXT,
  "lastSyncAt" TIMESTAMP(3),
  "lastError" TEXT,
  "healthCheckUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uuid" UUID UNIQUE DEFAULT gen_random_uuid(),
  "deletedAt" TIMESTAMP(3)
);

CREATE INDEX "HotelEInvoiceImport_tenant_hotel_idx" ON "HotelEInvoiceImport"("tenantId", "hotelId");
CREATE INDEX "HotelEInvoiceImport_status_idx" ON "HotelEInvoiceImport"("status");
CREATE INDEX "HotelEInvoiceImport_deleted_idx" ON "HotelEInvoiceImport"("deletedAt");

CREATE INDEX "SupplierListIngestion_tenant_import_idx" ON "SupplierListIngestion"("tenantId", "hotelEInvoiceImportId");
CREATE INDEX "SupplierListIngestion_matched_product_idx" ON "SupplierListIngestion"("matchedProductId");
CREATE INDEX "SupplierListIngestion_matched_supplier_idx" ON "SupplierListIngestion"("matchedSupplierId");
CREATE INDEX "SupplierListIngestion_status_idx" ON "SupplierListIngestion"("status");
CREATE INDEX "SupplierListIngestion_deleted_idx" ON "SupplierListIngestion"("deletedAt");

CREATE INDEX "ConnectedSupplierPriceComparison_tenant_hotel_product_idx" ON "ConnectedSupplierPriceComparison"("tenantId", "hotelId", "productId");
CREATE INDEX "ConnectedSupplierPriceComparison_tenant_supplier_idx" ON "ConnectedSupplierPriceComparison"("tenantId", "supplierId");
CREATE INDEX "ConnectedSupplierPriceComparison_comparison_date_idx" ON "ConnectedSupplierPriceComparison"("comparisonDate");
CREATE INDEX "ConnectedSupplierPriceComparison_deleted_idx" ON "ConnectedSupplierPriceComparison"("deletedAt");
CREATE INDEX "HotelConnector_tenant_hotel_idx" ON "HotelConnector"("tenantId", "hotelId");
CREATE INDEX "HotelConnector_status_idx" ON "HotelConnector"("status");
CREATE INDEX "HotelConnector_deleted_idx" ON "HotelConnector"("deletedAt");
