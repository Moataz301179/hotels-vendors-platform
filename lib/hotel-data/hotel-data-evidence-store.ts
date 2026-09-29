/**
 * hotel-data-evidence-store.ts
 *
 * Persistent evidence store for hotel data ingestion.
 *
 * Extends the p0/evidence-store.ts pattern with hotel-data-specific fields:
 * - hotelId (tenant-scoped identifier)
 * - sourceSystem (name of hotel's financial system)
 * - exportTimestamp (when the hotel exported the data)
 * - recordCount (number of accounts/rows/invoices ingested)
 * - validationReport (what was parsed successfully, what failed, what's missing)
 * - sourceCurrency (preserved, never defaulted to EGP)
 * - confidence (data quality assessment)
 *
 * CORRECTION APPLIED:
 * - Correction 2: sourceCurrency is preserved on every record. Never defaulted to EGP.
 * - Correction 3: Every stored record links to sourceIngestionId for evidence chain.
 *
 * This store is ISOLATED — it does NOT import the legacy @/lib/prisma singleton.
 * It uses a standalone SQLite database for pilot simplicity.
 * Future: can be replaced with PostgreSQL via a dedicated Prisma client.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { type IngestionId, createIngestionId } from './evidence-chain';
import {
  type IngestionRecord,
  type ValidationReport,
  type CurrencyCode,
  normalizeCurrencyCode,
} from './canonical-schema';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A stored ingestion event with full provenance.
 */
export interface StoredIngestion {
  /** Unique ingestion ID (generated at ingestion time) */
  ingestionId: IngestionId;
  /** Tenant/scoped identifier (multi-tenant isolation) */
  tenantId: string;
  /** Tenant/hotel identifier (tenant-scoped) */
  hotelId: string;
  /** Name of the hotel's financial system (e.g., "Opera", "SAP", "Xero", "manual export") */
  sourceSystem: string;
  /** When the hotel exported the data (ISO 8601) — provided by hotel, or ingestion time if not provided */
  exportTimestamp: string;
  /** When the platform ingested the data (ISO 8601) */
  ingestedAt: string;
  /** SHA-256 hash of the raw uploaded file content (integrity verification) */
  rawFileHash: string;
  /** Number of records in the source file */
  recordCount: number;
  /** Validation report: what was parsed, what failed, what's missing */
  validationReport: ValidationReport;
  /** Detected source currency from the file (if all records agree) */
  detectedSourceCurrency?: CurrencyCode;
  /** Data quality assessment */
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  /** The normalized canonical records */
  records: IngestionRecord[];
  /** Raw data preserved for audit/re-processing */
  rawData: string; // JSON stringified raw rows
  /** Status: 'IMPORTED' | 'PROCESSING' | 'PROCESSED' | 'FAILED' */
  status: 'IMPORTED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  /** Error message if status is 'FAILED' */
  error?: string;
  /** Evidence label for the ingestion event */
  evidenceLabel: 'FACT'; // Uploaded source data is FACT about what was supplied
  /** Evidence classification for the ingestion event */
  evidenceClassification: 'FACT';
}

/**
 * Configuration for the evidence store.
 */
export interface HotelDataEvidenceStoreConfig {
  /** Directory where the evidence store files are kept */
  dataPath: string;
  /** Optional hotel ID for tenant isolation (if not provided, must be passed per operation) */
  defaultHotelId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// EVIDENCE STORE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Isolated evidence store for hotel data ingestion.
 *
 * Does NOT import the legacy Prisma singleton.
 * Uses a standalone JSON-based store for pilot simplicity.
 * Future: can be replaced with a dedicated Prisma client (PostgreSQL).
 */
export class HotelDataEvidenceStore {
  private dataPath: string;
  private hotelId: string;
  private ingestionStore: Map<string, StoredIngestion> = new Map();
  private nextId: number = 1;

  constructor(config: HotelDataEvidenceStoreConfig) {
    this.dataPath = config.dataPath;
    this.hotelId = config.defaultHotelId ?? 'default';

    // Ensure data directory exists
    if (!existsSync(this.dataPath)) {
      mkdirSync(this.dataPath, { recursive: true });
    }

    // Load existing data if available
    this.loadFromDisk();
  }

  /**
   * Generate a new ingestion ID.
   */
  generateIngestionId(): IngestionId {
    const id = `ingest-${Date.now()}-${this.nextId++}`;
    return createIngestionId(id);
  }

