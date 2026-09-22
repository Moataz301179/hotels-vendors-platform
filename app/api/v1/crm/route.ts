import { NextResponse } from 'next/server';
import { getCRMDashboardStats } from "@/lib/stubs-export";

export async function GET() {
  return NextResponse.json(getCRMDashboardStats());
}
