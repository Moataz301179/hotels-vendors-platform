/**
 * app/api/v1/spend/records/route.ts
 * GET /api/v1/spend/records — List spend records for tenant
 * Supports filtering by date range, supplier, category, resolution status
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

const VALID_RESOLUTION_STATUSES = ["RESOLVED", "PARTIAL", "UNRESOLVED"];

export async function GET(request: NextRequest) {
  try {
    // Auth
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
    const { searchParams } = new URL(request.url);

    // Build filter
    const where: Record<string, unknown> = { tenantId };

    // Date range filter
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate || endDate) {
      where.normalizedDate = {};
      if (startDate) {
        (where.normalizedDate as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.normalizedDate as Record<string, unknown>).lte = new Date(endDate);
      }
    }

    // Supplier filter
    const supplierId = searchParams.get("supplierId");
    if (supplierId) {
      where.supplierId = supplierId;
    }

    // Supplier name fuzzy search
    const supplierName = searchParams.get("supplierName");
    if (supplierName) {
      where.supplierName = { contains: supplierName, mode: "insensitive" };
    }

    // Category filter
    const category = searchParams.get("category");
    if (category) {
      where.category = category;
    }

    // Resolution status filter
    const status = searchParams.get("status");
    if (status) {
      const statuses = status.split(",").filter((s: string) =>
        VALID_RESOLUTION_STATUSES.includes(s.toUpperCase())
      );
      if (statuses.length > 0) {
        where.resolutionStatus = { in: statuses };
      }
    }

    // SKU filter
    const sku = searchParams.get("sku");
    if (sku) {
      where.sku = sku;
    }

    // PO Number filter
    const poNumber = searchParams.get("poNumber");
    if (poNumber) {
      where.poNumber = { contains: poNumber };
    }

    // Invoice Number filter
    const invoiceNumber = searchParams.get("invoiceNumber");
    if (invoiceNumber) {
      where.invoiceNumber = { contains: invoiceNumber };
    }

    // Pagination
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const skip = (page - 1) * limit;

    // Sorting
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("order") === "asc" ? "asc" : "desc";

    const validSortFields = [
      "createdAt", "normalizedDate", "totalAmount",
      "supplierName", "category", "resolutionStatus"
    ];
    const orderBy: Record<string, string> = {};
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = "desc";
    }

    // Execute query
    const [records, totalCount] = await Promise.all([
      prisma.spendUploadRecord.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.spendUploadRecord.count({ where }),
    ]);

    // Aggregate stats for the filtered set
    const stats = await prisma.spendUploadRecord.groupBy({
      by: ["resolutionStatus"],
      where,
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        stats: stats.map((s: { resolutionStatus: string; _count: { id: number }; _sum: { totalAmount: unknown } }) => ({
          status: s.resolutionStatus,
          count: s._count.id,
          totalAmount: s._sum.totalAmount,
        })),
      },
    });
  } catch (error) {
    console.error("[SPEND_RECORDS_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch records",
      },
      { status: 500 }
    );
  }
}
