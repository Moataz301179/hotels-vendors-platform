-- AlterTable
ALTER TABLE "Hotel" ADD COLUMN "riskScore" INTEGER DEFAULT 50;
ALTER TABLE "Hotel" ADD COLUMN "riskTier" TEXT DEFAULT 'MEDIUM';

-- CreateTable
CREATE TABLE "FactoringRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "requestedAmount" REAL NOT NULL,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "factoringCompanyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "riskScore" INTEGER DEFAULT 50,
    "riskTier" TEXT NOT NULL DEFAULT 'MEDIUM',
    "advanceRate" REAL NOT NULL DEFAULT 0.90,
    "discountRate" REAL NOT NULL DEFAULT 0.02,
    "platformFeeRate" REAL NOT NULL DEFAULT 0.015,
    "membershipDiscount" REAL NOT NULL DEFAULT 0,
    "grossAmount" REAL,
    "platformFee" REAL,
    "netPlatformFee" REAL,
    "factoringFee" REAL,
    "disbursedAmount" REAL,
    "disbursedAt" DATETIME,
    "settledAt" DATETIME,
    "hotelPaidAt" DATETIME,
    "isNonRecourse" BOOLEAN NOT NULL DEFAULT true,
    "partnerResponse" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FactoringRequest_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FactoringRequest_factoringCompanyId_fkey" FOREIGN KEY ("factoringCompanyId") REFERENCES "FactoringCompany" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotal" REAL NOT NULL,
    "vatAmount" REAL NOT NULL,
    "total" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "deliveryDate" DATETIME,
    "deliveryInstructions" TEXT,
    "hotelId" TEXT NOT NULL,
    "propertyId" TEXT,
    "outletId" TEXT,
    "supplierId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "etaSubmissionId" TEXT,
    "paymentGuaranteed" BOOLEAN NOT NULL DEFAULT false,
    "paymentGuaranteeMethod" TEXT,
    "paymentGuaranteeSetAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "currency", "deliveryDate", "deliveryInstructions", "etaSubmissionId", "hotelId", "id", "orderNumber", "outletId", "propertyId", "requesterId", "status", "subtotal", "supplierId", "total", "updatedAt", "vatAmount") SELECT "createdAt", "currency", "deliveryDate", "deliveryInstructions", "etaSubmissionId", "hotelId", "id", "orderNumber", "outletId", "propertyId", "requesterId", "status", "subtotal", "supplierId", "total", "updatedAt", "vatAmount" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "FactoringRequest_invoiceId_key" ON "FactoringRequest"("invoiceId");
