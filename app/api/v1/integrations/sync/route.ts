import { NextResponse } from 'next/server';
import { integrationEngine } from '@/lib/integrations/engine';
import { integrationAdminRoute } from '@/lib/integrations/admin-route';

export const POST = integrationAdminRoute(async (request) => {
  try {
    const { providerId, direction, entity } = await request.json();
    const job = direction === 'inbound'
      ? await integrationEngine.syncInbound(providerId, entity)
      : await integrationEngine.syncOutbound(providerId, entity);
    return NextResponse.json(job);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
});

export const GET = integrationAdminRoute(async () => {
  return NextResponse.json(integrationEngine.getSyncJobs());
});

