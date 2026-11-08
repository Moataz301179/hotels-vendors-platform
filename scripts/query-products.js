// Query all visible products from the database
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load DATABASE_URL from .env.local
const envPath = '/Users/Moatazi/hotels-vendors-new/.env.local';
const loaded = dotenv.config({ path: envPath });
if (loaded.error) {
  console.error('dotenv error:', loaded.error.message);
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    // Query all products that are visible (status = PUBLISHED)
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        sku: true,
        name: true,
        category: true,
        subcategory: true,
        status: true,
        source: true,
        supplierId: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        images: true,
      },
    });

    console.log(`Total products (not deleted): ${products.length}`);

    // Group by status
    const byStatus = {};
    for (const p of products) {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    }
    console.log('By status:', JSON.stringify(byStatus));

    // Group by source
    const bySource = {};
    for (const p of products) {
      bySource[p.source] = (bySource[p.source] || 0) + 1;
    }
    console.log('By source:', JSON.stringify(bySource));

    // Products with SKU (from egyptian-market-v2.json)
    const withSku = products.filter(p => p.sku);
    console.log(`\nProducts WITH sku: ${withSku.length}`);
    for (const p of withSku) {
      console.log(`  ${p.id} | ${p.sku} | ${p.name} | ${p.category} | ${p.status} | img=${p.images ? 'yes' : 'no'}`);
    }

    // Products without SKU (odd IDs)
    const withoutSku = products.filter(p => !p.sku);
    console.log(`\nProducts WITHOUT sku: ${withoutSku.length}`);
    for (const p of withoutSku) {
      console.log(`  ${p.id} | [no-sku] | ${p.name} | ${p.category} | ${p.status} | img=${p.images ? 'yes' : 'no'}`);
    }

    // Summary
    const withSkuSet = new Set(withSku.map(p => p.sku));
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total products: ${products.length}`);
    console.log(`Products with SKU (bad batch from egyptian-market-v2.json): ${withSku.length}`);
    console.log(`Products without SKU (bad batch "others"): ${withoutSku.length}`);
    console.log(`Total bad batch: ${withSku.length + withoutSku.length}`);
    console.log(`Pre-existing products: ${products.length - withSku.length - withoutSku.length}`);
    console.log(`\nNote: pre-existing = 0 (all 109 are either JSON products or odd-SKU "others")`);
  } catch (err) {
    console.error('ERROR:', err.message);
    console.error(err.stack);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
