/**
 * canonical-schema.ts
 *
 * Canonical TB/GL/AP data model for the HotelsVendors procurement economic loop.
 *
 * CORRECTION APPLIED (Correction 2 — Currency):
 * - Every record carries sourceCurrency as a required string field.
 * - No EGP default is applied when source currency is unknown.
 * - If FX conversion is needed in the future, it requires an explicit
 *   rate + source + effective date via a separate module (not this schema).
 *
 * CORRECTION APPLIED (Correction 1 — Parser Limits ≠ Business Contract):
 * - This schema does NOT encode the 5MB / 16-sheet / 20,000-row limits
 *   from excel-parser.ts. Those are implementation constraints of the
 *   current parser, not canonical business requirements.
 *
 * EVIDENCE CHAIN:
 * - SourceRecord: raw data as supplied/observed (FACT about what was uploaded)
 * - DerivedFact: computed from source with traceability
 * - Inference: derived interpretation with reasoning
 * - CalculatedOpportunity: baseline-proposed with evidence-backed methodology
 * - ScenarioHypothesis: labelled assumption, not from data
 *
 * See: evidence-chain.ts for the full layer definitions.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CURRENCY
// ─────────────────────────────────────────────────────────────────────────────

/** ISO 4217 currency code. Required on every monetary record — never defaulted. */
export type CurrencyCode = string & { __brand: 'CurrencyCode' };

/**
 * Create a currency code from a 3-letter ISO string.
 * Returns null if the code is not a valid 3-letter alphabetic code.
 * Does NOT default to EGP.
 */
export function normalizeCurrencyCode(raw: unknown): CurrencyCode | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(trimmed)) return null;
  return trimmed as CurrencyCode;
}

/**
 * FX rate entry for future conversion module.
 * NOT part of the canonical ingestion schema — conversion is deferred.
 */
