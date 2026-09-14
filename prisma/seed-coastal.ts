/**
 * Prisma Seed — Red Sea Coastal Market Data
 *
 * Run: npx tsx prisma/seed-coastal.ts
 *
 * Seeds 52 suppliers + 32 hotels across the Egyptian Red Sea corridor.
 * Each supplier gets its own tenant, 5-10 products, and delivery zones.
 * Each hotel gets its own tenant and user account.
 *
 * ⚠️  DEVELOPMENT ONLY — All data is fictional test data.
 */

import { Prisma, ProductCategory } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth";

import suppliersData from "../data/red-sea-suppliers.json";
import hotelsData from "../data/coastal-hotels.json";

const CATEGORY_MAP: Record<string, ProductCategory> = {
  SEAFOOD: "F_AND_B",
  POOL_CHEMICALS: "CONSUMABLES",
  LINENS: "FFE",
  F_AND_B_DRY: "F_AND_B",
  GUEST_AMENITIES: "CONSUMABLES",
  BEACH_FFE: "FFE",
};

const DELIVERY_ZONES = [
  { zone: "Hurghada", minDays: 0, maxDays: 1, fee: 0 },
  { zone: "Makadi Bay", minDays: 0, maxDays: 1, fee: 50 },
  { zone: "Soma Bay", minDays: 1, maxDays: 2, fee: 100 },
  { zone: "Safaga", minDays: 1, maxDays: 2, fee: 150 },
  { zone: "Marsa Alam", minDays: 2, maxDays: 3, fee: 250 },
  { zone: "Sharm El Sheikh", minDays: 2, maxDays: 3, fee: 300 },
  { zone: "Cairo", minDays: 4, maxDays: 6, fee: 500 },
  { zone: "Alexandria", minDays: 5, maxDays: 7, fee: 600 },
];

const SUPPLIER_PRODUCT_TEMPLATES: Record<
  string,
  { name: string; unit: string; price: number; stock: number; minOrder: number }[]
