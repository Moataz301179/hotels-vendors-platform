/**
 * app/api/v1/spend/upload/route.ts
 * POST /api/v1/spend/upload — Upload CSV/Excel procurement data
 * Accepts multipart/form-data with 'file' field.
 * Parses, normalizes, stores, and returns a summary.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { parseFile } from "../../../../../lib/ingest/parser";
import { normalizeRows, detectSourceType } from "../../../../../lib/ingest/normalizer";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = ["csv", "tsv", "txt", "xlsx", "xls"];

export async function POST(request: NextRequest) {
  try {
    // Extract auth context from session
    const { verifySession, getSessionToken } = await import("../../../../../lib/session");
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 });
    }

    const tenantId = session.tenantId;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file provided. Use field name 'file'." },
        { status: 400 }
      );
    }

    // Validate file extension
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type: .${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Max size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse file
    const sourceType = detectSourceType(file.name);
    const parseResult = await parseFile(buffer, file.name);

    if (parseResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No data rows found in file",
          warnings: parseResult.warnings,
        },
        { status: 400 }
      );
    }

    // Normalize rows
    const normalizedRecords = await normalizeRows(
      parseResult.rows,
      tenantId,
      sourceType
    );

    // Store records in database
    const createdRecords = await prisma.$transaction(
      normalizedRecords.map((record) =>
        prisma.spendUploadRecord.create({
          data: {
            tenantId: record.tenantId,
            sourceType: record.sourceType,
            rawData: record.rawData as any,
            normalizedDate: record.normalizedDate,
            supplierId: record.supplierId,
            supplierName: record.supplierName,
            productId: record.productId,
            productName: record.productName,
            sku: record.sku,
            category: record.category,
            quantity: record.quantity,
            unitPrice: record.unitPrice !== null ? record.unitPrice : undefined,
            totalAmount: record.totalAmount !== null ? record.totalAmount : undefined,
            poNumber: record.poNumber,
            invoiceNumber: record.invoiceNumber,
            resolutionStatus: record.resolutionStatus,
            resolutionNotes: record.resolutionNotes.length > 0
              ? record.resolutionNotes.join("; ")
              : null,
          },
        })
      )
    );

    // Compute summary
    const summary = {
      totalRecords: createdRecords.length,
      resolved: createdRecords.filter((r: { resolutionStatus: string }) => r.resolutionStatus === "RESOLVED").length,
      partial: createdRecords.filter((r: { resolutionStatus: string }) => r.resolutionStatus === "PARTIAL").length,
      unresolved: createdRecords.filter((r: { resolutionStatus: string }) => r.resolutionStatus === "UNRESOLVED").length,
      detectedMappings: parseResult.detectedMappings,
      sourceType,
      warnings: parseResult.warnings,
    };

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("[SPEND_UPLOAD_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}
