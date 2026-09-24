/**
 * lib/ingest/normalizer.ts
 * Normalize parsed procurement rows into canonical SpendRecord format.
 * Resolves suppliers/products by fuzzy matching, maps categories,
 * and flags unresolvable records.
 */

import { prisma } from "../prisma";
import { RawSpendRow } from "./parser";

export type SourceType = "CSV" | "EXCEL" | "MANUAL" | "INVOICE";
export type ResolutionStatus = "RESOLVED" | "PARTIAL" | "UNRESOLVED";

export interface NormalizedSpendRecord {
  tenantId: string;
  sourceType: SourceType;
  rawData: Record<string, unknown>;
  normalizedDate: Date | null;
  supplierId: string | null;
  supplierName: string;
  productId: string | null;
  productName: string | null;
  sku: string | null;
  category: string | null;
  quantity: number | null;
  unitPrice: number | null;
  totalAmount: number | null;
  poNumber: string | null;
  invoiceNumber: string | null;
  resolutionStatus: ResolutionStatus;
  resolutionNotes: string[];
}

interface NormalizerContext {
  tenantId: string;
  suppliers: Array<{ id: string; name: string; legalName: string | null }>;
  products: Array<{ id: string; name: string; sku: string; category: string }>;
}

/**
 * Build fuzzy match score between two strings (0-1).
 */
function fuzzyScore(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();

  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  // Token overlap
  const tokens1 = s1.split(/\s+/);
  const tokens2 = s2.split(/\s+/);
  let matches = 0;
  for (const t of tokens1) {
    if (tokens2.includes(t)) matches++;
  }
  return matches / Math.max(tokens1.length, tokens2.length);
}

/**
 * Resolve supplier by name fuzzy matching.
 */
function resolveSupplier(
  name: string | null,
  ctx: NormalizerContext
): { id: string | null; score: number } {
  if (!name) return { id: null, score: 0 };

  let bestMatch: { id: string; score: number } | null = null;

  for (const supplier of ctx.suppliers) {
    const nameScore = fuzzyScore(name, supplier.name);
    const legalNameScore = supplier.legalName
      ? fuzzyScore(name, supplier.legalName)
      : 0;
    const score = Math.max(nameScore, legalNameScore);

    if (score >= 0.75 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { id: supplier.id, score };
    }
  }

  return bestMatch
    ? { id: bestMatch.id, score: bestMatch.score }
    : { id: null, score: 0 };
}

/**
 * Resolve product by SKU or name fuzzy matching.
 */
function resolveProduct(
  sku: string | null,
  name: string | null,
  ctx: NormalizerContext
): { id: string | null; score: number } {
  let bestMatch: { id: string; score: number } | null = null;

  // SKU match is highest priority
  if (sku) {
    for (const product of ctx.products) {
      if (product.sku.toLowerCase() === sku.toLowerCase()) {
        return { id: product.id, score: 1 };
      }
    }
  }

  // Name match
  if (name) {
    for (const product of ctx.products) {
      const score = fuzzyScore(name, product.name);
      if (score >= 0.75 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { id: product.id, score };
      }
    }
  }

  return bestMatch
    ? { id: bestMatch.id, score: bestMatch.score }
    : { id: null, score: 0 };
}

/**
 * Map category string to ProductCategory enum value.
 */
function mapCategory(
  rawCategory: string | null
): { category: string | null; mapped: boolean } {
  if (!rawCategory) return { category: null, mapped: false };

  const normalized = rawCategory.toUpperCase().replace(/[\s\-&]+/g, "_");

  // Direct match
  const validCategories = [
    "F_AND_B",
    "CONSUMABLES",
    "GUEST_SUPPLIES",
    "FFE",
    "SERVICES",
  ];

  if (validCategories.includes(normalized)) {
    return { category: normalized, mapped: true };
  }

  // Fuzzy map common variations
  const categoryMap: Record<string, string> = {
    FOOD: "F_AND_B",
    BEVERAGE: "F_AND_B",
    FOOD_AND_BEVERAGE: "F_AND_B",
    FNB: "F_AND_B",
    LINEN: "GUEST_SUPPLIES",
    TOILETRIES: "GUEST_SUPPLIES",
    AMENITIES: "GUEST_SUPPLIES",
    CLEANING: "CONSUMABLES",
    CHEMICALS: "CONSUMABLES",
    OFFICE_SUPPLIES: "CONSUMABLES",
    FURNITURE: "FFE",
    EQUIPMENT: "FFE",
    FIXTURES: "FFE",
    MAINTENANCE: "SERVICES",
    REPAIR: "SERVICES",
    PEST_CONTROL: "SERVICES",
    LAUNDRY: "SERVICES",
    SECURITY: "SERVICES",
  };

  if (categoryMap[normalized]) {
    return { category: categoryMap[normalized], mapped: true };
  }

  // Try partial match
  for (const [key, value] of Object.entries(categoryMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return { category: value, mapped: true };
    }
  }

  return { category: rawCategory, mapped: false };
}

