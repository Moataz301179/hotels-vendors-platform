import { NextResponse } from 'next/server';
import { integrationEngine } from '@/lib/integrations/engine';
import { integrationAdminRoute } from '@/lib/integrations/admin-route';

export const POST = integrationAdminRoute(async (request) => {
  try {
    const { hotelId, amount } = await request.json();
    const result = await integrationEngine.checkBudget(hotelId, amount);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
});

