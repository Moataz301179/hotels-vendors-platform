import { NextResponse } from "next/server";

// Release identity must be read from the running process, not frozen into a
// statically generated route during the build.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "hotelsvendors",
    version: "v2",
    releaseId: process.env.HV_RELEASE_ID ?? null,
    sourceCommit: process.env.HV_SOURCE_SHA ?? null,
    time: new Date().toISOString(),
  });
}
