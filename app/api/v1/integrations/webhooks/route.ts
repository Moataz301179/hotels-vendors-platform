import { NextResponse } from 'next/server';
import { integrationEngine } from '@/lib/integrations/engine';
import { integrationAdminRoute } from '@/lib/integrations/admin-route';

export const POST = integrationAdminRoute(async (request) => {
  try {
    const body = await request.json();
    const result = await integrationEngine.triggerWebhook(body);
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
});

export const GET = integrationAdminRoute(async () => {
  return NextResponse.json(integrationEngine.getWebhookQueue());
});
