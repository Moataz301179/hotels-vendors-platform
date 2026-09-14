/**
 * Catalog Importer — Orchestrates the full AI enrichment pipeline
 * Column mapping → per-row enrichment → preview generation with row-level errors
 */

import { executeLLM } from "@/lib/ai/llm";
import {
  parseExcelBuffer,
  ParseResult,
  ParsedRow,
  ColumnMapping,
  TargetField,
  generateTemplateBuffer,
} from "@/lib/parsers/excel-parser";
import { generateSku, generateSkusBatch, SkuGenerationInput } from "./sku-generator";
import { generateDescriptions, generateDescriptionsBatch, DescriptionInput, DescriptionOutput } from "./description-writer";
import { generatePricing, generatePricingBatch, PricingInput, PricingOutput, TierPrice, PromoSuggestion } from "./pricing-advisor";

export interface EnrichedRow {
  rowIndex: number;
  original: ParsedRow;
  mapped: Record<TargetField, unknown>;      // Coerced, validated values
  sku?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  shortDescriptionEn?: string;
  shortDescriptionAr?: string;
  seoKeywordsEn?: string[];
  seoKeywordsAr?: string[];
  tierPrices?: TierPrice[];
  promoSuggestions?: PromoSuggestion[];
  categoryNormalized?: string;
  aiConfidence: number;                      // Overall confidence 0-1
  errors: string[];                          // Blocking errors (prevent insert)
  warnings: string[];                        // Non-blocking warnings
}

export interface ImportPreview {
  jobId: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  columns: ColumnMapping[];
  rows: EnrichedRow[];
  templateBuffer?: Buffer;
}

export interface ImportJob {
  id: string;
  status: "parsing" | "enriching" | "preview_ready" | "creating" | "completed" | "failed";
  progress: number;          // 0-100
  currentStep: string;
  preview?: ImportPreview;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  supplierId: string;
  userId: string;
}

// In-memory job store (in production: Redis)
const jobStore = new Map<string, ImportJob>();

/**
 * Normalize category string to Prisma enum
 */
function normalizeCategory(category: unknown): string {
  if (!category) return "CONSUMABLES";
  const cat = String(category).toUpperCase().trim()
    .replace(/[&\s]+/g, "_")
    .replace(/[^A-Z_]/g, "");

  const map: Record<string, string> = {
    "F_AND_B": "F_AND_B",
    "FB": "F_AND_B",
    "FOOD": "F_AND_B",
    "BEVERAGE": "F_AND_B",
    "F_B": "F_AND_B",
    "CONSUMABLES": "CONSUMABLES",
    "HK": "CONSUMABLES",
    "HOUSEKEEPING": "CONSUMABLES",
    "LINEN": "CONSUMABLES",
    "CHEMICALS": "CONSUMABLES",
    "JANITORIAL": "CONSUMABLES",
    "GUEST_SUPPLIES": "GUEST_SUPPLIES",
    "AMENITIES": "GUEST_SUPPLIES",
    "COMFORT": "GUEST_SUPPLIES",
    "GRA": "GUEST_SUPPLIES",
    "LIN": "GUEST_SUPPLIES",
    "FFE": "FFE",
    "FURNITURE": "FFE",
    "EQUIPMENT": "FFE",
    "FIXTURES": "FFE",
    "SERVICES": "SERVICES",
    "SRV": "SERVICES",
    "MAINTENANCE": "SERVICES",
    "ENG": "SERVICES",
    "SPA": "SERVICES",
    "IT": "SERVICES",
    "SEC": "SERVICES",
  };

  return map[cat] || "CONSUMABLES";
}

/**
 * Extract mapped values from a parsed row
 */
function extractMappedValues(row: ParsedRow): Record<TargetField, unknown> {
  const mapped: Record<TargetField, unknown> = {} as Record<TargetField, unknown>;
  const targetFields: TargetField[] = [
    "sku", "name", "description", "category", "subcategory", "unitPrice",
    "currency", "stockQuantity", "minOrderQty", "unitOfMeasure", "leadTimeDays",
    "shelfLifeDays", "temperatureReq", "images", "ignored"
  ];

  for (const field of targetFields) {
    const cell = row.data[field];
    mapped[field] = cell?.value ?? null;
  }

  return mapped;
}

/**
 * Build SKU generation input from mapped row
 */
function buildSkuInput(mapped: Record<TargetField, unknown>, supplierPrefix?: string): SkuGenerationInput {
  return {
    productName: String(mapped.name || ""),
    category: String(mapped.category || "CONSUMABLES"),
    subcategory: mapped.subcategory ? String(mapped.subcategory) : undefined,
    keySpecs: extractKeySpecs(mapped),
    supplierPrefix,
  };
}