> = {
  SEAFOOD: [
    { name: "Fresh Red Sea Grouper", unit: "kg", price: 280, stock: 500, minOrder: 10 },
    { name: "Royal Red Shrimp", unit: "kg", price: 450, stock: 300, minOrder: 5 },
    { name: "Sea Bass Fillet", unit: "kg", price: 320, stock: 400, minOrder: 10 },
    { name: "Frozen Squid Rings", unit: "kg", price: 180, stock: 600, minOrder: 10 },
    { name: "Fresh Sardines", unit: "kg", price: 85, stock: 800, minOrder: 20 },
    { name: "Smoked Salmon Portion", unit: "piece", price: 120, stock: 200, minOrder: 20 },
    { name: "Tuna Steak Sashimi Grade", unit: "kg", price: 520, stock: 150, minOrder: 5 },
    { name: "Calamari Whole", unit: "kg", price: 160, stock: 450, minOrder: 10 },
  ],
  POOL_CHEMICALS: [
    { name: "Chlorine Granules 45kg", unit: "drum", price: 1200, stock: 100, minOrder: 2 },
    { name: "pH Plus 25kg", unit: "bag", price: 450, stock: 150, minOrder: 4 },
    { name: "Algaecide Concentrate 20L", unit: "drum", price: 850, stock: 80, minOrder: 2 },
    { name: "Pool Test Kit (500 strips)", unit: "box", price: 320, stock: 200, minOrder: 5 },
    { name: "Clarifier 5L", unit: "bottle", price: 280, stock: 180, minOrder: 6 },
    { name: "Stabilizer 10kg", unit: "bag", price: 380, stock: 120, minOrder: 4 },
  ],
  LINENS: [
    { name: "Egyptian Cotton Bath Towel", unit: "piece", price: 180, stock: 2000, minOrder: 50 },
    { name: "King Bed Sheet Set 400TC", unit: "set", price: 650, stock: 800, minOrder: 20 },
    { name: "Pool Towel 70x140cm", unit: "piece", price: 120, stock: 3000, minOrder: 100 },
    { name: "Duvet Cover King", unit: "piece", price: 480, stock: 500, minOrder: 20 },
    { name: "Bathrobe Terry 350gsm", unit: "piece", price: 320, stock: 600, minOrder: 30 },
    { name: "Pillow Case Pair 400TC", unit: "pair", price: 140, stock: 1500, minOrder: 50 },
    { name: "Table Cloth 300x300cm", unit: "piece", price: 380, stock: 400, minOrder: 20 },
  ],
  F_AND_B_DRY: [
    { name: "Premium Egyptian Rice 10kg", unit: "bag", price: 280, stock: 500, minOrder: 10 },
    { name: "Extra Virgin Olive Oil 5L", unit: "bottle", price: 450, stock: 300, minOrder: 6 },
    { name: "All-Purpose Flour 50kg", unit: "bag", price: 620, stock: 400, minOrder: 5 },
    { name: "Basmati Rice 10kg", unit: "bag", price: 350, stock: 350, minOrder: 10 },
    { name: "Sugar Icumsa 45 50kg", unit: "bag", price: 580, stock: 250, minOrder: 5 },
    { name: "Sunflower Oil 18L", unit: "tin", price: 520, stock: 200, minOrder: 4 },
    { name: "Pasta Penne 5kg", unit: "carton", price: 180, stock: 600, minOrder: 10 },
    { name: "Canned Tomatoes 2.5kg x6", unit: "carton", price: 240, stock: 400, minOrder: 10 },
    { name: "Spice Mix Shawarma 5kg", unit: "bag", price: 380, stock: 150, minOrder: 5 },
  ],
  GUEST_AMENITIES: [
    { name: "Shampoo 30ml Bottle", unit: "piece", price: 12, stock: 10000, minOrder: 200 },
    { name: "Conditioner 30ml Bottle", unit: "piece", price: 12, stock: 10000, minOrder: 200 },
    { name: "Body Lotion 30ml", unit: "piece", price: 14, stock: 8000, minOrder: 200 },
    { name: "Shower Gel 30ml", unit: "piece", price: 11, stock: 12000, minOrder: 200 },
    { name: "Dental Kit", unit: "piece", price: 8, stock: 15000, minOrder: 500 },
    { name: "Shaving Kit", unit: "piece", price: 15, stock: 5000, minOrder: 200 },
    { name: "Slipper Pair", unit: "pair", price: 18, stock: 8000, minOrder: 200 },
    { name: "Sewing Kit", unit: "piece", price: 5, stock: 20000, minOrder: 500 },
  ],
  BEACH_FFE: [
    { name: "Sun Lounger Teak", unit: "piece", price: 3200, stock: 100, minOrder: 5 },
    { name: "Parasol 3m Aluminum", unit: "piece", price: 1800, stock: 80, minOrder: 5 },
    { name: "Outdoor Side Table", unit: "piece", price: 900, stock: 120, minOrder: 10 },
    { name: "Lifeguard Tower", unit: "piece", price: 15000, stock: 10, minOrder: 1 },
    { name: "Beach Cabana Frame", unit: "piece", price: 8500, stock: 15, minOrder: 2 },
    { name: "Pool Chair Polypropylene", unit: "piece", price: 650, stock: 200, minOrder: 10 },
    { name: "Outdoor Cushion Set", unit: "set", price: 480, stock: 150, minOrder: 10 },
    { name: "Beach Towel Clip Set", unit: "set", price: 120, stock: 500, minOrder: 20 },
  ],
};

function generateSKU(supplierIdx: number, category: string, productIdx: number): string {
  const catPrefix = category.substring(0, 3).toUpperCase();
  const sIdx = String(supplierIdx).padStart(3, "0");
  const pIdx = String(productIdx).padStart(2, "0");
  return `RS-${catPrefix}-${sIdx}-${pIdx}`;
}

function pickProducts(category: string, count: number) {
  const templates = SUPPLIER_PRODUCT_TEMPLATES[category] || SUPPLIER_PRODUCT_TEMPLATES["SEAFOOD"];
  const shuffled = [...templates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, templates.length));
}

function mapCategory(cat: string): ProductCategory {
  return CATEGORY_MAP[cat] || "F_AND_B";
}

function mapSupplierTier(tier: string): "CORE" | "PREMIER" | "COASTAL" | "VERIFIED" {
  if (["CORE", "PREMIER", "COASTAL", "VERIFIED"].includes(tier)) {
    return tier as "CORE" | "PREMIER" | "COASTAL" | "VERIFIED";
  }
  return "CORE";
}

