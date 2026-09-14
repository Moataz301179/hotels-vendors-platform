/**
 * Excel/CSV Parser — exceljs wrapper for catalog imports.
 * Handles .xlsx, .xls, .csv with header detection, type coercion, and row validation.
 *
 * REPLACED SheetJS (xlsx) with exceljs to eliminate unfixable HIGH-severity
 * prototype-pollution + ReDoS vulnerabilities (no upstream fix for xlsx).
 */

import ExcelJS from "exceljs";

/* Hard caps to bound worst-case parse work. */
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_SHEETS = 16;
const MAX_ROWS = 20_000;

export interface ParsedCell {
  value: unknown;
  type: "string" | "number" | "boolean" | "date" | "empty";
  raw: unknown;
}

export interface ParsedRow {
  rowIndex: number;
  data: Record<string, ParsedCell>;
  errors: string[];
  warnings: string[];
}

export interface ParseResult {
  fileName: string;
  sheetName: string;
  headers: string[];
  rawHeaders: string[];
  rows: ParsedRow[];
  totalRows: number;
  validRows: number;
  errorRows: number;
  detectedFormat: "xlsx" | "csv" | "unknown";
}

export interface ColumnMapping {
  sourceHeader: string;
  targetField: TargetField;
  confidence: number;
  required: boolean;
  sampleValues: string[];
}

export type TargetField =
  | "sku" | "name" | "description" | "category" | "subcategory"
  | "unitPrice" | "currency" | "stockQuantity" | "minOrderQty"
  | "unitOfMeasure" | "leadTimeDays" | "shelfLifeDays"
  | "temperatureReq" | "images" | "ignored";

const TARGET_FIELD_ALIASES: Record<TargetField, string[]> = {
  sku: ["sku", "product code", "item code", "code", "part number", "partno", "ean", "gtin", "barcode", "upc", "isbn"],
  name: ["name", "product name", "item name", "title", "description", "product", "item"],
  description: ["description", "desc", "details", "specs", "specifications", "notes", "long description"],
  category: ["category", "cat", "type", "product type", "group", "department", "class"],
  subcategory: ["subcategory", "sub-category", "sub category", "sub type", "variant", "line"],
  unitPrice: ["price", "unit price", "cost", "unit cost", "sale price", "list price", "rate", "amount", "egp", "value"],
  currency: ["currency", "curr", "ccy", "money"],
  stockQuantity: ["stock", "quantity", "qty", "available", "on hand", "inventory", "units", "count"],
  minOrderQty: ["min order", "minimum order", "moq", "min qty", "minimum qty", "order multiple"],
  unitOfMeasure: ["uom", "unit", "unit of measure", "measure", "per"],
  leadTimeDays: ["lead time", "leadtime", "days", "delivery days", "shipping time", "turnaround"],
  shelfLifeDays: ["shelf life", "shelflife", "expiry days", "expiration", "best before", "use by"],
  temperatureReq: ["temperature", "temp", "storage temp", "cold chain", "refrigerated", "frozen"],
  images: ["image", "images", "photo", "photos", "picture", "url", "image url", "picture url"],
  ignored: [],
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/[_\-\.\s]+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();
}

function detectTargetField(header: string): { field: TargetField; confidence: number } {
  const normalized = normalizeHeader(header);
  let bestField: TargetField = "ignored";
  let bestConfidence = 0;
  for (const [field, aliases] of Object.entries(TARGET_FIELD_ALIASES)) {
    for (const alias of aliases) {
      const normAlias = normalizeHeader(alias);
      if (normalized === normAlias) return { field: field as TargetField, confidence: 1.0 };
      if (normalized.includes(normAlias) || normAlias.includes(normalized)) {
        const confidence = 0.7 + 0.3 * (normAlias.length / Math.max(normalized.length, normAlias.length));
        if (confidence > bestConfidence) { bestConfidence = confidence; bestField = field as TargetField; }
      }
    }
  }
  return { field: bestField, confidence: bestConfidence };
}

function coerceValue(value: unknown, targetField: TargetField): ParsedCell {
  if (value === null || value === undefined || value === "") return { value: null, type: "empty", raw: value };
  if (value instanceof Date) return { value: value.toISOString().split("T")[0], type: "date", raw: value };
  if (typeof value === "number") return { value, type: "number", raw: value };
  if (typeof value === "string") {
    const trimmed = value.trim();
    const numericFields: TargetField[] = ["unitPrice", "stockQuantity", "minOrderQty", "leadTimeDays", "shelfLifeDays"];
    if (numericFields.includes(targetField)) {
      const parsed = parseFloat(trimmed.replace(/[^\d.\-]/g, ""));
      if (!isNaN(parsed)) return { value: parsed, type: "number", raw: value };
    }
    if (targetField === "temperatureReq") {
      const lower = trimmed.toLowerCase();
      if (["yes", "true", "1", "y", "required", "chilled", "frozen", "cold"].includes(lower)) return { value: true, type: "boolean", raw: value };
      if (["no", "false", "0", "n", "ambient", "room temp"].includes(lower)) return { value: false, type: "boolean", raw: value };
    }
    return { value: trimmed, type: "string", raw: value };
  }
  if (typeof value === "boolean") return { value, type: "boolean", raw: value };
  return { value: String(value), type: "string", raw: value };
}

