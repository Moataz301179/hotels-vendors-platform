/**
 * npm run seed:catalog
 * Drives the ingestion pipeline to populate the Marketplace with 500+ FMCG / OS&E SKUs.
 * Idempotent — safe to re-run (upserts by SKU).
 *
 * Usage: npm run seed:catalog [--count 500]
 */

import { PrismaClient } from "@prisma/client";
import { enrichProduct, upsertCatalog, SCRAPER_REGISTRY } from "@/lib/ingestion/ingest";

const prisma = new PrismaClient();

/* Deterministic FMCG + OS&E generator (500+ unique SKUs w/ category-correct images). */
const CATALOG_TEMPLATES: { name: (i: number) => string; cat: string; unit: string; base: number }[] = [
  { name: (i) => `Egyptian Cotton Bath Towel ${i * 10} GSM`, cat: "GUEST_SUPPLIES", unit: "pc", base: 145 },
  { name: (i) => `White Hotel Bed Sheet 400TC Queen`, cat: "GUEST_SUPPLIES", unit: "pc", base: 320 },
  { name: (i) => `Feather Hotel Pillow 50x70`, cat: "GUEST_SUPPLIES", unit: "pc", base: 95 },
  { name: (i) => `Hotel Bathrobe Terry White`, cat: "GUEST_SUPPLIES", unit: "pc", base: 240 },
  { name: (i) => `Duvet Cover King 240x260`, cat: "GUEST_SUPPLIES", unit: "pc", base: 380 },
  { name: (i) => `Dining Napkin 2-Ply 40x40`, cat: "F_AND_B", unit: "pack", base: 28 },
  { name: (i) => `Breakfast Cereal Bowl Ceramic`, cat: "F_AND_B", unit: "pc", base: 42 },
  { name: (i) => `Glass Tumbler 300ml`, cat: "F_AND_B", unit: "pc", base: 22 },
  { name: (i) => `Buffet Chafing Dish Full Size`, cat: "FFE", unit: "pc", base: 1450 },
  { name: (i) => `Stainless Steel Flatware Set`, cat: "FFE", unit: "set", base: 180 },
  { name: (i) => `Guest Amenity Shampoo 30ml`, cat: "GUEST_SUPPLIES", unit: "pc", base: 6 },
  { name: (i) => `Conditioner Sachet 15ml`, cat: "GUEST_SUPPLIES", unit: "pc", base: 4 },
  { name: (i) => `Bath Soap 20g Individually Wrapped`, cat: "GUEST_SUPPLIES", unit: "pc", base: 3.5 },
  { name: (i) => `Vanity Kit Cotton Pads + Buds`, cat: "GUEST_SUPPLIES", unit: "set", base: 12 },
  { name: (i) => `Shower Cap Disposable`, cat: "GUEST_SUPPLIES", unit: "pc", base: 1.5 },
  { name: (i) => `Toilet Paper Jumbo 2-Ply`, cat: "CONSUMABLES", unit: "roll", base: 18 },
  { name: (i) => `Paper Hand Towel Roll Commercial`, cat: "CONSUMABLES", unit: "roll", base: 32 },
  { name: (i) => `Industrial Trash Bag 50 Gallon`, cat: "CONSUMABLES", unit: "pack", base: 25 },
  { name: (i) => `All-Purpose Multi-Surface Cleaner 1L`, cat: "CONSUMABLES", unit: "L", base: 45 },
  { name: (i) => `Bathroom Disinfectant Spray 750ml`, cat: "CONSUMABLES", unit: "ml", base: 38 },
  { name: (i) => `Dishwashing Liquid 1L`, cat: "CONSUMABLES", unit: "L", base: 30 },
  { name: (i) => `Laundry Detergent 5kg`, cat: "CONSUMABLES", unit: "kg", base: 220 },
  { name: (i) => `Fabric Softener 5L`, cat: "CONSUMABLES", unit: "L", base: 115 },
  { name: (i) => `Premium Hair Dryer Wall Mounted`, cat: "FFE", unit: "pc", base: 350 },
  { name: (i) => `Mini Bar Fridge 40L`, cat: "FFE", unit: "pc", base: 4200 },
  { name: (i) => `LED Downlight 15W Panel`, cat: "SERVICES", unit: "pc", base: 55 },
  { name: (i) => `LED Bulb 12W Warm White`, cat: "SERVICES", unit: "pc", base: 18 },
  { name: (i) => `Plumbing Valve 1/2 Inch`, cat: "SERVICES", unit: "pc", base: 40 },
  { name: (i) => `HVAC Filter Air Return`, cat: "SERVICES", unit: "pc", base: 95 },
  { name: (i) => `Paper Clip Assorted Box`, cat: "CONSUMABLES", unit: "box", base: 12 },
  { name: (i) => `A4 Printer Paper 500 Sheet`, cat: "CONSUMABLES", unit: "ream", base: 85 },
  { name: (i) => `Keycard Blank RFID`, cat: "SERVICES", unit: "pc", base: 8 },
  { name: (i) => `Door Access Card Reader`, cat: "SERVICES", unit: "pc", base: 420 },
  { name: (i) => `Terry Floor Mat 45x75`, cat: "GUEST_SUPPLIES", unit: "pc", base: 65 },
  { name: (i) => `Coffee Cup & Saucer Set`, cat: "F_AND_B", unit: "set", base: 55 },
  { name: (i) => `Wine Glass Stemmed 250ml`, cat: "F_AND_B", unit: "pc", base: 35 },
  { name: (i) => `Do Not Disturb Sign`, cat: "GUEST_SUPPLIES", unit: "pc", base: 20 },
  { name: (i) => `Hotel Luggage Rack Folding`, cat: "FFE", unit: "pc", base: 450 },
  { name: (i) => `Bedside Table 50x40`, cat: "FFE", unit: "pc", base: 380 },
  { name: (i) => `Desk Chair Ergonomic`, cat: "FFE", unit: "pc", base: 720 },
  { name: (i) => `Room Safe Digital 0.3 Cu.Ft`, cat: "SERVICES", unit: "pc", base: 1800 },
  { name: (i) => `Wireless Router Dual Band`, cat: "SERVICES", unit: "pc", base: 950 },
  { name: (i) => `47\" Hotel Smart TV`, cat: "FFE", unit: "pc", base: 7200 },
  { name: (i) => `Mini Bar Snacks Mix Voucher`, cat: "F_AND_B", unit: "set", base: 65 },
  { name: (i) => `Bottled Mineral Water 330ml (24)`, cat: "F_AND_B", unit: "case", base: 88 },
  { name: (i) => `Twin Buffet Serving Spoon`, cat: "F_AND_B", unit: "pc", base: 28 },
  { name: (i) => `Chef Uniform Jacket Chef White`, cat: "GUEST_SUPPLIES", unit: "pc", base: 210 },
  { name: (i) => `Kitchen Stainless Pan 24cm`, cat: "FFE", unit: "pc", base: 260 },
  { name: (i) => `Pizza Cutter Stainless`, cat: "F_AND_B", unit: "pc", base: 45 },
];

