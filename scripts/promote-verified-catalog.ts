/**
 * Promote the verified staging catalogue into production without inventing
 * records.  Requires STAGING_DATABASE_URL and DATABASE_URL in the environment.
 * The script is intentionally fail-closed and creates a local rollback plan.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const stagingUrl = process.env.STAGING_DATABASE_URL;
const productionUrl = process.env.DATABASE_URL;
if (!stagingUrl || !productionUrl) throw new Error("STAGING_DATABASE_URL and DATABASE_URL are required");
const approvedMinimum = Number.parseInt(process.env.CATALOG_MINIMUM_APPROVED_PRODUCTS || "5000", 10);
if (!Number.isSafeInteger(approvedMinimum) || approvedMinimum < 1) throw new Error("CATALOG_MINIMUM_APPROVED_PRODUCTS must be a positive integer");

const outDir = path.resolve(process.env.CATALOG_EVIDENCE_DIR || "artifacts/catalog-promotion-20261013");
const quote = (s: string) => `"${s.replaceAll('"', '""')}"`;
const insertRow = async (client: Client, table: string, row: Record<string, unknown>, overrides: Record<string, unknown> = {}) => {
  const merged = { ...row, ...overrides };
  const columns = Object.keys(merged);
  const values = columns.map((c) => merged[c]);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(",");
  await client.query(`insert into ${quote(table)} (${columns.map(quote).join(",")}) values (${placeholders})`, values);
};

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const staging = new Client({ connectionString: stagingUrl });
  const production = new Client({ connectionString: productionUrl });
  await staging.connect();
  await production.connect();
  try {
    const sourceTenant = (await staging.query(`select * from "Tenant" where slug='platform' limit 1`)).rows[0];
    if (!sourceTenant) throw new Error("staging platform tenant not found");
    const suppliers = (await staging.query(`select * from "Supplier" where "tenantId"=$1 and status='ACTIVE' and "isVerified"=true and "deletedAt" is null order by id`, [sourceTenant.id])).rows;
    const products = (await staging.query(`select * from "Product" where "tenantId"=$1 and status='ACTIVE' and "source"<>'FIXTURE' and "deletedAt" is null order by sku`, [sourceTenant.id])).rows;
    if (products.length < approvedMinimum) throw new Error(`staging verified product count is ${products.length}, below approved minimum ${approvedMinimum}`);
    const incompleteProvenance = products.filter((product) => !product.sourceKey || !product.sourceProvider);
    if (incompleteProvenance.length) throw new Error(`staging contains ${incompleteProvenance.length} product records without source provenance`);
    if (!suppliers.length) throw new Error("staging has no verified active suppliers");
    const prodCounts = await production.query(`select (select count(*) from "Product" where status='ACTIVE' and "source"<>'FIXTURE' and "deletedAt" is null)::int as products, (select count(*) from "Supplier" where status='ACTIVE' and "isVerified"=true and "deletedAt" is null)::int as suppliers`);
    if (prodCounts.rows[0].products !== 0 || prodCounts.rows[0].suppliers !== 0) throw new Error(`production already has eligible catalog rows: ${JSON.stringify(prodCounts.rows[0])}`);
    const prodSnapshot = {
      capturedAt: new Date().toISOString(),
      tenants: (await production.query(`select * from "Tenant" order by id`)).rows,
      suppliers: (await production.query(`select * from "Supplier" order by id`)).rows,
      products: (await production.query(`select * from "Product" order by id`)).rows,
      stagingTenantId: sourceTenant.id,
      stagingSupplierCount: suppliers.length,
      stagingProductCount: products.length,
    };
    await fs.writeFile(path.join(outDir, "production-before.json"), JSON.stringify(prodSnapshot, null, 2));
    await production.query("begin");
    let targetTenant = (await production.query(`select * from "Tenant" where slug='platform' limit 1`)).rows[0];
    let createdTenant = false;
    if (!targetTenant) {
      await insertRow(production, "Tenant", sourceTenant);
      targetTenant = sourceTenant;
      createdTenant = true;
    }
    const supplierMap = new Map<string, string>();
    const insertedSupplierIds: string[] = [];
    for (const supplier of suppliers) {
      const existing = (await production.query(`select id from "Supplier" where "taxId"=$1 limit 1`, [supplier.taxId])).rows[0];
      if (existing) { supplierMap.set(supplier.id, existing.id); continue; }
      await insertRow(production, "Supplier", supplier, { tenantId: targetTenant.id });
      supplierMap.set(supplier.id, supplier.id);
      insertedSupplierIds.push(supplier.id);
    }
    const insertedProductIds: string[] = [];
    for (const product of products) {
      const existing = (await production.query(`select id from "Product" where sku=$1 limit 1`, [product.sku])).rows[0];
      if (existing) throw new Error(`production SKU already exists: ${product.sku}`);
      const supplierId = supplierMap.get(product.supplierId);
      if (!supplierId) throw new Error(`supplier mapping missing for ${product.sku}`);
      await insertRow(production, "Product", product, { tenantId: targetTenant.id, supplierId });
      insertedProductIds.push(product.id);
    }
    await production.query("commit");
    const rollback = ["begin;", ...insertedProductIds.map((id) => `delete from "Product" where id=${JSON.stringify(id)};`), ...insertedSupplierIds.map((id) => `delete from "Supplier" where id=${JSON.stringify(id)};`), ...(createdTenant ? [`delete from "Tenant" where id=${JSON.stringify(targetTenant.id)};`] : []), "commit;", ""].join("\n");
    await fs.writeFile(path.join(outDir, "rollback.sql"), rollback);
    await fs.writeFile(path.join(outDir, "promotion-summary.json"), JSON.stringify({ completedAt: new Date().toISOString(), approvedMinimum, sourceTenantId: sourceTenant.id, targetTenantId: targetTenant.id, suppliers: suppliers.length, products: products.length, insertedSuppliers: insertedSupplierIds.length, insertedProducts: insertedProductIds.length, createdTenant }, null, 2));
    console.log(JSON.stringify({ approvedMinimum, sourceTenantId: sourceTenant.id, targetTenantId: targetTenant.id, suppliers: suppliers.length, products: products.length, insertedSuppliers: insertedSupplierIds.length, insertedProducts: insertedProductIds.length, evidenceDir: outDir }));
  } finally { await staging.end(); await production.end(); }
}
main().catch(async (error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
