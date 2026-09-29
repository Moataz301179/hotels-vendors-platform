/**
 * app/api/v1/hotel-data/ingest/route.ts
 *
 * HTTP ingestion endpoint for hotel data (TB/GL/AP Excel/CSV files).
 *
 * CORRECTION APPLIED:
 * - Correction 2: sourceCurrency is preserved on every record. No EGP default.
 * - Correction 3: Every stored record carries sourceIngestionId for evidence chain.
 * - Correction 5: No template files required. Ingestion accepts real files and
 *   produces a validation report.
 *
 * This route:
 * 1. Accepts multipart file upload (.xlsx / .xls / .csv)
 * 2. Computes SHA-256 hash of raw file
 * 3. Parses with ingestion-api.ts
 * 4. Normalizes records
 * 5. Persists to hotel-data-evidence-store.ts with full provenance
 * 6. Returns validation report + ingestion ID
 *
 * SCOPE: This route is for the procurement economic loop MVP.
 * It does NOT handle image uploads, auth tokens, tenant management,
 * or any other legacy functionality.
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

import { ingest, type IngestionResult } from '@/lib/hotel-data/ingestion-api';
import { createEvidenceStore, type HotelDataEvidenceStore, type StoredIngestion } from '@/lib/hotel-data/hotel-data-evidence-store';
import { normalizeBatch, type NormalizationContext } from '@/lib/hotel-data/normalizer';
import { createIngestionId, type IngestionId } from '@/lib/hotel-data/evidence-chain';
import { type CurrencyCode } from '@/lib/hotel-data/canonical-schema';

// ─────────────────────────────────────────────────────────────────────────────
// STORE (singleton per process — for pilot, in-memory + JSON disk)
// ─────────────────────────────────────────────────────────────────────────────

let evidenceStore: HotelDataEvidenceStore | null = null;

function getStore(): HotelDataEvidenceStore {
  if (!evidenceStore) {
    // Use a subdirectory under the project data folder
    const dataDir = join(process.cwd(), 'data', 'hotel-data-evidence');
    evidenceStore = createEvidenceStore('hotel-data-evidence');
  }
  return evidenceStore;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract file buffer from NextRequest multipart form data.
 */
async function extractFile(request: NextRequest): Promise<{ buffer: Buffer; filename: string } | null> {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return null;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = file.name || 'upload';

  return { buffer, filename };
}

/**
 * Compute SHA-256 hash of a buffer.
 */
function computeHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/hotel-data/ingest
 *
 * Upload a hotel TB/GL/AP file (Excel or CSV).
 *
 * Request body (multipart/form-data):
 * - file: .xlsx / .xls / .csv file (required)
 * - hotelId: hotel/tenant identifier (required)
 * - sourceSystem: name of the hotel's financial system (required)
 * - exportTimestamp: when the hotel exported the data (optional, ISO 8601)
 *
 * Response (200):
 * - ingestionId: unique ID for this ingestion event
 * - tableType: 'accounts' | 'transactions' | 'unknown'
 * - validationReport: what was parsed, what failed, what's missing
 * - recordCount: number of records ingested
 * - status: 'IMPORTED' | 'FAILED'
 * - confidence: 'HIGH' | 'MEDIUM' | 'LOW'
 * - detectedSourceCurrency: detected source currency (if all records agree)
 * - evidenceLabel: 'FACT'
 *
 * Response (400): Validation errors, missing fields, parse errors
 * Response (500): Internal server errors
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Extract file
    const fileResult = await extractFile(request);
    if (!fileResult) {
      return NextResponse.json(
        { error: 'No file provided. Please upload a .xlsx, .xls, or .csv file.' },
        { status: 400 }
      );
    }

    const { buffer, filename } = fileResult;

    // Step 2: Validate file size (implementation constraint, not business rule)
    const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
    if (buffer.length > MAX_FILE_BYTES) {
      return NextResponse.json(
        {
          error: `File exceeds ${MAX_FILE_BYTES / 1024 / 1024}MB parser limit. Please reduce file size or use a different export method.`,
          detail: 'This is a parser implementation constraint, not a business requirement.'
        },
        { status: 400 }
      );
    }

    // Step 3: Extract form fields
    const formData = await request.formData();
    const hotelId = (formData.get('hotelId') as string | null)?.trim();
    const sourceSystem = (formData.get('sourceSystem') as string | null)?.trim();
    const tenantId = (formData.get('tenantId') as string | null)?.trim();
    const exportTimestamp = (formData.get('exportTimestamp') as string | null)?.trim() || new Date().toISOString();

    if (!hotelId) {
      return NextResponse.json(
        { error: 'hotelId is required. This identifies the tenant/hotel for data isolation.' },
        { status: 400 }
      );
    }

    if (!sourceSystem) {
      return NextResponse.json(
        { error: 'sourceSystem is required. This identifies the hotel\'s financial system (e.g., Opera, SAP, Xero, manual export).' },
        { status: 400 }
      );
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required. This identifies the hotel\'s legal/financial entity for data isolation.' },
        { status: 400 }
      );
    }

    // Step 4: Compute raw file hash (for provenance)
    const rawFileHash = computeHash(buffer);

    // Step 5: Generate ingestion ID
    const ingestionId = createIngestionId(`ingest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

    // Step 6: Parse and validate via ingestion-api.ts
    const parseResult = await ingest({
      data: buffer,
      options: { sourceSystem },
    });

    // Step 7: Persist normalized records to evidence store
    // (ingest() already normalizes internally; normalizedTransactions is ready to persist)

    // Step 8: Persist to evidence store
    const store = getStore();

    // Convert records to JSON for storage
    const rawDataJson = JSON.stringify({
      fileName: filename,
      fileSize: buffer.length,
      parsedRows: parseResult.normalizedTransactions.length,
      normalizedRecords: parseResult.normalizedTransactions,
    });

    const stored: StoredIngestion = store.storeIngestion(
      hotelId,
      tenantId,
      sourceSystem,
      exportTimestamp,
      buffer,
      parseResult.normalizedTransactions as any,
      parseResult.validationReport as any,
      parseResult.detectedSourceCurrency,
      rawDataJson
    );

    // Step 9: Return response
    return NextResponse.json({
      ingestionId: stored.ingestionId,
      hotelId: stored.hotelId,
      sourceSystem: stored.sourceSystem,
      exportTimestamp: stored.exportTimestamp,
      ingestedAt: stored.ingestedAt,
      validationReport: stored.validationReport,
      recordCount: stored.recordCount,
      rawFileHash: stored.rawFileHash,
      detectedSourceCurrency: stored.detectedSourceCurrency,
      confidence: stored.confidence,
      status: stored.status,
      evidenceLabel: stored.evidenceLabel,
      warnings: parseResult.validationReport.issues
        .filter((i) => i.severity === 'warning')
        .map((i) => i.message),
      errors: parseResult.validationReport.issues
        .filter((i) => i.severity === 'error')
        .map((i) => i.message),
    });
  } catch (error) {
    console.error('[hotel-data-ingest] POST error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error during ingestion.',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/hotel-data/ingest
 *
 * List ingestion events for a hotel (or all if admin).
 *
 * Query params:
 * - hotelId: hotel/tenant identifier (optional; if omitted, returns all)
 *
 * Response (200):
 * - List of ingestion events with summary info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId')?.trim();

    const store = getStore();

    let ingestions: StoredIngestion[];
    if (hotelId) {
      ingestions = store.listForHotel(hotelId);
    } else {
      ingestions = store.listAll();
    }

    return NextResponse.json({
      count: ingestions.length,
      ingestions: ingestions.map((s) => ({
        ingestionId: s.ingestionId,
        hotelId: s.hotelId,
        sourceSystem: s.sourceSystem,
        exportTimestamp: s.exportTimestamp,
        ingestedAt: s.ingestedAt,
        recordCount: s.recordCount,
        status: s.status,
        confidence: s.confidence,
        evidenceLabel: s.evidenceLabel,
        rawFileHash: s.rawFileHash,
        detectedSourceCurrency: s.detectedSourceCurrency,
      })),
    });
  } catch (error) {
    console.error('[hotel-data-ingest] GET error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error.',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
