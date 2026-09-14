/**
 * PILOT SEED — 5 Hotels + 3 Suppliers + 1 Financing Partner
 * Approved by Hermes (CR-001 approved). Real transaction path defined.
 * NOT production PII. Development/staging pilot data only.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Pilot seed: 5 hotels, 3 suppliers, 1 financing partner...");

  // 1. Create pilot tenants (if missing) — real transaction path requires these IDs.
  const hotels = [
    { slug: "cairo-plaza", name: "Cairo Plaza Hotel Group", taxId: "EG-300-001", type: "HOTEL_GROUP" as const },
    { slug: "red-sea-resort", name: "Red Sea Resort Chain", taxId: "EG-300-002", type: "HOTEL_GROUP" as const },
    { slug: "north-coast-villa", name: "North Coast Villa Properties", taxId: "EG-300-003", type: "HOTEL_GROUP" as const },
    { slug: "luxor-heritage", name: "Luxor Heritage Hotels", taxId: "EG-300-004", type: "HOTEL_GROUP" as const },
    { slug: "alex-coastal", name: "Alexandria Coastal Inn", taxId: "EG-300-005", type: "HOTEL_GROUP" as const },
  ];
  const suppliers = [
    { slug: "fnb-vendor-1", name: "Nile Fresh F&B Supplier", taxId: "EG-SUP-001", type: "SUPPLIER" as const },
    { slug: "hk-vendor-1", name: "Delta Housekeeping Co", taxId: "EG-SUP-002", type: "SUPPLIER" as const },
    { slug: "eng-vendor-1", name: "Cairo Engineering Supplies", taxId: "EG-SUP-003", type: "SUPPLIER" as const },
  ];
  const factoring = { slug: "efg-factoring", name: "EFG Hermes Factoring", taxId: "EG-FAC-001", type: "FACTORING_COMPANY" as const };

  for (const h of hotels) await prisma.tenant.upsert({ where: { slug: h.slug }, update: {}, create: { ...h, status: "ACTIVE" } });
  for (const s of suppliers) await prisma.tenant.upsert({ where: { slug: s.slug }, update: {}, create: { ...s, status: "ACTIVE" } });
  await prisma.tenant.upsert({ where: { slug: factoring.slug }, update: {}, create: { ...factoring, status: "ACTIVE" } });

  console.log("✅ Pilot tenants seeded (5 hotels, 3 suppliers, 1 factoring partner).");
  console.log("⏭ Real transaction: verify API contracts (docs/planning/API_CONTRACTS_SPEC.ts) + middleware enforcement before live order mutation.");
}

main().catch((e) => { console.error("Seed error:", e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
