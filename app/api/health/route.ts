import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Release identity must be read from the running process, not frozen into a
// statically generated route during the build.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
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