export interface FxRate {
  /** Source currency (e.g., "USD") */
  from: CurrencyCode;
  /** Target currency (e.g., "EGP") */
  to: CurrencyCode;
  /** Rate: 1 unit of `from` = `rate` units of `to` */
  rate: number;
  /** Source of the rate (e.g., "Central Bank of Egypt", "XE.com", "hotel-provided") */
  source: string;
  /** Effective date of the rate (ISO 8601 date) */
  effectiveDate: string;
  /** Timestamp when the rate was recorded */
  recordedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MONETARY AMOUNT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A monetary amount with its currency.
 * The currency is REQUIRED and must be known at ingestion time.
 * Never default to EGP when the source currency is unknown.
 */
export interface MonetaryAmount {
  /** Numeric value (can be decimal for unit prices) */
  value: number;
  /** ISO 4217 currency code (required, never defaulted) */
  currency: CurrencyCode;
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT (TB / GL)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Account types relevant to procurement economics.
 * This is the minimal set needed for TB diagnostic — not a complete chart of accounts.
 */
export type AccountType =
  | 'ASSET_CURRENT'
  | 'ASSET_NON_CURRENT'
  | 'LIABILITY_CURRENT'
  | 'LIABILITY_NON_CURRENT'
  | 'EQUITY'
  | 'INCOME'
  | 'EXPENSE'
  | 'EXPENSE_PROCUREMENT'      // procurement-relevant expense (F&B, supplies, etc.)
  | 'EXPENSE_OPERATIONAL'      // other operational expense
  | 'UNAUDITED'               // TB entry not yet classified
  | 'UNKNOWN';

/**
 * Map raw account type strings to canonical AccountType.
 * This is a normalization function, not a business rule.
 */
export function normalizeAccountType(raw: unknown): AccountType {
  if (typeof raw !== 'string') return 'UNKNOWN';
  const upper = raw.trim().toUpperCase();
  const mapping: Record<string, AccountType> = {
    'ASSET': 'ASSET_CURRENT',
    'ASSET_CURRENT': 'ASSET_CURRENT',
    'ASSET_NON_CURRENT': 'ASSET_NON_CURRENT',
    'CURRENT_ASSET': 'ASSET_CURRENT',
    'NON_CURRENT_ASSET': 'ASSET_NON_CURRENT',
    'LIABILITIES': 'LIABILITY_CURRENT',
    'LIABILITY': 'LIABILITY_CURRENT',
    'LIABILITY_CURRENT': 'LIABILITY_CURRENT',
    'LIABILITY_NON_CURRENT': 'LIABILITY_NON_CURRENT',
    'CURRENT_LIABILITY': 'LIABILITY_CURRENT',
    'NON_CURRENT_LIABILITY': 'LIABILITY_NON_CURRENT',
    'EQUITY': 'EQUITY',
    'OWNER_EQUITY': 'EQUITY',
    'CAPITAL': 'EQUITY',
    'INCOME': 'INCOME',
    'REVENUE': 'INCOME',
    'SALES': 'INCOME',
    'EXPENSE': 'EXPENSE',
    'EXPENSE_PROCUREMENT': 'EXPENSE_PROCUREMENT',
    'PROCUREMENT': 'EXPENSE_PROCUREMENT',
    'F_AND_B': 'EXPENSE_PROCUREMENT',
    'FOOD_AND_BEVERAGE': 'EXPENSE_PROCUREMENT',
    'HOUSING_KEEPING': 'EXPENSE_PROCUREMENT',
    'HOUSEKEEPING': 'EXPENSE_PROCUREMENT',
    'ENGINEERING': 'EXPENSE_PROCUREMENT',
    'AMENITIES': 'EXPENSE_PROCUREMENT',
    'SUPPLIES': 'EXPENSE_PROCUREMENT',
    'CONSUMABLES': 'EXPENSE_PROCUREMENT',
    'GUEST_SUPPLIES': 'EXPENSE_PROCUREMENT',
    'OPERATIONAL': 'EXPENSE_OPERATIONAL',
    'OPERATING': 'EXPENSE_OPERATIONAL',
    'OP_EXPENDITURE': 'EXPENSE_OPERATIONAL',
  };
  return mapping[upper] ?? 'UNKNOWN';
}

/**
 * Canonical TB/GL account record.
 *
 * This is the minimal set required for TB diagnostic.
 * A real TB export may contain additional fields (e.g., budget, prior year).
 * Those are preserved in rawData but not required for the canonical model.
 */
export interface CanonicalAccount {
  /** Unique identifier for this account (from source system, or generated during normalization) */
  id: string;

  /** Account code from the source system (e.g., "6010", "4100") */
  accountCode: string;

  /** Account name/description from the source system */
  accountName: string;

  /** Canonical account type (normalized from source) */
  accountType: AccountType;

  /** Is this account procurement-relevant? (derived from accountType + accountName analysis) */
  procurementRelevant: boolean;

  /** Debit balance for the period (if applicable) */
  debit?: number;

  /** Credit balance for the period (if applicable) */
  credit?: number;

  /** Net balance for the period (debit - credit, or as reported by source) */
  balance?: number;

  /** Period this account balance applies to (ISO 8601 date or period identifier) */
  period: string;

  /** Currency of the account balance (required, never defaulted to EGP) */
  currency: CurrencyCode;

  /** Source system name (e.g., "Opera", "SAP", "Xero", "manual export") */
  sourceSystem: string;

  /** Raw data from the source, preserved for audit/re-processing */
  rawData?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSACTION (AP / PAYABLE / INVOICE)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Canonical AP/transaction record.
 *
 * This is the minimal set required for procurement analysis.
 * Item-level detail (SKU, quantity, unit price) is optional — not every
 * AP export contains it. The system must handle partial data gracefully.
 */
export interface CanonicalTransaction {
  /** Unique identifier for this transaction (from source, or generated during normalization) */
  id: string;

  /** Source invoice/voucher number */
  invoiceNumber?: string;

  /** Vendor/supplier name as it appears in the source */
  vendorName: string;

  /** Vendor code from source system (if available) */
  vendorCode?: string;

  /** Invoice date (ISO 8601 date) */
  invoiceDate: string;

  /** Invoice amount (required) */
  invoiceAmount: MonetaryAmount;

  /** Due date for payment (if available) */
  dueDate?: string;