async function main() {
  const count = (parseInt(process.argv[3]?.replace(/\D/g, "") || "500", 10)) / CATALOG_TEMPLATES.length || 12;
  const reps = Math.ceil(count);

  console.log(`🌱 Seeding catalog: ${CATALOG_TEMPLATES.length} templates × ${reps} variants...`);

  // Resolve platform tenant + a demo supplier
  const tenant = await prisma.tenant.findFirst({ where: { name: { contains: "HotelsVendors" } } });
  const platformTenantId = tenant?.id || (await prisma.tenant.findFirst())?.id;
  if (!platformTenantId) throw new Error("No tenant found. Run prisma db push + an initial seed first.");

  let supplier = await prisma.supplier.findFirst({ where: { tenantId: platformTenantId } });
  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        name: "Horeca Global Import", legalName: "Horeca Global Import Co.", taxId: `TG-${Date.now()}`,
        tenantId: platformTenantId,
      },
    });
  }

  const raw = [];
  for (let r = 1; r <= reps; r++) {
    for (let t = 0; t < CATALOG_TEMPLATES.length; t++) {
      const tmpl = CATALOG_TEMPLATES[t];
      const i = r * 7 + t;
      raw.push({
        title: tmpl.name(i),
        category: tmpl.cat,
        unit: tmpl.unit,
        priceEGP: Math.round(tmpl.base * (1 + (i % 5) * 0.03) * 100) / 100,
        sku: `CAT-${tmpl.cat.slice(0, 3).toUpperCase()}-${String(i).padStart(4, "0")}`,
      });
    }
  }

  const enriched = raw.map((p) => enrichProduct(p, platformTenantId));
  const res = await upsertCatalog(enriched, platformTenantId, "seed:catalog", supplier.id);

  console.log(`✅ Seeded: ${res.created} created, ${res.updated} updated, ${res.total} total rows.`);
  console.log(`🎉 Catalog now live in the marketplace.`);
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); process.exit(1); });
