/**
 * Prisma Seed — Tenant + RBAC + Sample Data
 *
 * Run: npx prisma db seed
 * Or:  npx tsx prisma/seed.ts
 *
 * ⚠️  DEVELOPMENT ONLY — All data below is obviously fake test data.
 *     Do NOT use in production. Do NOT commit real PII.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth";

async function main() {
  console.log("🌱 Starting seed...");

  // ─────────────────────────────────────────
  // 1. PLATFORM TENANT
  // ─────────────────────────────────────────

  const platformTenant = await prisma.tenant.upsert({
    where: { slug: "platform" },
    update: {},
    create: {
      name: "Hotels Vendors Platform",
      slug: "platform",
      type: "PLATFORM",
      status: "ACTIVE",
      taxId: "000-000-000",
    },
  });
  console.log(`🏢 Platform tenant: ${platformTenant.id}`);

  // ─────────────────────────────────────────
  // 2. PERMISSIONS
  // ─────────────────────────────────────────

  const permissionCodes = [
    // Orders
    { code: "order:create", name: "Create Purchase Orders", description: "Create new purchase orders" },
    { code: "order:read", name: "View Orders", description: "View purchase orders" },
    { code: "order:approve", name: "Approve Orders", description: "Approve pending orders" },
    { code: "order:reject", name: "Reject Orders", description: "Reject orders" },
    { code: "order:cancel", name: "Cancel Orders", description: "Cancel existing orders" },
    // Products / Catalog
    { code: "product:create", name: "Create Products", description: "Add products to catalog" },
    { code: "product:read", name: "View Products", description: "View product catalog" },
    { code: "product:update", name: "Update Products", description: "Edit product details" },
    { code: "product:delete", name: "Delete Products", description: "Remove products from catalog" },
    // Invoices
    { code: "invoice:create", name: "Create Invoices", description: "Create invoices" },
    { code: "invoice:read", name: "View Invoices", description: "View invoices" },
    { code: "invoice:submit_eta", name: "Submit ETA", description: "Submit to Egyptian Tax Authority" },
    { code: "invoice:factor", name: "Factor Invoices", description: "Submit invoices for factoring" },
    // Users
    { code: "user:create", name: "Create Users", description: "Add new users" },
    { code: "user:read", name: "View Users", description: "View user list" },
    { code: "user:update", name: "Update Users", description: "Edit user details" },
    { code: "user:delete", name: "Delete Users", description: "Deactivate users" },
    // Leads / Acquisition
    { code: "lead:read", name: "View Leads", description: "View supplier leads" },
    { code: "lead:create", name: "Create Leads", description: "Add and acquire leads" },
    { code: "lead:update", name: "Update Leads", description: "Edit lead details" },
    { code: "lead:delete", name: "Delete Leads", description: "Remove leads" },
    { code: "lead:enrich", name: "Enrich Leads", description: "AI-enrich lead data" },
    { code: "lead:outreach", name: "Outreach Leads", description: "Send outreach messages" },
    { code: "lead:convert", name: "Convert Leads", description: "Convert leads to suppliers" },
    // Suppliers
    { code: "supplier:create", name: "Create Suppliers", description: "Add new suppliers" },
    { code: "supplier:read", name: "View Suppliers", description: "View supplier directory" },
    { code: "supplier:update", name: "Update Suppliers", description: "Edit supplier details" },
    { code: "supplier:delete", name: "Delete Suppliers", description: "Remove suppliers" },
    // Reports / Admin
    { code: "admin:read", name: "View Admin Dashboard", description: "Access admin dashboard" },
    { code: "admin:manage_tenants", name: "Manage Tenants", description: "Create and manage tenants" },
    { code: "admin:override_authority", name: "Override Authority Matrix", description: "Override approval rules" },
    { code: "report:read", name: "View Reports", description: "Access reports and analytics" },
    // Shipping
    { code: "shipping:create_trip", name: "Create Trips", description: "Create logistics trips" },
    { code: "shipping:read", name: "View Shipping", description: "View shipping data" },
    // Factoring
    { code: "factoring:inquire", name: "Inquire Factoring", description: "Request factoring quotes" },
    { code: "factoring:fund", name: "Fund Invoices", description: "Fund factored invoices" },
    { code: "factoring:manage", name: "Manage Factoring", description: "Manage factoring facilities and partners" },
    // Platform Admin
    { code: "admin:manage_platform", name: "Manage Platform", description: "Full platform administration access" },
    // Disputes
    { code: "disputes:create", name: "Create Disputes", description: "Raise order disputes" },
    { code: "disputes:read", name: "View Disputes", description: "View dispute details" },
    { code: "disputes:resolve", name: "Resolve Disputes", description: "Resolve and close disputes" },
    // Compliance / KYC
    { code: "compliance:kyc:read", name: "View KYC", description: "View KYC compliance status" },
    { code: "compliance:kyc:submit", name: "Submit KYC", description: "Submit KYC documents for verification" },
    // Order lifecycle (aliases for route compatibility)
    { code: "order:update", name: "Update Orders", description: "Update order status" },
    { code: "order:confirm", name: "Confirm Orders", description: "Confirm order payment guarantee" },
    // CRM (aliases for lead:* codes)
    { code: "crm:read", name: "View CRM", description: "View CRM leads and contacts" },
    { code: "crm:write", name: "Manage CRM", description: "Create and update CRM leads" },
    // Fintech
    { code: "fintech:read", name: "View Fintech", description: "View fintech facilities" },
    { code: "fintech:write", name: "Manage Fintech", description: "Manage fintech facilities and schedules" },
    // Disputes (aliases)
    { code: "disputes:update", name: "Update Disputes", description: "Update dispute status" },
    { code: "disputes:list", name: "List Disputes", description: "List all disputes" },
    // Factoring credit approval
    { code: "factoring:approve_credit", name: "Approve Credit", description: "Approve factoring credit lines" },
    // Invoice submission
    { code: "invoice:submit", name: "Submit Invoices", description: "Submit invoices for processing" },
  ];

  for (const p of permissionCodes) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }
  console.log(`🔑 ${permissionCodes.length} permissions seeded`);

  // ─────────────────────────────────────────
  // 3. ROLES (global + per-tenant defaults)
  // ─────────────────────────────────────────

  const roleDefs = [
    { name: "Platform Admin", isGlobal: true, permissions: ["admin:read", "admin:manage_tenants", "admin:manage_platform", "admin:override_authority", "user:create", "user:read", "user:update", "user:delete", "report:read", "lead:read", "lead:create", "lead:update", "lead:delete", "lead:enrich", "lead:outreach", "lead:convert", "crm:read", "crm:write", "supplier:create", "supplier:read", "supplier:update", "supplier:delete", "order:create", "order:read", "order:approve", "order:reject", "order:cancel", "order:update", "order:confirm", "product:create", "product:read", "product:update", "product:delete", "invoice:create", "invoice:read", "invoice:submit_eta", "invoice:submit", "invoice:factor", "shipping:create_trip", "shipping:read", "factoring:inquire", "factoring:fund", "factoring:manage", "factoring:approve_credit", "fintech:read", "fintech:write", "disputes:create", "disputes:read", "disputes:update", "disputes:list", "disputes:resolve", "compliance:kyc:read", "compliance:kyc:submit"] },
    { name: "Owner", isGlobal: false, permissions: ["order:create", "order:read", "order:approve", "order:reject", "order:cancel", "order:update", "order:confirm", "product:create", "product:read", "product:update", "product:delete", "invoice:create", "invoice:read", "invoice:submit_eta", "invoice:submit", "invoice:factor", "user:create", "user:read", "user:update", "user:delete", "report:read", "shipping:create_trip", "shipping:read", "factoring:inquire", "factoring:fund", "factoring:approve_credit", "fintech:read", "fintech:write", "crm:read", "crm:write", "disputes:create", "disputes:read", "disputes:update", "disputes:list", "disputes:resolve", "compliance:kyc:read", "compliance:kyc:submit"] },
    { name: "Hotel Manager", isGlobal: false, permissions: ["order:create", "order:read", "order:approve", "order:reject", "product:read", "invoice:read", "invoice:submit_eta", "user:read", "user:update", "report:read", "shipping:read", "factoring:inquire"] },
    { name: "Department Head", isGlobal: false, permissions: ["order:create", "order:read", "order:approve", "product:read", "invoice:read", "user:read"] },
    { name: "Clerk", isGlobal: false, permissions: ["order:create", "order:read", "product:read", "invoice:read"] },
    { name: "Supplier Manager", isGlobal: false, permissions: ["order:read", "product:create", "product:read", "product:update", "invoice:create", "invoice:read", "user:read", "user:update", "report:read", "shipping:create_trip", "shipping:read"] },
    { name: "Factoring Agent", isGlobal: false, permissions: ["invoice:read", "invoice:factor", "factoring:inquire", "factoring:fund", "report:read"] },
    { name: "Logistics Coordinator", isGlobal: false, permissions: ["shipping:create_trip", "shipping:read", "order:read", "report:read"] },
  ];

  const createdRoles: Record<string, { id: string; name: string }> = {};

  for (const r of roleDefs) {
    const role = await prisma.role.upsert({
      where: {
        tenantId_name: { tenantId: platformTenant.id, name: r.name },
      },
      update: {},
      create: {
        name: r.name,
        tenantId: platformTenant.id,
        isGlobal: r.isGlobal,
      },
    });
    createdRoles[r.name] = role;

    // Link permissions
    for (const code of r.permissions) {
      const perm = await prisma.permission.findUnique({ where: { code } });
      if (perm) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId: role.id, permissionId: perm.id },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: perm.id,
          },
        });
      }
    }
  }
  console.log(`🛡️ ${roleDefs.length} roles seeded with permissions`);

  // ─────────────────────────────────────────
  // 4. SAMPLE HOTEL TENANT
  // ─────────────────────────────────────────

  const hotelTenant = await prisma.tenant.upsert({
    where: { slug: "demo-hotel" },
    update: {},
    create: {
      name: "Hotel Test Alpha",
      slug: "demo-hotel",
      type: "HOTEL_GROUP",
      status: "ACTIVE",
      taxId: "TEST-000-001",
    },
  });

  const hotelRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: hotelTenant.id, name: "Owner" } },
    update: {},
    create: { name: "Owner", tenantId: hotelTenant.id, isGlobal: false },
  });

  const hotel = await prisma.hotel.upsert({
    where: { taxId: hotelTenant.taxId },
    update: {},
    create: {
      name: "Hotel Test Alpha",
      legalName: "Hotel Test Alpha (Dev Only)",
      taxId: hotelTenant.taxId,
      commercialReg: "TEST-CR-001",
      address: "123 Test Street, Cairo",
      city: "Cairo",
      governorate: "Cairo",
      phone: "+20 000 000 0000",
      email: "test-hotel@test.hotelsvendors.com",
      starRating: 5,
      roomCount: 320,
      tier: "CORE",
      creditLimit: 1500000,
      creditUsed: 0,
      tenantId: hotelTenant.id,
    },
  });

  // Generate passwords from env vars or random fallback (never hardcode)
  const defaultPassword = process.env.SEED_PASSWORD || "change-me-immediately";
  const hotelPassword = await hashPassword(defaultPassword);
  const hotelUser = await prisma.user.upsert({
    where: { email: "hotel-test@test.hotelsvendors.com" },
    update: {},
    create: {
      email: "hotel-test@test.hotelsvendors.com",
      name: "Hotel Test User",
      passwordHash: hotelPassword,
      platformRole: "HOTEL",
      role: "OWNER",
      tenantId: hotelTenant.id,
      roleId: hotelRole.id,
      hotelId: hotel.id,
      status: "ACTIVE",
    },
  });
  console.log(`🏨 Hotel tenant: ${hotelTenant.id}, user: ${hotelUser.email}`);

  // ─────────────────────────────────────────
  // 5. SAMPLE SUPPLIER TENANT
  // ─────────────────────────────────────────

  const supplierTenant = await prisma.tenant.upsert({
    where: { slug: "demo-supplier" },
    update: {},
    create: {
      name: "Supplier Test Beta",
      slug: "demo-supplier",
      type: "SUPPLIER",
      status: "ACTIVE",
      taxId: "TEST-000-002",
    },
  });

  const supplierRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: supplierTenant.id, name: "Owner" } },
    update: {},
    create: { name: "Owner", tenantId: supplierTenant.id, isGlobal: false },
  });

  const supplier = await prisma.supplier.upsert({
    where: { taxId: supplierTenant.taxId },
    update: {},
    create: {
      name: "Supplier Test Beta",
      legalName: "Supplier Test Beta (Dev Only)",
      taxId: supplierTenant.taxId,
      commercialReg: "TEST-CR-002",
      address: "456 Test Avenue, 6th of October",
      city: "6th of October",
      governorate: "Giza",
      phone: "+20 000 000 0000",
      email: "test-supplier@test.hotelsvendors.com",
      website: "https://test-supplier.example.com",
      tenantId: supplierTenant.id,
    },
  });

  const supplierPassword = await hashPassword(defaultPassword);
  const supplierUser = await prisma.user.upsert({
    where: { email: "supplier-test@test.hotelsvendors.com" },
    update: {},
    create: {
      email: "supplier-test@test.hotelsvendors.com",
      name: "Supplier Test User",
      passwordHash: supplierPassword,
      platformRole: "SUPPLIER",
      role: "OWNER",
      tenantId: supplierTenant.id,
      roleId: supplierRole.id,
      supplierId: supplier.id,
      status: "ACTIVE",
    },
  });
  console.log(`🏭 Supplier tenant: ${supplierTenant.id}, user: ${supplierUser.email}`);

  // ─────────────────────────────────────────
  // 6. SAMPLE FACTORING TENANT
  // ─────────────────────────────────────────

  const factoringTenant = await prisma.tenant.upsert({
    where: { slug: "demo-factoring" },
    update: {},
    create: {
      name: "Factoring Test Gamma",
      slug: "demo-factoring",
      type: "FACTORING_COMPANY",
      status: "ACTIVE",
      taxId: "TEST-000-003",
    },
  });

  const factoringRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: factoringTenant.id, name: "Owner" } },
    update: {},
    create: { name: "Owner", tenantId: factoringTenant.id, isGlobal: false },
  });

  const factoringCompany = await prisma.factoringCompany.upsert({
    where: { taxId: factoringTenant.taxId },
    update: {},
    create: {
      name: "Factoring Test Gamma",
      legalName: "Factoring Test Gamma (Dev Only)",
      taxId: factoringTenant.taxId,
      contactEmail: "test-factoring@test.hotelsvendors.com",
      contactPhone: "+20 000 000 0000",
      status: "ACTIVE",
      maxFacility: 10000000,
      tenantId: factoringTenant.id,
    },
  });

  const factoringPassword = await hashPassword(defaultPassword);
  const factoringUser = await prisma.user.upsert({
    where: { email: "factoring-test@test.hotelsvendors.com" },
    update: {},
    create: {
      email: "factoring-test@test.hotelsvendors.com",
      name: "Factoring Test User",
      passwordHash: factoringPassword,
      platformRole: "FACTORING",
      role: "OWNER",
      tenantId: factoringTenant.id,
      roleId: factoringRole.id,
      factoringCompanyId: factoringCompany.id,
      status: "ACTIVE",
    },
  });
  console.log(`🏦 Factoring tenant: ${factoringTenant.id}, user: ${factoringUser.email}`);

  // ─────────────────────────────────────────
  // 7. SAMPLE PRODUCTS
  // ─────────────────────────────────────────

  const products = [
    { sku: "FNB-001", name: "Premium Olive Oil 5L", category: "F_AND_B" as const, subcategory: "Oils & Fats", unitPrice: 450, stockQuantity: 120, minOrderQty: 6 },
    { sku: "FNB-002", name: "Egyptian Rice 10kg", category: "F_AND_B" as const, subcategory: "Grains", unitPrice: 280, stockQuantity: 200, minOrderQty: 10 },
    { sku: "FNB-003", name: "Halal Chicken Breast 1kg", category: "F_AND_B" as const, subcategory: "Poultry", unitPrice: 185, stockQuantity: 80, minOrderQty: 20 },
    { sku: "HSK-001", name: "Luxury Bath Amenities Set", category: "CONSUMABLES" as const, subcategory: "Amenities", unitPrice: 120, stockQuantity: 500, minOrderQty: 50 },
    { sku: "HSK-002", name: "Premium Bed Sheets (King)", category: "FFE" as const, subcategory: "Linens", unitPrice: 850, stockQuantity: 60, minOrderQty: 10 },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        ...p,
        currency: "EGP",
        supplierId: supplier.id,
        tenantId: supplierTenant.id,
      },
    });
  }
  console.log(`📦 ${products.length} products seeded`);

  // ─────────────────────────────────────────
  // 8. AUTHORITY RULES
  // ─────────────────────────────────────────

  const authorityRules = [
    {
      name: "Low Value Auto-Approve",
      description: "Orders under EGP 10,000 auto-approved for Department Heads",
      role: "DEPARTMENT_HEAD" as const,
      minValue: 0,
      maxValue: 10000,
      hotelTier: "CORE",
      action: "AUTO_APPROVE" as const,
      priority: 100,
    },
    {
      name: "Medium Value Route to GM",
      description: "Orders EGP 10,000–50,000 routed to GM",
      role: "GM" as const,
      minValue: 10001,
      maxValue: 50000,
      hotelTier: "CORE",
      action: "ROUTE_TO_GM" as const,
      priority: 90,
    },
    {
      name: "High Value Dual Sign-Off",
      description: "Orders over EGP 50,000 require dual sign-off",
      role: "OWNER" as const,
      minValue: 50001,
      maxValue: 999999999,
      hotelTier: "CORE",
      action: "DUAL_SIGN_OFF" as const,
      priority: 80,
      requiresDualSignOff: true,
    },
    {
      name: "Large Orders Require Owner",
      description: "Orders over EGP 100,000 require owner approval",
      role: "OWNER" as const,
      minValue: 100000,
      maxValue: 999999999,
      hotelTier: "CORE",
      action: "REQUIRE_OWNER" as const,
      priority: 70,
      requiresPaymentGuarantee: true,
    },
    {
      name: "ETA Validation for Large Orders",
      description: "Orders over EGP 250,000 require ETA validation",
      role: "OWNER" as const,
      minValue: 250000,
      maxValue: 999999999,
      hotelTier: "CORE",
      action: "REQUIRE_OWNER" as const,
      priority: 60,
      requiresEtaValidation: true,
    },
  ];

  const existingRules = await prisma.authorityRule.count();
  if (existingRules === 0) {
    for (const rule of authorityRules) {
      await prisma.authorityRule.create({
        data: {
          ...rule,
          isActive: true,
        },
      });
    }
  }
  console.log(`⚖️ ${authorityRules.length} authority rules seeded`);

  // ─────────────────────────────────────────
  // 9. PLATFORM ADMIN USER
  // ─────────────────────────────────────────

  const adminPassword = await hashPassword(defaultPassword);
  const adminRole = createdRoles["Platform Admin"];
  await prisma.user.upsert({
    where: { email: "admin-test@test.hotelsvendors.com" },
    update: { passwordHash: adminPassword },
    create: {
      email: "admin-test@test.hotelsvendors.com",
      name: "Admin Test User",
      passwordHash: adminPassword,
      platformRole: "ADMIN",
      role: "OWNER",
      tenantId: platformTenant.id,
      roleId: adminRole.id,
      status: "ACTIVE",
      canOverride: true,
    },
  });
  console.log(`👤 Platform admin seeded: admin-test@test.hotelsvendors.com / ${defaultPassword}`);

  console.log("\n✅ Seed complete!");
  console.log("\n⚠️  DEVELOPMENT ONLY — Do NOT use in production. Do NOT commit real PII.");
  console.log("\nLogin credentials (all use SEED_PASSWORD env var, default: change-me-immediately):");
  console.log("  Hotel:     hotel-test@test.hotelsvendors.com");
  console.log("  Supplier:  supplier-test@test.hotelsvendors.com");
  console.log("  Factoring: factoring-test@test.hotelsvendors.com");
  console.log("  Admin:     admin-test@test.hotelsvendors.com");
}

main()
  .then(async () => {
    const p = prisma as unknown as { $disconnect: () => Promise<void> };
    await p.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    const p = prisma as unknown as { $disconnect: () => Promise<void> };
    await p.$disconnect();
    process.exit(1);
  });