  /** Actual payment date (if available; null if not yet paid) */
  paymentDate?: string | null;

  /** Quantity (if available — not all AP exports have it) */
  quantity?: number;

  /** Unit price (if available — not all AP exports have it) */
  unitPrice?: MonetaryAmount;

  /** Purchase order reference (if available) */
  poReference?: string;

  /** GL account code this transaction posts to */
  glAccountCode?: string;

  /** Category/material group (if available — e.g., "F&B", "Housekeeping", "Engineering") */
  category?: string;

  /** Payment terms (if available — e.g., "30 days", "Net 30", "2/10 net 30") */
  paymentTerms?: string;

  /** Period this transaction falls into (for TB reconciliation) */
  period: string;

  /** Currency of the transaction (required, never defaulted to EGP) */
  currency: CurrencyCode;

  /** Source system name */
  sourceSystem: string;

  /** Raw data from the source, preserved for audit/re-processing */
  rawData?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// INGESTION INPUT (what the API accepts)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The canonical ingestion input: one file containing either
 * TB/GL accounts or AP/transaction records.
 *
 * The ingestion pipeline determines which type based on the file content
 * (header detection), not on a separate API parameter.
 */
export type IngestionRecord =
  | { kind: 'account'; data: CanonicalAccount }
  | { kind: 'transaction'; data: CanonicalTransaction };

/**
 * File type accepted by the ingestion pipeline.
 * This reflects the current parser capability (exceljs), not a business requirement.
 */
export type SupportedFileType = '.xlsx' | '.xls' | '.csv';

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validation severity.
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * A single validation issue found during ingestion.
 */
export interface ValidationIssue {
  /** Row/cell/field identifier where the issue was found */
  location: string;
  /** Severity */
  severity: ValidationSeverity;
  /** Human-readable message */
  message: string;
  /** The value that caused the issue (if applicable) */
  value?: unknown;
}

/**
 * Validation report produced by the ingestion pipeline.
 * Returned to the caller so they can see what was parsed, what's missing, and what failed.
 */
export interface ValidationReport {
  /** Total rows/records in the source file */
  totalRecords: number;
  /** Records that passed validation and were normalized */
  validRecords: number;
  /** Records that failed validation */
  errorRecords: number;
  /** Records with warnings but still normalized */
  warningRecords: number;
  /** Issues found during validation */
  issues: ValidationIssue[];
  /** Which canonical fields were detected in the source */
  detectedFields: string[];
  /** Which required canonical fields are missing from the source */
  missingFields: string[];
  /** Overall confidence assessment */
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  /** Human-readable summary */
  summary: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a deterministic ID from a source identifier + salt.
 * Used when the source system provides an ID, or when we need to
 * generate one from the record content.
 */
export function generateRecordId(sourceId: string | undefined, salt: string): string {
  if (sourceId && sourceId.trim()) {
    return `src:${sourceId.trim()}`;
  }
  // Fallback: generate from content + salt (not guaranteed unique across files,
  // but sufficient for within-file deduplication)
  const hash = simpleHash(salt);
  return `gen:${hash}`;
}

/**
 * Simple string hash for ID generation (not cryptographic — use SHA-256 for evidence).
 */
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Compare two MonetaryAmount values in the same currency.
 * Returns true if they are approximately equal (within 0.01).
 */
export function monetaryEquals(a: MonetaryAmount, b: MonetaryAmount): boolean {
  if (a.currency !== b.currency) return false;
  return Math.abs(a.value - b.value) < 0.01;
}

/**
 * Add two MonetaryAmount values in the same currency.
 * Returns null if currencies differ.
 */
export function monetaryAdd(a: MonetaryAmount, b: MonetaryAmount): MonetaryAmount | null {
  if (a.currency !== b.currency) return null;
  return { value: a.value + b.value, currency: a.currency };
}

/**
 * Subtract b from a (a - b) in the same currency.
 * Returns null if currencies differ.
 */
export function monetarySubtract(a: MonetaryAmount, b: MonetaryAmount): MonetaryAmount | null {
  if (a.currency !== b.currency) return null;
  return { value: a.value - b.value, currency: a.currency };
}
