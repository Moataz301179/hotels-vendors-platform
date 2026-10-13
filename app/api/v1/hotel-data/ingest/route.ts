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
import { ingest } from '@/lib/hotel-data/ingestion-api';
import { createEvidenceStore, type HotelDataEvidenceStore, type StoredIngestion } from '@/lib/hotel-data/hotel-data-evidence-store';
import { normalizeAccount, normalizeTransaction } from '@/lib/hotel-data/normalizer';
import { createIngestionId } from '@/lib/hotel-data/evidence-chain';
import { normalizeCurrencyCode, type IngestionRecord } from '@/lib/hotel-data/canonical-schema';
import { authenticate, requirePermission, handleApiError } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
const UploadFields = z.object({ hotelId: z.string().min(1), sourceSystem: z.string().min(1).max(100), exportTimestamp: z.string().datetime() });

// ─────────────────────────────────────────────────────────────────────────────
// STORE (singleton per process — for pilot, in-memory + JSON disk)
// ─────────────────────────────────────────────────────────────────────────────

let evidenceStore: HotelDataEvidenceStore | null = null;

function getStore(): HotelDataEvidenceStore {
  if (!evidenceStore) {
    // Use a subdirectory under the project data folder
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
async function extractFile(formData: FormData): Promise<{ buffer: Buffer; filename: string } | null> {
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return null;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = file.name || 'upload';

  return { buffer, filename };
}

/**
 * Compute SHA-256 hash of a buffer.
 */

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
    const auth = await authenticate(request);
    await requirePermission(auth, "invoice:write");
    const formData = await request.formData();
    // Step 1: Extract file
    const fileResult = await extractFile(formData);
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
    const hotelId = (formData.get('hotelId') as string | null)?.trim();
    const sourceSystem = (formData.get('sourceSystem') as string | null)?.trim();
    const tenantId = auth.tenantId;
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

    UploadFields.parse({ hotelId, sourceSystem, exportTimestamp });
    if (!await prisma.hotel.findFirst({ where: { id: hotelId, tenantId }, select: { id: true } })) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

    // Step 6: Parse and validate via ingestion-api.ts
    const parseResult = await ingest({
      data: buffer,
      options: { sourceSystem },
    });

    // Step 7: Persist normalized records to evidence store
    // (ingest() already normalizes internally; normalizedTransactions is ready to persist)

    // Step 8: Persist to evidence store
    const store = getStore();
    const context = { ingestionId: createIngestionId(parseResult.ingestionId), sourceSystem };
    const records: IngestionRecord[] = parseResult.normalizedTransactions.map((record, index) => {
      if (!normalizeCurrencyCode(record.currency)) throw new Error('Validated source currency is required');
      if (record.accountCode !== undefined) return { kind: 'account', data: { ...normalizeAccount({ ...record, ...record.rawData, currency: record.currency }, context, index), id: record.id } };
      return { kind: 'transaction', data: { ...normalizeTransaction({ ...record, ...record.rawData, invoiceAmount: record.invoiceAmount?.value, unitPrice: record.unitPrice?.value, currency: record.currency }, context, index), id: record.id } };
    });

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
      records,
      parseResult.validationReport,
      normalizeCurrencyCode(parseResult.detectedSourceCurrency) ?? undefined,
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
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid upload metadata' }, { status: 400 });
    if (error instanceof Error && 'statusCode' in error) return handleApiError(error);
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
    const auth = await authenticate(request);
    await requirePermission(auth, "invoice:read");
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId')?.trim();

    const store = getStore();

    let ingestions: StoredIngestion[];
    if (hotelId) {
      ingestions = store.listForHotel(hotelId).filter(record => record.tenantId === auth.tenantId);
    } else {
      ingestions = store.listAll().filter(record => record.tenantId === auth.tenantId);
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
    if (error instanceof Error && 'statusCode' in error) return handleApiError(error);
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
