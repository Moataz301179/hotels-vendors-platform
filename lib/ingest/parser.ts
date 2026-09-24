/**
 * lib/ingest/parser.ts
 * Parse CSV/Excel procurement files with auto-detected column mappings.
 */

import * as Papa from "papaparse";
import * as ExcelJS from "exceljs";

export interface RawSpendRow {
  date: string | null;
  supplier: string | null;
  product: string | null;
  sku: string | null;
  category: string | null;
  quantity: number | null;
  unitPrice: number | null;
  total: number | null;
  poNumber: string | null;
  invoiceNumber: string | null;
}

export interface ParseResult {
  rows: RawSpendRow[];
  totalRows: number;
  detectedMappings: Record<string, string>;
  warnings: string[];
}

// Column name patterns for fuzzy matching
const COLUMN_PATTERNS: Record<keyof RawSpendRow, string[]> = {
  date: ["date", "order date", "invoice date", "purchase date", "transaction date", "po date"],
  supplier: ["supplier", "vendor", "provider", "seller", "company", "supplier name", "vendor name"],
  product: ["product", "item", "description", "product name", "item name", "product description"],
  sku: ["sku", "product code", "item code", "product id", "item id", "code", "product sku"],
  category: ["category", "type", "product category", "spend category", "classification"],
  quantity: ["quantity", "qty", "amount", "count", "units", "volume"],
  unitPrice: ["unit price", "price", "rate", "unit cost", "cost per unit", "price per unit"],
  total: ["total", "total amount", "total price", "net amount", "gross amount", "value", "line total"],
  poNumber: ["po", "po number", "purchase order", "po #", "purchase order number", "order number"],
  invoiceNumber: ["invoice", "invoice number", "invoice #", "inv number", "inv #", "bill number"],
};

/**
 * Compute similarity score between two strings (0-1).
 * Uses normalized Levenshtein-based matching.
 */
function similarity(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  // Simple word overlap score
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  let matches = 0;
  for (const w of words1) {
    if (words2.includes(w)) matches++;
  }
  const overlapScore = matches / Math.max(words1.length, words2.length);

  // Levenshtein distance for typos
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 0;
  const dist = levenshtein(s1, s2);
  const editScore = 1 - dist / maxLen;

  return Math.max(overlapScore, editScore);
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Auto-detect column mappings from header row using fuzzy matching.
 */
function detectColumnMappings(headers: string[]): Record<keyof RawSpendRow, string | null> {
  const mappings: Record<string, string | null> = {};
  const usedHeaders = new Set<number>();

  for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
    let bestMatch: { idx: number; score: number } | null = null;

    for (let i = 0; i < headers.length; i++) {
      if (usedHeaders.has(i)) continue;
      const header = headers[i].trim();

      for (const pattern of patterns) {
        const score = similarity(header, pattern);
        if (score >= 0.7 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { idx: i, score };
        }
      }
    }

    if (bestMatch) {
      mappings[field] = headers[bestMatch.idx];
      usedHeaders.add(bestMatch.idx);
    } else {
      mappings[field] = null;
    }
  }

  return mappings as Record<keyof RawSpendRow, string | null>;
}

/**
 * Parse a date string into ISO format. Tries multiple formats.
 */
