import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Release identity must be read from the running process, not frozen into a
// statically generated route during the build.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const relations = await prisma.$queryRaw<Array<Record<string, string | null>>>`
      SELECT
        to_regclass('public."User"') AS "user",
        to_regclass('public."Product"') AS "product",
        to_regclass('public."RfqRequest"') AS "rfq",
        to_regclass('public."ProcurementQuote"') AS "quote",
        to_regclass('public."Order"') AS "order",
        to_regclass('public."GoodsReceiptNote"') AS "goodsReceipt",
        to_regclass('public."EvidenceRecord"') AS "evidence",
        to_regclass('public."AuditLog"') AS "audit"`;
    const requiredRelations = ["user", "product", "rfq", "quote", "order", "goodsReceipt", "evidence", "audit"];
    if (!relations[0] || requiredRelations.some((relation) => !relations[0][relation])) {
      throw new Error("PRODUCTION_SCHEMA_NOT_READY");
    }
  } catch {
    return NextResponse.json({
      ok: false,
      service: "hotelsvendors",
      version: "v2",
      releaseId: process.env.HV_RELEASE_ID ?? null,
      sourceCommit: process.env.HV_SOURCE_SHA ?? null,
      database: "unavailable",
      time: new Date().toISOString(),
    }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    service: "hotelsvendors",
    version: "v2",
    releaseId: process.env.HV_RELEASE_ID ?? null,
    sourceCommit: process.env.HV_SOURCE_SHA ?? null,
    database: "ready",
    time: new Date().toISOString(),
  });
}