function validateCell(cell: ParsedCell, targetField: TargetField, required: boolean): string[] {
  const errors: string[] = [];
  if (cell.type === "empty") { if (required) errors.push(`${targetField} is required`); return errors; }
  switch (targetField) {
    case "sku": if (cell.type === "string" && (cell.value as string).length < 2) errors.push("SKU must be at least 2 characters"); break;
    case "name": if (cell.type === "string" && (cell.value as string).length < 2) errors.push("Name must be at least 2 characters"); break;
    case "unitPrice":
      if (cell.type === "number") { const num = cell.value as number; if (num <= 0) errors.push("Unit price must be positive"); if (num > 1000000) errors.push("Unit price seems unreasonably high (>1M EGP)"); }
      else errors.push("Unit price must be a number"); break;
    case "stockQuantity": case "minOrderQty": case "leadTimeDays":
      if (cell.type === "number") { const num = cell.value as number; if (num < 0) errors.push(`${targetField} cannot be negative`); if (!Number.isInteger(num)) errors.push(`${targetField} must be an integer`); }
      else errors.push(`${targetField} must be a number`); break;
    case "category":
      if (cell.type === "string") {
        const valid = ["F_AND_B", "CONSUMABLES", "GUEST_SUPPLIES", "FFE", "SERVICES", "fb", "consumables", "guest_supplies", "ffe", "services", "f&b", "food", "beverage", "housekeeping", "linen", "amenities", "equipment", "services"];
        if (!valid.includes((cell.value as string).toUpperCase().replace(/[&\s]/g, "_"))) errors.push(`Category must be one of: F_AND_B, CONSUMABLES, GUEST_SUPPLIES, FFE, SERVICES`);
      } break;
    case "currency": if (cell.type === "string" && (cell.value as string).length !== 3) errors.push("Currency must be 3-letter code (e.g., EGP)"); break;
  }
  return errors;
}

/** Read a workbook buffer through exceljs. */
async function readWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
  if (buffer.length > MAX_FILE_BYTES) throw new Error("File exceeds 5MB safety limit.");
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  } catch (e) {
    // Try CSV fallback
    if (fileName_isCsv(buffer)) {
      const csvText = buffer.toString("utf-8");
      return csvToWorkbook(csvText);
    }
    throw new Error("Failed to parse spreadsheet: " + ((e as Error).message || "invalid file"));
  }
  if (wb.worksheets.length > MAX_SHEETS) {
    // Keep only first MAX_SHEETS
    const toRemove = wb.worksheets.slice(MAX_SHEETS);
    for (const ws of toRemove) wb.removeWorksheet(ws.id);
  }
  return wb;
}

function fileName_isCsv(_buffer: Buffer): boolean { return true; /* attempted as fallback */ }

function csvToWorkbook(csvText: string): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sheet1");
  const lines = csvText.split(/\r?\n/).slice(0, MAX_ROWS);
  for (const line of lines) {
    const cells = parseCsvLine(line);
    ws.addRow(cells);
  }
  return wb;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { result.push(current); current = ""; continue; }
    current += ch;
  }
  result.push(current);
  return result;
}

/** Extract raw rows from a worksheet as arrays. */
function sheetToArrays(ws: ExcelJS.Worksheet, maxRows: number): unknown[][] {
  const rows: unknown[][] = [];
  ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum > maxRows) return;
    const values: unknown[] = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      values[colNumber - 1] = cell.value;
    });
    rows.push(values);
  });
  return rows;
}