function parseDate(value: string | null | undefined): string | null {
  if (!value) return null;

  const cleaned = value.toString().trim();

  // Try ISO
  const iso = new Date(cleaned);
  if (!isNaN(iso.getTime())) return iso.toISOString();

  // Try DD/MM/YYYY or MM/DD/YYYY
  const parts = cleaned.split(/[/\-\.]/);
  if (parts.length === 3) {
    const nums = parts.map(Number);
    if (nums.every((n) => !isNaN(n))) {
      // Assume DD/MM/YYYY for first > 12, else try YYYY-MM-DD
      if (nums[0] > 31) {
        // YYYY-MM-DD
        const d = new Date(nums[0], nums[1] - 1, nums[2]);
        if (!isNaN(d.getTime())) return d.toISOString();
      } else if (nums[1] > 12) {
        // DD/MM/YYYY
        const d = new Date(nums[2], nums[1] - 1, nums[0]);
        if (!isNaN(d.getTime())) return d.toISOString();
      }
      // Default: MM/DD/YYYY (US) — fallback
      const d = new Date(nums[2], nums[0] - 1, nums[1]);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
  }

  return null;
}

/**
 * Parse a numeric value from various formats.
 */
function parseNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const cleaned = value.toString().replace(/[$,\s]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Map a raw row object to RawSpendRow based on detected column mappings.
 */
function mapRow(
  rawRow: Record<string, unknown>,
  mappings: Record<keyof RawSpendRow, string | null>
): RawSpendRow {
  const get = (field: keyof RawSpendRow): string | null => {
    const col = mappings[field];
    if (!col) return null;
    const val = rawRow[col];
    if (val === undefined || val === null) return null;
    return String(val).trim() || null;
  };

  return {
    date: parseDate(get("date")),
    supplier: get("supplier"),
    product: get("product"),
    sku: get("sku"),
    category: get("category"),
    quantity: parseNumber(get("quantity")),
    unitPrice: parseNumber(get("unitPrice")),
    total: parseNumber(get("total")),
    poNumber: get("poNumber"),
    invoiceNumber: get("invoiceNumber"),
  };
}

/**
 * Parse CSV string content into structured rows.
 */
export function parseCSV(content: string): ParseResult {
  const warnings: string[] = [];

  const result = Papa.parse<Record<string, unknown>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });

  if (result.errors.length > 0) {
    for (const err of result.errors.slice(0, 5)) {
      warnings.push(`CSV parse warning: ${err.message} (row ${err.row})`);
    }
  }

  const headers = result.meta.fields || [];
  const mappings = detectColumnMappings(headers);
  const detectedMappings: Record<string, string> = {};

  for (const [field, col] of Object.entries(mappings)) {
    if (col) detectedMappings[field] = col;
  }

  // Check for missing critical columns
  if (!mappings.date) warnings.push("Could not detect 'date' column");
  if (!mappings.supplier) warnings.push("Could not detect 'supplier' column");
  if (!mappings.product && !mappings.sku) {
    warnings.push("Could not detect 'product' or 'sku' column");
  }
  if (!mappings.total && !mappings.unitPrice) {
    warnings.push("Could not detect 'total' or 'unit_price' column");
  }

  const rows = result.data.map((row) => mapRow(row, mappings));

  return {
    rows,
    totalRows: rows.length,
    detectedMappings,
    warnings,
  };
}

/**
 * Parse Excel file buffer into structured rows.
 */
export async function parseExcel(buffer: Buffer): Promise<ParseResult> {
  const warnings: string[] = [];
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return { rows: [], totalRows: 0, detectedMappings: {}, warnings: ["No worksheets found"] };
  }

  // Extract headers from first row
  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber - 1] = (cell.value?.toString() || "").trim();
  });

  const mappings = detectColumnMappings(headers);
  const detectedMappings: Record<string, string> = {};

  for (const [field, col] of Object.entries(mappings)) {
    if (col) detectedMappings[field] = col;
  }

  // Check for missing critical columns
  if (!mappings.date) warnings.push("Could not detect 'date' column");
  if (!mappings.supplier) warnings.push("Could not detect 'supplier' column");
  if (!mappings.product && !mappings.sku) {
    warnings.push("Could not detect 'product' or 'sku' column");
  }
  if (!mappings.total && !mappings.unitPrice) {
    warnings.push("Could not detect 'total' or 'unit_price' column");
  }

  const rows: RawSpendRow[] = [];

  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    if (!row.hasValues) continue;

    const rawRow: Record<string, unknown> = {};
    for (let j = 0; j < headers.length; j++) {
      const cell = row.getCell(j + 1);
      rawRow[headers[j]] = cell.value ?? null;
    }

    rows.push(mapRow(rawRow, mappings));
  }

  return {
    rows,
    totalRows: rows.length,
    detectedMappings,
    warnings,
  };
}

/**
 * Auto-detect file type and parse accordingly.
 */
export async function parseFile(
  buffer: Buffer,
  filename: string
): Promise<ParseResult> {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (ext === "csv" || ext === "tsv" || ext === "txt") {
    const text = buffer.toString("utf-8");
    return parseCSV(text);
  }

  if (ext === "xlsx" || ext === "xls") {
    return parseExcel(buffer);
  }

  // Fallback: try CSV first, then Excel
  try {
    const text = buffer.toString("utf-8");
    return parseCSV(text);
  } catch {
    return parseExcel(buffer);
  }
}
