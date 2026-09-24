// Test 2: Cost Engine — Pure detection logic (no Prisma/DB needed)
// We replicate the engine's algorithms with in-memory data

console.log("=== TEST 2: Cost Engine Logic (Direct) ===");

interface SpendRecord {
  productId: string;
  unitPrice: number;
  quantity: number;
  normalizedDate: Date;
  supplierId?: string;
  supplierName?: string;
  category?: string;
  totalAmount?: number;
}

// Sample data: Beer with 20% price increase over 4 months
const beerRecords: SpendRecord[] = [
  { productId: "P1", unitPrice: 25, quantity: 100, normalizedDate: new Date("2024-01-15"), supplierId: "S1", supplierName: "SupplierA", category: "F&B", totalAmount: 2500 },
  { productId: "P1", unitPrice: 26, quantity: 100, normalizedDate: new Date("2024-02-15"), supplierId: "S1", supplierName: "SupplierA", category: "F&B", totalAmount: 2600 },
  { productId: "P1", unitPrice: 28, quantity: 100, normalizedDate: new Date("2024-03-15"), supplierId: "S1", supplierName: "SupplierA", category: "F&B", totalAmount: 2800 },
  { productId: "P1", unitPrice: 30, quantity: 100, normalizedDate: new Date("2024-04-15"), supplierId: "S1", supplierName: "SupplierA", category: "F&B", totalAmount: 3000 },
];

// Shampoo: same price, frequent ordering
const shampooRecords: SpendRecord[] = [
  { productId: "P2", unitPrice: 8, quantity: 500, normalizedDate: new Date("2024-01-10"), supplierId: "S1", supplierName: "SupplierA", category: "GUEST_SUPPLIES", totalAmount: 4000 },
  { productId: "P2", unitPrice: 8, quantity: 500, normalizedDate: new Date("2024-01-25"), supplierId: "S1", supplierName: "SupplierA", category: "GUEST_SUPPLIES", totalAmount: 4000 },
  { productId: "P2", unitPrice: 8, quantity: 500, normalizedDate: new Date("2024-02-10"), supplierId: "S1", supplierName: "SupplierA", category: "GUEST_SUPPLIES", totalAmount: 4000 },
  { productId: "P2", unitPrice: 8, quantity: 500, normalizedDate: new Date("2024-02-25"), supplierId: "S1", supplierName: "SupplierA", category: "GUEST_SUPPLIES", totalAmount: 4000 },
  { productId: "P2", unitPrice: 8, quantity: 500, normalizedDate: new Date("2024-03-10"), supplierId: "S1", supplierName: "SupplierA", category: "GUEST_SUPPLIES", totalAmount: 4000 },
  { productId: "P2", unitPrice: 8, quantity: 500, normalizedDate: new Date("2024-03-25"), supplierId: "S1", supplierName: "SupplierA", category: "GUEST_SUPPLIES", totalAmount: 4000 },
];

// Water: small increase, single supplier
const waterRecords: SpendRecord[] = [
  { productId: "P3", unitPrice: 5, quantity: 200, normalizedDate: new Date("2024-01-20"), supplierId: "S2", supplierName: "SupplierB", category: "F&B", totalAmount: 1000 },
  { productId: "P3", unitPrice: 5.5, quantity: 200, normalizedDate: new Date("2024-02-20"), supplierId: "S2", supplierName: "SupplierB", category: "F&B", totalAmount: 1100 },
  { productId: "P3", unitPrice: 5.5, quantity: 200, normalizedDate: new Date("2024-03-20"), supplierId: "S2", supplierName: "SupplierB", category: "F&B", totalAmount: 1100 },
  { productId: "P3", unitPrice: 6, quantity: 200, normalizedDate: new Date("2024-04-20"), supplierId: "S2", supplierName: "SupplierB", category: "F&B", totalAmount: 1200 },
];

const allRecords = [...beerRecords, ...shampooRecords, ...waterRecords];

// ─── 2a. PRICE DRIFT DETECTION ───
console.log("\n--- 2a. Price Drift Detection ---");
function detectPriceDrift(records: SpendRecord[]): number {
  const byProduct = new Map<string, SpendRecord[]>();
  for (const r of records) {
    if (!byProduct.has(r.productId)) byProduct.set(r.productId, []);
    byProduct.get(r.productId)!.push(r);
  }

  let detected = 0;
  for (const [productId, productRecords] of byProduct) {
    if (productRecords.length < 2) continue;
    const firstDate = productRecords[0].normalizedDate;
    const lastDate = productRecords[productRecords.length - 1].normalizedDate;
    const monthsDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + (lastDate.getMonth() - firstDate.getMonth());
    if (monthsDiff < 3) continue;

    const quarterLen = Math.max(1, Math.floor(productRecords.length / 4));
    const earlyRecords = productRecords.slice(0, quarterLen);
    const lateRecords = productRecords.slice(-quarterLen);

    const earlyAvg = earlyRecords.reduce((s, r) => s + r.unitPrice, 0) / earlyRecords.length;
    const lateAvg = lateRecords.reduce((s, r) => s + r.unitPrice, 0) / lateRecords.length;

    if (earlyAvg <= 0) continue;
    const increasePct = ((lateAvg - earlyAvg) / earlyAvg) * 100;

    if (increasePct > 15) {
      detected++;
      const totalQty = productRecords.reduce((s, r) => s + r.quantity, 0) || 1;
      const annualQtyEstimate = totalQty * (12 / Math.max(monthsDiff, 1));
      const potentialImpact = (lateAvg - earlyAvg) * annualQtyEstimate;
      console.log(`  ✓ PRICE_DRIFT detected: ${productId} (+${increasePct.toFixed(1)}%) Potential: ${potentialImpact.toFixed(2)} EGP`);
    }
  }
  return detected;
}