function extractKeySpecs(mapped: Record<TargetField, unknown>): string {
  const parts: string[] = [];
  if (mapped.unitOfMeasure) parts.push(String(mapped.unitOfMeasure));
  if (mapped.shelfLifeDays) parts.push(`${mapped.shelfLifeDays} days`);
  if (mapped.temperatureReq) parts.push("temp controlled");
  return parts.join(", ");
}

/**
 * Build description input from mapped row
 */
function buildDescriptionInput(mapped: Record<TargetField, unknown>, sku?: string): DescriptionInput {
  return {
    productName: String(mapped.name || ""),
    category: String(mapped.category || "CONSUMABLES"),
    subcategory: mapped.subcategory ? String(mapped.subcategory) : undefined,
    specs: buildSpecsString(mapped),
    brand: sku?.split("-")[1], // Extract brand from SKU prefix
  };
}

function buildSpecsString(mapped: Record<TargetField, unknown>): string {
  const parts: string[] = [];
  if (mapped.unitOfMeasure) parts.push(`UoM: ${mapped.unitOfMeasure}`);
  if (mapped.minOrderQty) parts.push(`MOQ: ${mapped.minOrderQty}`);
  if (mapped.leadTimeDays) parts.push(`Lead: ${mapped.leadTimeDays}d`);
  if (mapped.shelfLifeDays) parts.push(`Shelf: ${mapped.shelfLifeDays}d`);
  if (mapped.temperatureReq) parts.push("Temp controlled");
  if (mapped.stockQuantity !== undefined) parts.push(`Stock: ${mapped.stockQuantity}`);
  return parts.join(" | ");
}

/**
 * Build pricing input from mapped row
 */
function buildPricingInput(mapped: Record<TargetField, unknown>, category: string): PricingInput {
  const unitPrice = typeof mapped.unitPrice === "number" ? mapped.unitPrice : undefined;
  const stock = typeof mapped.stockQuantity === "number" ? mapped.stockQuantity : undefined;

  // Determine seasonality from category + current month
  const month = new Date().getMonth(); // 0-11
  const isHighSeason = month >= 9 || month <= 3; // Oct-Apr
  const seasonality = isHighSeason ? "high" : "low";

  return {
    productName: String(mapped.name || ""),
    category,
    subcategory: mapped.subcategory ? String(mapped.subcategory) : undefined,
    suggestedRetail: unitPrice,
    costPrice: unitPrice ? Math.round(unitPrice / 1.3) : undefined, // Estimate 30% margin
    volumeTiers: [
      { minQty: 1, maxQty: 10 },
      { minQty: 11, maxQty: 50 },
      { minQty: 51 },
    ],
    seasonality,
    brandTier: unitPrice && unitPrice > 500 ? "premium" : unitPrice && unitPrice > 100 ? "standard" : "economy",
  };
}

/**
 * Step 1: Parse uploaded file and return column mapping preview
 */
