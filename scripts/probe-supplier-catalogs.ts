/**
 * Read-only probe for the reviewed public supplier source register.
 *
 * It does not create candidates, suppliers, products, or offers. A LIVE result
 * only means a public endpoint exposed parseable product records at probe time;
 * each result still needs evidence review before it enters the intake queue.
 *
 * Run: npx tsx scripts/probe-supplier-catalogs.ts
 */
import register from '../data/staging/egypt-hospitality-supplier-register.v1.json';
import { discoverMany } from '@/lib/sourcing/catalog-discovery';

async function main() {
  const inputs = register.records.map((record) => ({
    name: record.name,
    domain: new URL(record.website).hostname.replace(/^www\./, ''),
  }));
  const results = await discoverMany(inputs);
  console.log(JSON.stringify({
    observedAt: new Date().toISOString(),
    sourceRegisterVersion: register.version,
    sourceRegisterStatus: register.status,
    results,
    summary: {
      probed: results.length,
      livePublicCatalogs: results.filter((result) => result.status === 'LIVE').length,
      blocked: results.filter((result) => result.status === 'BLOCKED').length,
      noPublicCatalog: results.filter((result) => result.status === 'NONE').length,
    },
  }, null, 2));
}

void main();
