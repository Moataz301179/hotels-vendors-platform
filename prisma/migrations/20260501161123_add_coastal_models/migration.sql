-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Cart_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "total" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FactoringCompany" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "taxId" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "maxFacility" REAL,
    "interestRate" REAL,
    "rate" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "hotelId" TEXT NOT NULL,
    "factoringCompanyId" TEXT,
    "orderId" TEXT,
    "invoiceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditTransaction_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CreditTransaction_factoringCompanyId_fkey" FOREIGN KEY ("factoringCompanyId") REFERENCES "FactoringCompany" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LogisticsHub" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "city" TEXT NOT NULL,
    "governorate" TEXT NOT NULL,
    "address" TEXT,
    "lat" REAL,
    "lng" REAL,
    "type" TEXT NOT NULL DEFAULT 'CONSOLIDATION',
    "operatingHours" TEXT,
    "contactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripNumber" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "vehiclePlate" TEXT,
    "scheduledDate" DATETIME,
    "departureDate" DATETIME,
    "arrivalDate" DATETIME,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trip_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "LogisticsHub" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TripStop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "orderId" TEXT,
    "stopOrder" INTEGER NOT NULL,
    "stopNumber" INTEGER,
    "estimatedArrival" DATETIME,
    "eta" DATETIME,
    "actualArrival" DATETIME,
    "arrivedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "podPhotoUrl" TEXT,
    "signatureUrl" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TripStop_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TripStop_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Outlet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'KITCHEN',
    "propertyId" TEXT NOT NULL,
    "managerName" TEXT,
    "managerPhone" TEXT,
    "operatingHours" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Outlet_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "auditorName" TEXT NOT NULL,
    "auditDate" DATETIME NOT NULL,
    "score" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "coldChainCompliant" BOOLEAN,
    "haccpCertified" BOOLEAN,
    "onSiteVisited" BOOLEAN,
    "labTested" BOOLEAN,
    "reportUrl" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierAudit_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "uploadedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentNumber" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "method" TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invoiceId" TEXT,
    "hotelId" TEXT NOT NULL,
    "paidAt" DATETIME,
    "referenceCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreditFacility" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hotelId" TEXT NOT NULL,
    "factoringCompanyId" TEXT NOT NULL,
    "limit" REAL NOT NULL,
    "utilized" REAL NOT NULL DEFAULT 0,
    "interestRate" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CreditFacility_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CreditFacility_factoringCompanyId_fkey" FOREIGN KEY ("factoringCompanyId") REFERENCES "FactoringCompany" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsolidatedOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hubId" TEXT NOT NULL,
    "tripId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "totalValue" REAL NOT NULL DEFAULT 0,
    "deliveryDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConsolidatedOrder_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "LogisticsHub" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConsolidatedOrder_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "etaUuid" TEXT,
    "etaStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "digitalSignature" TEXT,
    "submissionLog" TEXT,
    "subtotal" REAL NOT NULL,
    "vatRate" REAL NOT NULL DEFAULT 14.00,
    "vatAmount" REAL NOT NULL,
    "total" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "issueDate" DATETIME NOT NULL,
    "dueDate" DATETIME,
    "paidDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "orderId" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "factoringStatus" TEXT NOT NULL DEFAULT 'NOT_FACTORABLE',
    "factoringCompanyId" TEXT,
    "factoringAmount" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_factoringCompanyId_fkey" FOREIGN KEY ("factoringCompanyId") REFERENCES "FactoringCompany" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("createdAt", "currency", "digitalSignature", "dueDate", "etaStatus", "etaUuid", "factoringAmount", "factoringCompanyId", "factoringStatus", "hotelId", "id", "invoiceNumber", "issueDate", "orderId", "paidDate", "paymentStatus", "status", "submissionLog", "subtotal", "supplierId", "total", "updatedAt", "vatAmount", "vatRate") SELECT "createdAt", "currency", "digitalSignature", "dueDate", "etaStatus", "etaUuid", "factoringAmount", "factoringCompanyId", "factoringStatus", "hotelId", "id", "invoiceNumber", "issueDate", "orderId", "paidDate", "paymentStatus", "status", "submissionLog", "subtotal", "supplierId", "total", "updatedAt", "vatAmount", "vatRate" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE UNIQUE INDEX "Invoice_etaUuid_key" ON "Invoice"("etaUuid");
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "currency", "deliveryDate", "deliveryInstructions", "etaSubmissionId", "hotelId", "id", "orderNumber", "propertyId", "requesterId", "status", "subtotal", "supplierId", "total", "updatedAt", "vatAmount") SELECT "createdAt", "currency", "deliveryDate", "deliveryInstructions", "etaSubmissionId", "hotelId", "id", "orderNumber", "propertyId", "requesterId", "status", "subtotal", "supplierId", "total", "updatedAt", "vatAmount" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FactoringCompany_taxId_key" ON "FactoringCompany"("taxId");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_tripNumber_key" ON "Trip"("tripNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentNumber_key" ON "Payment"("paymentNumber");