export async function parseAndMapColumns(
  buffer: Buffer,
  fileName: string,
  tenantId: string,
  supplierId: string,
  userId: string
): Promise<ImportPreview> {
  const parseResult = await parseExcelBuffer(buffer, fileName);

  // Create job record
  const jobId = `import_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const job: ImportJob = {
    id: jobId,
    status: "enriching",
    progress: 20,
    currentStep: "Running AI enrichment on rows...",
    createdAt: new Date(),
    updatedAt: new Date(),
    tenantId,
    supplierId,
    userId,
  };
  jobStore.set(jobId, job);

  // Enrich rows in background (async, don't await)
  enrichRowsAsync(jobId, parseResult, supplierId);

  // Return immediate preview with just column mapping
  return {
    jobId,
    fileName,
    totalRows: parseResult.totalRows,
    validRows: parseResult.validRows,
    errorRows: parseResult.errorRows,
    columns: parseResult.headers.length > 0 ? parseResult.headers.map(h => ({
      sourceHeader: h,
      targetField: h as TargetField,
      confidence: 1,
      required: ["sku", "name", "unitPrice"].includes(h),
      sampleValues: [],
    })) : [],
    rows: [],
  };
}

/**
 * Background enrichment of all rows
 */
async function enrichRowsAsync(jobId: string, parseResult: ParseResult, supplierId: string) {
  const job = jobStore.get(jobId);
  if (!job) return;

  try {
    const rows = parseResult.rows;
    const enriched: EnrichedRow[] = [];

    // Process in batches
    const batchSize = 5;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      // Update progress
      job.progress = 20 + Math.round((i / rows.length) * 70);
      job.currentStep = `Enriching row ${i + 1}-${Math.min(i + batchSize, rows.length)} of ${rows.length}`;
      job.updatedAt = new Date();

      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map((row) => enrichSingleRow(row, supplierId))
      );

      enriched.push(...batchResults);
    }

    // Build preview
    const preview: ImportPreview = {
      jobId,
      fileName: parseResult.fileName,
      totalRows: parseResult.totalRows,
      validRows: enriched.filter(r => r.errors.length === 0).length,
      errorRows: enriched.filter(r => r.errors.length > 0).length,
      columns: parseResult.headers.map(h => ({
        sourceHeader: h,
        targetField: h as TargetField,
        confidence: 1,
        required: ["sku", "name", "unitPrice"].includes(h),
        sampleValues: [],
      })),
      rows: enriched,
    };

    job.status = "preview_ready";
    job.progress = 100;
    job.currentStep = "Preview ready for review";
    job.preview = preview;
    job.updatedAt = new Date();
  } catch (err) {
    job.status = "failed";
    job.error = err instanceof Error ? err.message : "Enrichment failed";
    job.updatedAt = new Date();
  }
}

/**
 * Enrich a single row with all AI agents
 */
async function enrichSingleRow(row: ParsedRow, supplierId: string): Promise<EnrichedRow> {
  const mapped = extractMappedValues(row);
  const categoryNormalized = normalizeCategory(mapped.category);

  const errors = [...row.errors];
  const warnings = [...row.warnings];

  // Validate required fields
  if (!mapped.name) errors.push("Product name is required");
  if (!mapped.unitPrice) errors.push("Unit price is required");
  if (mapped.unitPrice && typeof mapped.unitPrice === "number" && mapped.unitPrice <= 0) {
    errors.push("Unit price must be positive");
  }

  let aiConfidence = 1.0;
  let sku: string | undefined;
  let descriptions: DescriptionOutput | undefined;
  let pricing: PricingOutput | undefined;

  // Only run AI if no blocking errors
  if (errors.length === 0) {
    try {
      // Run all three agents in parallel
      const [skuResult, descResult, priceResult] = await Promise.all([
        generateSku(buildSkuInput(mapped, supplierPrefixFromId(supplierId))),
        generateDescriptions(buildDescriptionInput(mapped)),
        generatePricing(buildPricingInput(mapped, categoryNormalized)),
      ]);

      sku = skuResult.sku;
      descriptions = descResult;
      pricing = priceResult;

      // Average confidence
      aiConfidence = (skuResult.confidence + descResult.confidence + priceResult.confidence) / 3;

      if (skuResult.confidence < 0.5) warnings.push("SKU generation low confidence");
      if (descResult.confidence < 0.5) warnings.push("Description generation low confidence");
      if (priceResult.confidence < 0.5) warnings.push("Pricing advice low confidence");
    } catch (err) {
      warnings.push("AI enrichment partially failed; using fallbacks");
      aiConfidence = 0.3;
    }
  } else {
    aiConfidence = 0;
  }

  return {
    rowIndex: row.rowIndex,
    original: row,
    mapped,
    sku,
    descriptionEn: descriptions?.descriptionEn,
    descriptionAr: descriptions?.descriptionAr,
    shortDescriptionEn: descriptions?.shortDescriptionEn,
    shortDescriptionAr: descriptions?.shortDescriptionAr,
    seoKeywordsEn: descriptions?.seoKeywordsEn,
    seoKeywordsAr: descriptions?.seoKeywordsAr,
    tierPrices: pricing?.tierPrices,
    promoSuggestions: pricing?.promoSuggestions,
    categoryNormalized,
    aiConfidence,
    errors,
    warnings,
  };
}

function supplierPrefixFromId(supplierId: string): string {
  // Use first 3 chars of supplier ID (cuid) as fallback prefix
  return supplierId.slice(0, 3).toUpperCase();
}

/**
 * Get job status for polling
 */
export function getImportJob(jobId: string): ImportJob | undefined {
  return jobStore.get(jobId);
}

/**
 * Generate downloadable Excel template
 */
export async function getTemplateBuffer(): Promise<Buffer> {
  return await generateTemplateBuffer();
}

/**
 * Clear completed jobs older than 1 hour (call periodically)
 */
export function cleanupOldJobs(): void {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  for (const [id, job] of jobStore.entries()) {
    if (job.status === "completed" || job.status === "failed") {
      if (now - job.updatedAt.getTime() > oneHour) {
        jobStore.delete(id);
      }
    }
  }
}