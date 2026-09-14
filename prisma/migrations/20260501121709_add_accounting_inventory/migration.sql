-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryNumber" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "lines" TEXT NOT NULL,
    "totalDebit" REAL NOT NULL,
    "totalCredit" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'POSTED',
    "hotelId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JournalEntry_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventorySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "stockLevel" INTEGER NOT NULL,
    "projectedDays" REAL NOT NULL,
    "aiSuggestion" TEXT,
    "occupancyRate" REAL,
    "consumptionRate" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventorySnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
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
    "reorderPoint" INTEGER NOT NULL DEFAULT 10,
    "reorderQty" INTEGER NOT NULL DEFAULT 50,
    "avgDailyUsage" REAL NOT NULL DEFAULT 0,
    "lastCountedAt" DATETIME,
    "aiForecast" TEXT,
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
INSERT INTO "new_Product" ("category", "createdAt", "currency", "description", "id", "images", "leadTimeDays", "minOrderQty", "name", "shelfLifeDays", "sku", "specs", "status", "stockQuantity", "subcategory", "supplierId", "temperatureReq", "unitOfMeasure", "unitPrice", "updatedAt", "volumeTiers") SELECT "category", "createdAt", "currency", "description", "id", "images", "leadTimeDays", "minOrderQty", "name", "shelfLifeDays", "sku", "specs", "status", "stockQuantity", "subcategory", "supplierId", "temperatureReq", "unitOfMeasure", "unitPrice", "updatedAt", "volumeTiers" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_entryNumber_key" ON "JournalEntry"("entryNumber");