const priceDriftCount = detectPriceDrift(allRecords);
console.log(`✓ Total price drift opportunities: ${priceDriftCount}`);
if (priceDriftCount >= 2) console.log("✓ PASS: Beer (20%) and Water (20%) detected");
else console.log("✗ FAIL: Expected 2 price drift detections");

// ─── 2b. SUPPLIER CONCENTRATION DETECTION ───
console.log("\n--- 2b. Supplier Concentration Detection ---");
function detectSupplierConcentration(records: SpendRecord[]): number {
  const byCategory = new Map<string, Map<string, number>>();
  for (const r of records) {
    const cat = r.category || "unknown";
    if (!byCategory.has(cat)) byCategory.set(cat, new Map());
    const supplierKey = r.supplierId || r.supplierName || "unknown";
    const current = byCategory.get(cat)!.get(supplierKey) || 0;
    byCategory.get(cat)!.set(supplierKey, current + (r.totalAmount || 0));
  }

  let detected = 0;
  for (const [category, supplierSpend] of byCategory) {
    const totalSpend = Array.from(supplierSpend.values()).reduce((a, b) => a + b, 0);
    if (totalSpend <= 0) continue;
    for (const [supplierKey, spend] of supplierSpend) {
      const concentrationPct = (spend / totalSpend) * 100;
      if (concentrationPct > 60) {
        detected++;
        console.log(`  ✓ SUPPLIER_CONCENTRATION: ${category} (${concentrationPct.toFixed(1)}% with ${supplierKey})`);
      }
    }
  }
  return detected;
}

const supplierConcCount = detectSupplierConcentration(allRecords);
console.log(`✓ Total supplier concentration: ${supplierConcCount}`);

// ─── 2c. VOLUME OPPORTUNITY DETECTION ───
console.log("\n--- 2c. Volume Opportunity Detection ---");
function detectVolumeOpportunity(records: SpendRecord[]): number {
  const byProduct = new Map<string, SpendRecord[]>();
  for (const r of records) {
    if (!byProduct.has(r.productId)) byProduct.set(r.productId, []);
    byProduct.get(r.productId)!.push(r);
  }

  let detected = 0;
  for (const [productId, productRecords] of byProduct) {
    if (productRecords.length < 3) continue;
    const quantities = productRecords.map(r => r.quantity).filter(q => q > 0);
    if (quantities.length < 3) continue;

    const avgQty = quantities.reduce((a, b) => a + b, 0) / quantities.length;
    const maxQty = Math.max(...quantities);
    const frequency = productRecords.length;
    const price = productRecords[productRecords.length - 1].unitPrice;
    if (price <= 0) continue;

    const consolidationRatio = avgQty / maxQty;
    if (consolidationRatio < 0.4 && frequency >= 3) {
      detected++;
      const annualQty = quantities.reduce((a, b) => a + b, 0) * (12 / Math.max(
        (productRecords[productRecords.length - 1].normalizedDate.getTime() - productRecords[0].normalizedDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
        1
      ));
      const potentialImpact = annualQty * price * 0.08;
      console.log(`  ✓ VOLUME_OPPORTUNITY: ${productId} (${frequency} orders, avg ${avgQty} units)`);
    }
  }
  return detected;
}

const volumeCount = detectVolumeOpportunity(allRecords);
console.log(`✓ Total volume opportunities: ${volumeCount}`);

// ─── 2d. DUPLICATE PURCHASE DETECTION ───
console.log("\n--- 2d. Duplicate Purchase Detection ---");
function detectDuplicatePurchases(records: SpendRecord[]): number {
  const byProductMonth = new Map<string, SpendRecord[]>();
  for (const r of records) {
    const monthKey = `${r.normalizedDate.getFullYear()}-${String(r.normalizedDate.getMonth() + 1).padStart(2, "0")}`;
    const key = `${r.productId}:${monthKey}`;
    if (!byProductMonth.has(key)) byProductMonth.set(key, []);
    byProductMonth.get(key)!.push(r);
  }

  const productMonthCounts = new Map<string, number>();
  for (const [, monthRecords] of byProductMonth) {
    if (monthRecords.length >= 3) {
      const pid = monthRecords[0].productId;
      productMonthCounts.set(pid, (productMonthCounts.get(pid) || 0) + 1);
    }
  }

  let detected = 0;
  for (const [productId, monthsWithDuplicates] of productMonthCounts) {
    if (monthsWithDuplicates < 2) continue;
    detected++;
    console.log(`  ✓ DUPLICATE/CONSOLIDATION: ${productId} (${monthsWithDuplicates} months with 3+ orders)`);
  }
  return detected;
}

const duplicateCount = detectDuplicatePurchases(allRecords);
console.log(`✓ Total duplicate/consolidation opportunities: ${duplicateCount}`);

console.log(`\n=== SUMMARY ===`);
console.log(`Price drift: ${priceDriftCount}`);
console.log(`Supplier concentration: ${supplierConcCount}`);
console.log(`Volume opportunity: ${volumeCount}`);
console.log(`Duplicate purchases: ${duplicateCount}`);
console.log(`Total detected: ${priceDriftCount + supplierConcCount + volumeCount + duplicateCount}`);