/**
 * Load tenant context (suppliers + products) for resolution.
 */
async function loadContext(tenantId: string): Promise<NormalizerContext> {
  const [suppliers, products] = await Promise.all([
    prisma.supplier.findMany({
      where: { tenantId },
      select: { id: true, name: true, legalName: true },
    }),
    prisma.product.findMany({
      where: { tenantId },
      select: { id: true, name: true, sku: true, category: true },
    }),
  ]);

  return { tenantId, suppliers, products };
}

/**
 * Normalize a single parsed row into a canonical SpendRecord.
 */
function normalizeRow(
  row: RawSpendRow,
  ctx: NormalizerContext,
  sourceType: SourceType
): NormalizedSpendRecord {
  const notes: string[] = [];
  let resolutionStatus: ResolutionStatus = "RESOLVED";

  // Resolve supplier
  const supplierMatch = resolveSupplier(row.supplier, ctx);
  if (row.supplier && !supplierMatch.id) {
    resolutionStatus = "PARTIAL";
    notes.push(`Unresolved supplier: "${row.supplier}"`);
  }

  // Resolve product
  const productMatch = resolveProduct(row.sku, row.product, ctx);
  if ((row.sku || row.product) && !productMatch.id) {
    resolutionStatus = resolutionStatus === "RESOLVED" ? "PARTIAL" : resolutionStatus;
    if (row.sku) notes.push(`Unresolved SKU: "${row.sku}"`);
    if (row.product) notes.push(`Unresolved product: "${row.product}"`);
  }

  // Map category
  const categoryResult = mapCategory(row.category);
  if (row.category && !categoryResult.mapped) {
    notes.push(`Unmapped category: "${row.category}"`);
  }

  // Validate required fields
  if (!row.date) {
    resolutionStatus = "UNRESOLVED";
    notes.push("Missing date");
  }
  if (!row.supplier) {
    resolutionStatus = "UNRESOLVED";
    notes.push("Missing supplier");
  }
  if (!row.total && !row.unitPrice) {
    resolutionStatus = "UNRESOLVED";
    notes.push("Missing both total and unit price");
  }

  // If partial has too many issues, mark unresolved
  if (resolutionStatus === "PARTIAL" && notes.length >= 3) {
    resolutionStatus = "UNRESOLVED";
  }

  return {
    tenantId: ctx.tenantId,
    sourceType,
    rawData: { ...row },
    normalizedDate: row.date ? new Date(row.date) : null,
    supplierId: supplierMatch.id,
    supplierName: row.supplier || "Unknown",
    productId: productMatch.id,
    productName: row.product || null,
    sku: row.sku || null,
    category: categoryResult.category,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    totalAmount: row.total || (row.quantity && row.unitPrice ? row.quantity * row.unitPrice : null),
    poNumber: row.poNumber || null,
    invoiceNumber: row.invoiceNumber || null,
    resolutionStatus,
    resolutionNotes: notes,
  };
}

/**
 * Normalize an array of parsed rows.
 * Returns normalized records ready for database insertion.
 */
export async function normalizeRows(
  rows: RawSpendRow[],
  tenantId: string,
  sourceType: SourceType
): Promise<NormalizedSpendRecord[]> {
  const ctx = await loadContext(tenantId);
  return rows.map((row) => normalizeRow(row, ctx, sourceType));
}

/**
 * Determine source type from filename.
 */
export function detectSourceType(filename: string): SourceType {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "csv" || ext === "tsv" || ext === "txt") return "CSV";
  if (ext === "xlsx" || ext === "xls") return "EXCEL";
  return "CSV";
}
