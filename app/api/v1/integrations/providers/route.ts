import { NextResponse } from 'next/server';
import { integrationEngine } from '@/lib/integrations/engine';
import { integrationAdminRoute } from '@/lib/integrations/admin-route';

export const GET = integrationAdminRoute(async () => {
  return NextResponse.json(integrationEngine.listProviders());
});

export const POST = integrationAdminRoute(async (request) => {
  try {
    const body = await request.json();
    const provider = integrationEngine.registerProvider(body);
    return NextResponse.json(provider, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
});