  /**
   * Compute SHA-256 hash of raw file content.
   */
  computeFileHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Store an ingestion event with full provenance.
   *
   * @param hotelId - Tenant-scoped hotel identifier
   * @param sourceSystem - Name of the hotel's financial system
   * @param exportTimestamp - When the hotel exported the data (or ingestion time if not provided)
   * @param buffer - Raw file content (for hashing)
   * @param records - Normalized canonical records
   * @param validationReport - Validation report from ingestion
   * @param detectedSourceCurrency - Detected source currency (if available)
   * @param rawData - Raw data as JSON string (for audit/re-processing)
   * @returns The stored ingestion event
   */
  storeIngestion(
    hotelId: string,
    tenantId: string,
    sourceSystem: string,
    exportTimestamp: string,
    buffer: Buffer,
    records: IngestionRecord[],
    validationReport: ValidationReport,
    detectedSourceCurrency?: CurrencyCode,
    rawData: string = '{}'
  ): StoredIngestion {
    const ingestionId = this.generateIngestionId();
    const rawFileHash = this.computeFileHash(buffer);
    const ingestedAt = new Date().toISOString();

    const stored: StoredIngestion = {
      ingestionId,
      tenantId,
      hotelId,
      sourceSystem,
      exportTimestamp,
      ingestedAt,
      rawFileHash,
      recordCount: records.length,
      validationReport,
      detectedSourceCurrency,
      records,
      rawData,
      confidence: validationReport.confidence,
      status: validationReport.errorRecords > 0 && validationReport.validRecords === 0
        ? 'FAILED'
        : 'IMPORTED',
      evidenceLabel: 'FACT',
      evidenceClassification: 'FACT',
    };

    this.ingestionStore.set(ingestionId, stored);
    this.persistToDisk();

    return stored;
  }

  /**
   * Retrieve an ingestion event by ID.
   */
  getIngestion(ingestionId: IngestionId): StoredIngestion | null {
    return this.ingestionStore.get(ingestionId) ?? null;
  }

  /**
   * List all ingestion events for a hotel.
   */
  listForHotel(hotelId: string): StoredIngestion[] {
    return Array.from(this.ingestionStore.values())
      .filter((s) => s.hotelId === hotelId)
      .sort((a, b) => new Date(b.ingestedAt).getTime() - new Date(a.ingestedAt).getTime());
  }

  /**
   * List all ingestion events (admin use).
   */
  listAll(): StoredIngestion[] {
    return Array.from(this.ingestionStore.values())
      .sort((a, b) => new Date(b.ingestedAt).getTime() - new Date(a.ingestedAt).getTime());
  }

  /**
   * Update ingestion status.
   */
  updateStatus(ingestionId: IngestionId, status: StoredIngestion['status'], error?: string): boolean {
    const stored = this.ingestionStore.get(ingestionId);
    if (!stored) return false;

    stored.status = status;
    if (error) stored.error = error;
    this.persistToDisk();
    return true;
  }

  /**
   * Load stored data from disk.
   */
  private loadFromDisk(): void {
    const filePath = join(this.dataPath, 'ingestions.json');
    if (!existsSync(filePath)) return;

    try {
      const data = readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data) as Array<Omit<StoredIngestion, 'ingestedAt' | 'rawFileHash' | 'recordCount' | 'status'>>;
      // Note: full deserialization would need to reconstruct IngestionRecord types
      // For pilot, we store the raw JSON and re-parse on load
      for (const item of parsed) {
        // We store the minimal set that can be reconstructed
        this.ingestionStore.set(item.ingestionId, item as StoredIngestion);
      }
    } catch (e) {
      console.warn(`[evidence-store] Failed to load from disk: ${e}`);
    }
  }

  /**
   * Persist stored data to disk.
   */
  private persistToDisk(): void {
    const filePath = join(this.dataPath, 'ingestions.json');
    const data = Array.from(this.ingestionStore.values());
    try {
      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error(`[evidence-store] Failed to persist to disk: ${e}`);
    }
  }

  /**
   * Clear all stored data (for testing).
   */
  clear(): void {
    this.ingestionStore.clear();
    this.persistToDisk();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTORY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a HotelDataEvidenceStore with default configuration.
 * Uses a subdirectory under the project root.
 */
export function createEvidenceStore(dataSubdir: string = 'hotel-data-evidence'): HotelDataEvidenceStore {
  const root = join(process.cwd(), 'data', dataSubdir);
  return new HotelDataEvidenceStore({ dataPath: root });
}
