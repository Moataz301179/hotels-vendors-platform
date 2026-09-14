-- CreateTable
CREATE TABLE "Hotel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "taxId" TEXT NOT NULL,
    "commercialReg" TEXT,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "governorate" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "starRating" INTEGER,
    "roomCount" INTEGER,
    "tier" TEXT NOT NULL DEFAULT 'CORE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "creditLimit" REAL,
    "creditUsed" REAL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "governorate" TEXT NOT NULL,
    "roomCount" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'HOTEL',
    "hotelId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'DEPARTMENT_HEAD',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "passwordHash" TEXT,
    "hotelId" TEXT NOT NULL,
    "canOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastActive" DATETIME,
    CONSTRAINT "User_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "taxId" TEXT NOT NULL,
    "commercialReg" TEXT,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "governorate" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "tier" TEXT NOT NULL DEFAULT 'CORE',
    "rating" REAL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "certifications" TEXT,
    "bankAccount" TEXT,
    "bankName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DeliveryZone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "zone" TEXT NOT NULL,
    "minDays" INTEGER NOT NULL,
    "maxDays" INTEGER NOT NULL,
    "fee" REAL NOT NULL,
    "supplierId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeliveryZone_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "unitPrice" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "volumeTiers" TEXT,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "minOrderQty" INTEGER NOT NULL DEFAULT 1,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 1,
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'piece',
    "shelfLifeDays" INTEGER,
    "temperatureReq" TEXT,
    "images" TEXT,
    "specs" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "supplierId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
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
    "supplierId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "etaSubmissionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "total" REAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderApproval_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
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
    CONSTRAINT "Invoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuthorityRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "minValue" REAL NOT NULL,
    "maxValue" REAL NOT NULL,
    "category" TEXT NOT NULL,
    "supplierTier" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "routeToRole" TEXT,
    "hotelId" TEXT,
    "name" TEXT,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SpendRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "hotelId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "orderCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpendRecord_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT,
    "beforeState" TEXT,
    "afterState" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Hotel_taxId_key" ON "Hotel"("taxId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_taxId_key" ON "Supplier"("taxId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_email_key" ON "Supplier"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_etaUuid_key" ON "Invoice"("etaUuid");