function mapSupplierType(type: string): "FACTORY" | "WHOLESALER" | "RETAILER" {
  if (["FACTORY", "WHOLESALER", "RETAILER"].includes(type)) {
    return type as "FACTORY" | "WHOLESALER" | "RETAILER";
  }
  return "WHOLESALER";
}

function mapHotelTier(tier: string): "CORE" | "PREMIER" | "COASTAL" {
  if (["CORE", "PREMIER", "COASTAL"].includes(tier)) {
    return tier as "CORE" | "PREMIER" | "COASTAL";
  }
  return "COASTAL";
}

async function main() {
  console.log("🌊 Starting Red Sea coastal market seed...\n");

  // Ensure platform tenant exists
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

  // Ensure roles exist
  const ownerRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: platformTenant.id, name: "Owner" } },
    update: {},
    create: { name: "Owner", tenantId: platformTenant.id, isGlobal: false },
  });

  const supplierManagerRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: platformTenant.id, name: "Supplier Manager" } },
    update: {},
    create: { name: "Supplier Manager", tenantId: platformTenant.id, isGlobal: false },
  });

  const hotelManagerRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: platformTenant.id, name: "Hotel Manager" } },
    update: {},
    create: { name: "Hotel Manager", tenantId: platformTenant.id, isGlobal: false },
  });

  const defaultPassword = process.env.SEED_PASSWORD || "coastal-2026";
  const passwordHash = await hashPassword(defaultPassword);

  // ─── SUPPLIERS ──────────────────────────────────────────────
  console.log(`\n📦 Seeding ${suppliersData.length} suppliers...\n`);

  let supplierCount = 0;
  let productCount = 0;

  for (const [idx, s] of suppliersData.entries()) {
    const slug = `supplier-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")}`;
    const tenantSlug = `coastal-supplier-${idx}`;
    const category = CATEGORY_MAP[s.category] || "F_AND_B";

    // Create tenant
    const tenant = await prisma.tenant.upsert({
      where: { slug: tenantSlug },
      update: {},
      create: {
        name: s.name,
        slug: tenantSlug,
        type: "SUPPLIER",
        status: "ACTIVE",
        taxId: `TENANT-SUP-${String(idx).padStart(4, "0")}`,
      },
    });

    // Create supplier
    const supplier = await prisma.supplier.upsert({
      where: { taxId: s.taxId },
      update: {},
      create: {
        name: s.name,
        legalName: s.legalName,
        taxId: s.taxId,
        commercialReg: s.commercialReg,
        city: s.city,
        governorate: s.governorate,
        phone: s.phone,
        email: s.email,
        description: s.description,
        certifications: s.certifications,
        status: "ACTIVE",
        tier: mapSupplierTier(s.tier),
        type: mapSupplierType(s.type),
        isVerified: s.tier === "VERIFIED" || s.tier === "PREMIER",
        returnPolicyDays: s.returnPolicyDays,
        rating: s.rating,
        reviewCount: s.reviewCount,
        tenantId: tenant.id,
      },
    });

    // Create user for supplier
    const userEmail = `procurement+${idx}@${s.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.eg`;
    try {
      await prisma.user.upsert({
        where: { email: userEmail },
        update: {},
        create: {
          email: userEmail,
          name: `${s.name} Procurement Manager`,
          passwordHash,
          platformRole: "SUPPLIER",
          role: "OWNER",
          tenantId: tenant.id,
          roleId: ownerRole.id,
          supplierId: supplier.id,
          status: "ACTIVE",
        },
      });
    } catch {
      // skip duplicate email errors
    }

    // Create products (5-8 per supplier)
    const productCountForSupplier = 5 + (idx % 4);
    const products = pickProducts(s.category, productCountForSupplier);

    for (let pIdx = 0; pIdx < products.length; pIdx++) {
      const p = products[pIdx];
      const sku = generateSKU(idx, s.category, pIdx);

      try {
        await prisma.product.upsert({
          where: { sku },
          update: {},
          create: {
            sku,
            name: p.name,
            description: `${p.name} — supplied by ${s.name}`,
            category,
            subcategory: s.category,
            unitPrice: p.price * (0.9 + Math.random() * 0.2),
            currency: "EGP",
            stockQuantity: p.stock,
            minOrderQty: p.minOrder,
            leadTimeDays: s.leadTimeDays,
            unitOfMeasure: p.unit,
            status: "ACTIVE",
            supplierId: supplier.id,
            tenantId: tenant.id,
          },
        });
        productCount++;
      } catch {
        // skip duplicate SKU
      }
    }

    // Create delivery zones (subset based on location)
    const relevantZones = DELIVERY_ZONES.filter((z) => {
      if (s.city === "Hurghada") return true;
      if (s.city === "Sharm El Sheikh" || s.governorate === "South Sinai") return true;
      if (s.city === "Marsa Alam") return !["Hurghada", "Makadi Bay", "Soma Bay"].includes(z.zone) || true;
      return true;
    });

    for (const z of relevantZones.slice(0, 5)) {
      await prisma.deliveryZone.create({
        data: {
          zone: z.zone,
          minDays: z.minDays,
          maxDays: z.maxDays,
          fee: z.fee,
          supplierId: supplier.id,
          tenantId: tenant.id,
        },
      });
    }

    supplierCount++;
    if ((idx + 1) % 10 === 0) {
      console.log(`  ✅ ${idx + 1}/${suppliersData.length} suppliers seeded...`);
    }
  }

  console.log(`  🏭 ${supplierCount} suppliers seeded with ${productCount} products\n`);

  // ─── HOTELS ──────────────────────────────────────────────────
  console.log(`🏨 Seeding ${hotelsData.length} hotels...\n`);

  let hotelCount = 0;

  for (const [idx, h] of hotelsData.entries()) {
    const tenantSlug = `coastal-hotel-${idx}`;
    const chainSlug = h.chainAffiliation.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Create tenant
    const tenant = await prisma.tenant.upsert({
      where: { slug: tenantSlug },
      update: {},
      create: {
        name: h.name,
        slug: tenantSlug,
        type: "HOTEL_GROUP",
        status: "ACTIVE",
        taxId: `TENANT-HOT-${String(idx).padStart(4, "0")}`,
      },
    });

    // Create hotel
    const hotel = await prisma.hotel.upsert({
      where: { taxId: h.taxId },
      update: {},
      create: {
        name: h.name,
        legalName: h.legalName,
        taxId: h.taxId,
        commercialReg: h.commercialReg,
        city: h.city,
        governorate: h.governorate,
        phone: h.phone,
        email: h.email,
        starRating: h.starRating,
        roomCount: h.roomCount,
        tier: mapHotelTier(h.tier),
        creditLimit: h.annualProcurementBudget * 0.15,
        creditUsed: 0,
        status: "ACTIVE",
        tenantId: tenant.id,
      },
    });

    // Create hotel user
    const userEmail = `procurement+${idx}@${chainSlug}.eg`;
    try {
      await prisma.user.upsert({
        where: { email: userEmail },
        update: {},
        create: {
          email: userEmail,
          name: `${h.name} Procurement Manager`,
          passwordHash,
          platformRole: "HOTEL",
          role: "OWNER",
          tenantId: tenant.id,
          roleId: ownerRole.id,
          hotelId: hotel.id,
          status: "ACTIVE",
        },
      });
    } catch {
      // skip duplicate email errors
    }

    hotelCount++;
    if ((idx + 1) % 10 === 0) {
      console.log(`  ✅ ${idx + 1}/${hotelsData.length} hotels seeded...`);
    }
  }

  console.log(`  🏨 ${hotelCount} hotels seeded\n`);

  // ─── SUMMARY ──────────────────────────────────────────────────
  console.log("─".repeat(60));
  console.log("🌊 Red Sea Coastal Market Seed Complete!");
  console.log("─".repeat(60));
  console.log(`  Suppliers:  ${supplierCount}`);
  console.log(`  Products:   ${productCount}`);
  console.log(`  Hotels:     ${hotelCount}`);
  console.log(`  Delivery Zones: ${supplierCount * 5}`);
  console.log("─".repeat(60));
  console.log(`\n⚠️  DEVELOPMENT ONLY — Do NOT use in production.`);
  console.log(`\nLogin credentials (default: coastal-2026):`);
  console.log(`  Supplier users: procurement+<idx>@<name>.eg`);
  console.log(`  Hotel users:    procurement+<idx>@<chain>.eg`);
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
