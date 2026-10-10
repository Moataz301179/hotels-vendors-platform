import { NextResponse } from "next/server";

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
