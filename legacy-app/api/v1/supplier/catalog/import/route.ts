/**
 * POST /api/v1/supplier/catalog/import
 * Parse uploaded Excel/CSV file and return column mapping preview
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, authenticate, success, error, audit, requirePermission } from "@/lib/api-utils";
import { parseExcelBuffer, isValidExcelBuffer, generateTemplateBuffer } from "@/lib/parsers/excel-parser";
import { parseAndMapColumns } from "@/lib/ai/catalog-importer";

type FormDataEntryValue = string | File;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
  "text/csv", // .csv
  "application/csv",
];

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "product:create");

  const formData = await request.formData() as unknown as Map<string, FormDataEntryValue>;
  const file = formData.get("file") as File | null;
  const action = formData.get("action") as string | null; // "template" for download

  // Handle template download
  if (action === "template") {
    const buffer = await generateTemplateBuffer();
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="catalog-import-template.xlsx"',
      },
    });
  }

  if (!file) {
    return error("No file uploaded", 400);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`, 400);
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return error("Invalid file type. Please upload .xlsx, .xls, or .csv", 400);
  }

  // Read file buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Quick validation
  if (!await isValidExcelBuffer(buffer)) {
    return error("Invalid or corrupted Excel/CSV file", 400);
  }

  // Verify supplier access (supplier can only import for their own tenant)
  const supplier = await prisma.supplier.findFirst({
    where: {
      tenantId: auth.tenantId,
      OR: [
        { id: auth.tenantId }, // Platform tenant
        { users: { some: { id: auth.userId } } }, // Supplier user
      ],
    },
    select: { id: true },
  });

  if (!supplier && auth.platformRole !== "ADMIN") {
    return error("No supplier found for your tenant", 403);
  }

  const supplierId = supplier?.id || auth.tenantId;

  // Parse and map columns (starts async enrichment)
  const preview = await parseAndMapColumns(buffer, file.name, auth.tenantId, supplierId, auth.userId);

  // Audit log
  await audit({
    entityType: "CATALOG_IMPORT",
    entityId: preview.jobId,
    action: "PARSE",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: {
      fileName: file.name,
      totalRows: preview.totalRows,
      validRows: preview.validRows,
      errorRows: preview.errorRows,
    },
    ipAddress: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  });

  return success({
    jobId: preview.jobId,
    fileName: preview.fileName,
    totalRows: preview.totalRows,
    validRows: preview.validRows,
    errorRows: preview.errorRows,
    columns: preview.columns,
    message: "File parsed successfully. AI enrichment running in background. Poll /status endpoint.",
  });
}, { rateLimit: "api" });

export const GET = apiRoute(async (request: NextRequest) => {
  // Template download via GET
  const searchParams = request.nextUrl.searchParams;
  if (searchParams.get("template") === "true") {
    const buffer = await generateTemplateBuffer();
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="catalog-import-template.xlsx"',
      },
    });
  }

  return error("Use POST to upload a file or ?template=true to download template", 405);
});