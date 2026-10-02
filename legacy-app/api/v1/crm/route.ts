import { NextResponse } from 'next/server';
import { getCRMDashboardStats } from '@/lib/integrations/engine';

export async function GET() {
  return NextResponse.json(getCRMDashboardStats());
}

