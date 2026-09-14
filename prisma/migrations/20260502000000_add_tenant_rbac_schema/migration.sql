Loaded Prisma config from prisma.config.ts.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TenantType" AS ENUM ('HOTEL_GROUP', 'SUPPLIER', 'FACTORING_COMPANY', 'SHIPPING_PROVIDER', 'PLATFORM');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "HotelRiskTier" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "HotelTier" AS ENUM ('CORE', 'PREMIER', 'COASTAL');

-- CreateEnum
CREATE TYPE "HotelStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('HOTEL', 'RESORT', 'SERVICE_APARTMENT', 'BOUTIQUE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'REGIONAL_GM', 'GM', 'FINANCIAL_CONTROLLER', 'DEPARTMENT_HEAD', 'CLERK', 'RECEIVING_CLERK');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('HOTEL', 'SUPPLIER', 'FACTORING', 'SHIPPING', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SupplierTier" AS ENUM ('CORE', 'PREMIER', 'COASTAL', 'VERIFIED');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('F_AND_B', 'CONSUMABLES', 'GUEST_SUPPLIES', 'FFE', 'SERVICES');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CONFIRMED', 'IN_TRANSIT', 'PARTIALLY_DELIVERED', 'DELIVERED', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalAction" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'ESCALATED', 'AUTO_APPROVED', 'ADMIN_OVERRIDE');

-- CreateEnum
CREATE TYPE "EtaStatus" AS ENUM ('PENDING', 'SUBMITTING', 'ACCEPTED', 'REJECTED', 'RETRYING', 'MANUAL_RESOLUTION');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'SUBMITTED', 'VALIDATED', 'DISPUTED', 'CREDIT_NOTE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'FACTORED');

-- CreateEnum
CREATE TYPE "FactoringStatus" AS ENUM ('NOT_FACTORABLE', 'AVAILABLE', 'OFFERED', 'ACCEPTED', 'PAID');

-- CreateEnum
CREATE TYPE "AuthorityAction" AS ENUM ('AUTO_APPROVE', 'ROUTE_TO_GM', 'ROUTE_TO_FINANCIAL_CONTROLLER', 'APPROVE', 'DUAL_SIGN_OFF', 'REJECT', 'REQUIRE_OWNER');

-- CreateEnum
CREATE TYPE "CompetitorType" AS ENUM ('STARTUP', 'SCALEUP', 'ENTERPRISE', 'GPO', 'MARKETPLACE');

-- CreateEnum
CREATE TYPE "CompetitorStatus" AS ENUM ('ACTIVE', 'ACQUIRED', 'SHUT_DOWN', 'PIVOTING', 'STRUGGLING');

-- CreateEnum
CREATE TYPE "InsightCategory" AS ENUM ('COMPETITOR_MOVE', 'MARKET_TREND', 'REGULATORY_CHANGE', 'FUNDING_NEWS', 'TECHNOLOGY_SHIFT', 'CUSTOMER_PAIN_POINT', 'OPPORTUNITY');

-- CreateEnum
CREATE TYPE "FeatureCategory" AS ENUM ('AI_ML', 'FINANCE', 'COMPLIANCE', 'LOGISTICS', 'ANALYTICS', 'MARKETPLACE', 'GOVERNANCE', 'MOBILE', 'INTEGRATION', 'ECOSYSTEM');

-- CreateEnum
CREATE TYPE "Complexity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'BREAKTHROUGH');

-- CreateEnum
CREATE TYPE "Impact" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'TRANSFORMATIVE');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PROPOSED', 'UNDER_REVIEW', 'APPROVED', 'IN_BACKLOG', 'IMPLEMENTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AgentRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JournalStatus" AS ENUM ('DRAFT', 'POSTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "FactoringCompanyStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CreditTxnType" AS ENUM ('CREDIT_DRAW', 'CREDIT_REPAY', 'FACTORING_ADVANCE', 'FACTORING_COLLECTION', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "FactoringRequestStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED', 'SETTLED', 'DEFAULTED');

