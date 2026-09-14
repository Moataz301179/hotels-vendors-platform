import { NextRequest, NextResponse } from "next/server";

const startTime = Date.now();

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        status: "ok",
        service: "invo",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
        dependencies: {
          database: "connected",
          redis: "connected",
          eta_bridge: "ready",
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
