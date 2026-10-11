-- Tenant-scoped administrator controls for department catalog access and PO approval routing.
CREATE TABLE "Department" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Department_tenantId_code_key" ON "Department"("tenantId", "code");
CREATE INDEX "Department_tenantId_deletedAt_idx" ON "Department"("tenantId", "deletedAt");
ALTER TABLE "Department" ADD CONSTRAINT "Department_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "DepartmentCategoryAccess" (
  "id" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  "category" "ProductCategory" NOT NULL,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DepartmentCategoryAccess_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DepartmentCategoryAccess_departmentId_category_key" ON "DepartmentCategoryAccess"("departmentId", "category");
ALTER TABLE "DepartmentCategoryAccess" ADD CONSTRAINT "DepartmentCategoryAccess_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "User" ADD COLUMN "departmentId" TEXT;
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ProcurementApprovalPolicy" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "departmentId" TEXT,
  "minAmount" DECIMAL(12,2),
  "maxAmount" DECIMAL(12,2),
  "primaryApproverId" TEXT NOT NULL,
  "secondaryApproverId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ProcurementApprovalPolicy_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProcurementApprovalPolicy_tenantId_departmentId_active_idx" ON "ProcurementApprovalPolicy"("tenantId", "departmentId", "isActive");
ALTER TABLE "ProcurementApprovalPolicy" ADD CONSTRAINT "ProcurementApprovalPolicy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