-- CreateEnum
CREATE TYPE "RiskTier" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "HubType" AS ENUM ('CONSOLIDATION', 'CROSS_DOCK', 'LAST_MILE');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('SCHEDULED', 'LOADING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StopStatus" AS ENUM ('PENDING', 'ARRIVED', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "OutletType" AS ENUM ('KITCHEN', 'POOL_BAR', 'BEACH_GRILL', 'SPA_CAFE', 'ROOM_SERVICE', 'MINI_BAR', 'BANQUET', 'MAIN_RESTAURANT');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'CONDITIONAL');

-- CreateEnum
CREATE TYPE "DocCategory" AS ENUM ('CERTIFICATE', 'INVOICE_PDF', 'PO_PDF', 'TAX_DOC', 'BANK_STATEMENT', 'KYC_ID', 'CONTRACT', 'AUDIT_REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'CASH', 'CHECK', 'CREDIT_CARD', 'E_WALLET');

-- CreateEnum
CREATE TYPE "CreditFacilityStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "TenantType" NOT NULL DEFAULT 'HOTEL_GROUP',
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "taxId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tenantId" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "Hotel" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
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
    "tier" "HotelTier" NOT NULL DEFAULT 'CORE',
    "status" "HotelStatus" NOT NULL DEFAULT 'ACTIVE',
    "creditLimit" DOUBLE PRECISION,
    "creditUsed" DOUBLE PRECISION DEFAULT 0,
    "riskScore" INTEGER DEFAULT 50,
    "riskTier" "RiskTier" DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hotel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "governorate" TEXT NOT NULL,
    "roomCount" INTEGER,
    "type" "PropertyType" NOT NULL DEFAULT 'HOTEL',
    "hotelId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'DEPARTMENT_HEAD',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "passwordHash" TEXT,
    "platformRole" "PlatformRole" NOT NULL DEFAULT 'HOTEL',
    "tenantId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "hotelId" TEXT,
    "supplierId" TEXT,
    "factoringCompanyId" TEXT,
    "canOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActive" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
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
    "status" "SupplierStatus" NOT NULL DEFAULT 'PENDING',
    "tier" "SupplierTier" NOT NULL DEFAULT 'CORE',
    "rating" DOUBLE PRECISION DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "certifications" TEXT,
    "bankAccount" TEXT,
    "bankName" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryZone" (
    "id" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "minDays" INTEGER NOT NULL,
    "maxDays" INTEGER NOT NULL,
    "fee" DOUBLE PRECISION NOT NULL,
    "supplierId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ProductCategory" NOT NULL,
    "subcategory" TEXT,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "volumeTiers" TEXT,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "minOrderQty" INTEGER NOT NULL DEFAULT 1,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 1,
    "reorderPoint" INTEGER NOT NULL DEFAULT 10,
    "reorderQty" INTEGER NOT NULL DEFAULT 50,
    "avgDailyUsage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastCountedAt" TIMESTAMP(3),
    "aiForecast" TEXT,
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'piece',
    "shelfLifeDays" INTEGER,
    "temperatureReq" TEXT,
    "images" TEXT,
    "specs" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "supplierId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "vatAmount" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "deliveryDate" TIMESTAMP(3),
    "deliveryInstructions" TEXT,
    "hotelId" TEXT NOT NULL,
    "propertyId" TEXT,
    "outletId" TEXT,
    "supplierId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "etaSubmissionId" TEXT,
    "paymentGuaranteed" BOOLEAN NOT NULL DEFAULT false,
    "paymentGuaranteeMethod" TEXT,
    "paymentGuaranteeSetAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderApproval" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "action" "ApprovalAction" NOT NULL,
    "reason" TEXT,
    "beforeState" TEXT,
    "afterState" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "etaUuid" TEXT,
    "etaStatus" "EtaStatus" NOT NULL DEFAULT 'PENDING',
    "digitalSignature" TEXT,
    "submissionLog" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 14.00,
    "vatAmount" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "orderId" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "factoringStatus" "FactoringStatus" NOT NULL DEFAULT 'NOT_FACTORABLE',
    "factoringCompanyId" TEXT,
    "factoringAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorityRule" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "minValue" DOUBLE PRECISION NOT NULL,
    "maxValue" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "supplierTier" TEXT,
    "hotelRiskTier" "HotelRiskTier",
    "hotelTier" "HotelTier",
    "requesterRole" "UserRole",
    "requiresPaymentGuarantee" BOOLEAN NOT NULL DEFAULT false,
    "requiresEtaValidation" BOOLEAN NOT NULL DEFAULT false,
    "requiresDualSignOff" BOOLEAN NOT NULL DEFAULT false,
    "action" "AuthorityAction" NOT NULL,
    "routeToRole" "UserRole",
    "hotelId" TEXT,
    "tenantId" TEXT,
    "name" TEXT,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthorityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpendRecord" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "hotelId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "orderCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpendRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT,
    "beforeState" TEXT,
    "afterState" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "previousHash" TEXT,
    "hash" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "type" "CompetitorType" NOT NULL,
    "marketFocus" TEXT NOT NULL,
    "vertical" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "pricing" TEXT,
    "feeStructure" TEXT,
    "merchantCount" INTEGER,
    "supplierCount" INTEGER,
    "geoCoverage" TEXT,
    "features" TEXT,
    "strengths" TEXT,
    "weaknesses" TEXT,
    "funding" TEXT,
    "totalRaised" TEXT,
    "status" "CompetitorStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketInsight" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "InsightCategory" NOT NULL,
    "summary" TEXT NOT NULL,
    "detail" TEXT,
    "sourceUrl" TEXT,
    "sourceName" TEXT,
    "publishedAt" TIMESTAMP(3),
    "confidence" INTEGER NOT NULL DEFAULT 80,
    "impactScore" INTEGER NOT NULL DEFAULT 50,
    "competitorId" TEXT,
    "discoveredBy" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureProposal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "FeatureCategory" NOT NULL,
    "targetActor" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "complexity" "Complexity" NOT NULL DEFAULT 'MEDIUM',
    "impact" "Impact" NOT NULL DEFAULT 'MEDIUM',
    "effortWeeks" DOUBLE PRECISION,
    "gapAddressed" TEXT,
    "moatScore" INTEGER NOT NULL DEFAULT 50,
    "revenuePotential" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PROPOSED',
    "proposedBy" TEXT NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "relatedCompetitorIds" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "status" "AgentRunStatus" NOT NULL DEFAULT 'PENDING',
    "output" TEXT,
    "findings" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "parentRunId" TEXT,
    "childRunIds" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "entryNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "lines" TEXT NOT NULL,
    "totalDebit" DOUBLE PRECISION NOT NULL,
    "totalCredit" DOUBLE PRECISION NOT NULL,
    "status" "JournalStatus" NOT NULL DEFAULT 'POSTED',
    "hotelId" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventorySnapshot" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "stockLevel" INTEGER NOT NULL,
    "projectedDays" DOUBLE PRECISION NOT NULL,
    "aiSuggestion" TEXT,
    "occupancyRate" DOUBLE PRECISION,
    "consumptionRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventorySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactoringCompany" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "taxId" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "status" "FactoringCompanyStatus" NOT NULL DEFAULT 'ACTIVE',
    "maxFacility" DOUBLE PRECISION,
    "interestRate" DOUBLE PRECISION,
    "rate" DOUBLE PRECISION,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FactoringCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "type" "CreditTxnType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "hotelId" TEXT NOT NULL,
    "factoringCompanyId" TEXT,
    "orderId" TEXT,
    "invoiceId" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactoringRequest" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "requestedAmount" DOUBLE PRECISION NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "factoringCompanyId" TEXT NOT NULL,
    "status" "FactoringRequestStatus" NOT NULL DEFAULT 'PENDING',
    "riskScore" INTEGER DEFAULT 50,
    "riskTier" "RiskTier" NOT NULL DEFAULT 'MEDIUM',
    "advanceRate" DOUBLE PRECISION NOT NULL DEFAULT 0.90,
    "discountRate" DOUBLE PRECISION NOT NULL DEFAULT 0.02,
    "platformFeeRate" DOUBLE PRECISION NOT NULL DEFAULT 0.015,
    "membershipDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossAmount" DOUBLE PRECISION,
    "platformFee" DOUBLE PRECISION,
    "netPlatformFee" DOUBLE PRECISION,
    "factoringFee" DOUBLE PRECISION,
    "disbursedAmount" DOUBLE PRECISION,
    "disbursedAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "hotelPaidAt" TIMESTAMP(3),
    "isNonRecourse" BOOLEAN NOT NULL DEFAULT true,
    "partnerResponse" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FactoringRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticsHub" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "city" TEXT NOT NULL,
    "governorate" TEXT NOT NULL,
    "address" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "type" "HubType" NOT NULL DEFAULT 'CONSOLIDATION',
    "operatingHours" TEXT,
    "contactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogisticsHub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "tripNumber" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "vehiclePlate" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "departureDate" TIMESTAMP(3),
    "arrivalDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "TripStatus" NOT NULL DEFAULT 'SCHEDULED',
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripStop" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "orderId" TEXT,
    "tenantId" TEXT NOT NULL,
    "stopOrder" INTEGER NOT NULL,
    "stopNumber" INTEGER,
    "estimatedArrival" TIMESTAMP(3),
    "eta" TIMESTAMP(3),
    "actualArrival" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "status" "StopStatus" NOT NULL DEFAULT 'PENDING',
    "podPhotoUrl" TEXT,
    "signatureUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outlet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OutletType" NOT NULL DEFAULT 'KITCHEN',
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "managerName" TEXT,
    "managerPhone" TEXT,
    "operatingHours" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Outlet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierAudit" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "auditorName" TEXT NOT NULL,
    "auditDate" TIMESTAMP(3) NOT NULL,
    "score" INTEGER,
    "status" "AuditStatus" NOT NULL DEFAULT 'PENDING',
    "coldChainCompliant" BOOLEAN,
    "haccpCertified" BOOLEAN,
    "onSiteVisited" BOOLEAN,
    "labTested" BOOLEAN,
    "reportUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "category" "DocCategory" NOT NULL DEFAULT 'OTHER',
    "uploadedBy" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "method" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "invoiceId" TEXT,
    "hotelId" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "referenceCode" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditFacility" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "factoringCompanyId" TEXT NOT NULL,
    "limit" DOUBLE PRECISION NOT NULL,
    "utilized" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "status" "CreditFacilityStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditFacility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsolidatedOrder" (
    "id" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "tripId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "totalValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryDate" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsolidatedOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PermissionToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PermissionToRole_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_taxId_key" ON "Tenant"("taxId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

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
CREATE INDEX "OrderApproval_orderId_approverId_idx" ON "OrderApproval"("orderId", "approverId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_etaUuid_key" ON "Invoice"("etaUuid");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Competitor_name_key" ON "Competitor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_entryNumber_key" ON "JournalEntry"("entryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FactoringCompany_taxId_key" ON "FactoringCompany"("taxId");

-- CreateIndex
CREATE INDEX "CreditTransaction_hotelId_idx" ON "CreditTransaction"("hotelId");

-- CreateIndex
CREATE INDEX "CreditTransaction_factoringCompanyId_idx" ON "CreditTransaction"("factoringCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "FactoringRequest_invoiceId_key" ON "FactoringRequest"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_tripNumber_key" ON "Trip"("tripNumber");

-- CreateIndex
CREATE INDEX "Document_entityType_entityId_idx" ON "Document"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Document_tenantId_idx" ON "Document"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentNumber_key" ON "Payment"("paymentNumber");

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hotel" ADD CONSTRAINT "Hotel_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_factoringCompanyId_fkey" FOREIGN KEY ("factoringCompanyId") REFERENCES "FactoringCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryZone" ADD CONSTRAINT "DeliveryZone_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryZone" ADD CONSTRAINT "DeliveryZone_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderApproval" ADD CONSTRAINT "OrderApproval_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderApproval" ADD CONSTRAINT "OrderApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_factoringCompanyId_fkey" FOREIGN KEY ("factoringCompanyId") REFERENCES "FactoringCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpendRecord" ADD CONSTRAINT "SpendRecord_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpendRecord" ADD CONSTRAINT "SpendRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketInsight" ADD CONSTRAINT "MarketInsight_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySnapshot" ADD CONSTRAINT "InventorySnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySnapshot" ADD CONSTRAINT "InventorySnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoringCompany" ADD CONSTRAINT "FactoringCompany_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_factoringCompanyId_fkey" FOREIGN KEY ("factoringCompanyId") REFERENCES "FactoringCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoringRequest" ADD CONSTRAINT "FactoringRequest_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoringRequest" ADD CONSTRAINT "FactoringRequest_factoringCompanyId_fkey" FOREIGN KEY ("factoringCompanyId") REFERENCES "FactoringCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactoringRequest" ADD CONSTRAINT "FactoringRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogisticsHub" ADD CONSTRAINT "LogisticsHub_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "LogisticsHub"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStop" ADD CONSTRAINT "TripStop_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStop" ADD CONSTRAINT "TripStop_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStop" ADD CONSTRAINT "TripStop_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripStop" ADD CONSTRAINT "TripStop_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outlet" ADD CONSTRAINT "Outlet_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outlet" ADD CONSTRAINT "Outlet_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierAudit" ADD CONSTRAINT "SupplierAudit_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierAudit" ADD CONSTRAINT "SupplierAudit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditFacility" ADD CONSTRAINT "CreditFacility_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditFacility" ADD CONSTRAINT "CreditFacility_factoringCompanyId_fkey" FOREIGN KEY ("factoringCompanyId") REFERENCES "FactoringCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditFacility" ADD CONSTRAINT "CreditFacility_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsolidatedOrder" ADD CONSTRAINT "ConsolidatedOrder_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "LogisticsHub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsolidatedOrder" ADD CONSTRAINT "ConsolidatedOrder_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsolidatedOrder" ADD CONSTRAINT "ConsolidatedOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