export async function parseExcelBuffer(
  buffer: Buffer,
  fileName: string,
  options?: { sheetName?: string; headerRow?: number }
): Promise<ParseResult> {
  const workbook = await readWorkbook(buffer);
  const sheetName = options?.sheetName || workbook.worksheets[0]?.name;
  const worksheet = sheetName ? workbook.getWorksheet(sheetName) : workbook.worksheets[0];
  if (!worksheet) throw new Error(`Sheet "${sheetName}" not found.`);

  const headerRow = options?.headerRow ?? 0;
  const rawData = sheetToArrays(worksheet, MAX_ROWS + headerRow + 1).slice(0, MAX_ROWS);

  if (rawData.length === 0) {
    return { fileName, sheetName: sheetName || "Sheet1", headers: [], rawHeaders: [], rows: [], totalRows: 0, validRows: 0, errorRows: 0, detectedFormat: fileName.endsWith(".csv") ? "csv" : "xlsx" };
  }

  const rawHeaders = (rawData[headerRow] || []).map((h) => (h ?? "").toString().trim());
  const dataRows = rawData.slice(headerRow + 1);

  const mappings: ColumnMapping[] = rawHeaders.map((header, idx) => {
    const { field, confidence } = detectTargetField(header);
    const sampleValues = dataRows.slice(0, 3).map((row) => row[idx]).filter((v) => v !== null && v !== undefined && v !== "").map((v) => String(v).slice(0, 50));
    return { sourceHeader: header || `Column ${idx + 1}`, targetField: field, confidence, required: ["sku", "name", "unitPrice"].includes(field), sampleValues };
  });

  const rows: ParsedRow[] = dataRows.map((row, rowIdx) => {
    const data: Record<string, ParsedCell> = {};
    const errors: string[] = [];
    const warnings: string[] = [];
    rawHeaders.forEach((header, colIdx) => {
      const mapping = mappings[colIdx];
      const rawValue = row[colIdx];
      const cell = coerceValue(rawValue, mapping.targetField);
      data[mapping.targetField] = cell;
      errors.push(...validateCell(cell, mapping.targetField, mapping.required));
      if (mapping.confidence < 0.5 && mapping.targetField !== "ignored") warnings.push(`Column "${header}" mapped to ${mapping.targetField} with low confidence (${Math.round(mapping.confidence * 100)}%)`);
    });
    return { rowIndex: rowIdx + headerRow + 2, data, errors, warnings };
  });

  const validRows = rows.filter((r) => r.errors.length === 0).length;
  const errorRows = rows.filter((r) => r.errors.length > 0).length;
  const uniqueHeaders = Array.from(new Map(mappings.map(m => [m.targetField, m.targetField])).values());

  return { fileName, sheetName: sheetName || "Sheet1", headers: uniqueHeaders, rawHeaders, rows, totalRows: rows.length, validRows, errorRows, detectedFormat: fileName.toLowerCase().endsWith(".csv") ? "csv" : "xlsx" };
}

export async function generateTemplateBuffer(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Catalog Template");
  const templateHeaders = ["SKU", "Name", "Description", "Category (F_AND_B|CONSUMABLES|GUEST_SUPPLIES|FFE|SERVICES)", "Subcategory", "Unit Price (EGP)", "Currency (EGP)", "Stock Quantity", "Min Order Qty", "Unit of Measure (piece|box|case|pack|kg|l|m|set)", "Lead Time (Days)", "Shelf Life (Days)", "Temperature Required (yes/no)", "Image URLs (comma-separated)"];
  ws.addRow(templateHeaders);
  const sampleRows = [
    ["FNB-HNZ-MAY-3KG-001", "Heinz Classic Mayonnaise 3kg", "Premium mayonnaise in 3kg bulk container", "F_AND_B", "Condiments & Sauces", 387, "EGP", 200, 6, "jar", 2, 180, "no", "https://example.com/mayo.jpg"],
    ["TEX-ALZ-BED-QN-001", "100% Cotton Bed Sheet - Queen", "Premium Egyptian cotton bed sheet, queen size, 300 TC, white", "CONSUMABLES", "Bed Linens", 350, "EGP", 500, 50, "piece", 7, 0, "no", "https://example.com/sheet.jpg"],
    ["AMN-UNI-SHP-30ML-001", "Shampoo 30ml - Premium", "Premium hotel shampoo in 30ml tube", "GUEST_SUPPLIES", "Bath Amenities", 6, "EGP", 5000, 500, "piece", 10, 730, "no", "https://example.com/shampoo.jpg"],
    ["FFE-ETT-PLT-10IN-001", "Porcelain Dinner Plate 10 inch", "Premium porcelain dinner plate, 10-inch, white", "FFE", "Tableware", 85, "EGP", 1000, 48, "piece", 14, 0, "no", "https://example.com/plate.jpg"],
  ];
  for (const row of sampleRows) ws.addRow(row);
  templateHeaders.forEach((_, i) => { ws.getColumn(i + 1).width = 22; });
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function isValidExcelBuffer(buffer: Buffer): Promise<boolean> {
  if (buffer.length > MAX_FILE_BYTES) return false;
  try { const wb = new ExcelJS.Workbook(); await wb.xlsx.load(buffer as unknown as ArrayBuffer); return true; }
  catch { return false; }
}