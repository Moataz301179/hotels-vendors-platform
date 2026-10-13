import { NextResponse } from 'next/server';
import { integrationEngine } from '@/lib/integrations/engine';
import { integrationAdminRoute } from '@/lib/integrations/admin-route';

type RouteContext = { params: Promise<{ id: string }> };

export const GET = integrationAdminRoute(async (_request, context) => {
  const { id } = await (context as RouteContext).params;
  const provider = integrationEngine.getProvider(id);
  if (!provider) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(provider);
});

export const PATCH = integrationAdminRoute(async (request, context) => {
  const { id } = await (context as RouteContext).params;
  try {
    const body = await request.json();
    const updated = integrationEngine.updateProvider(id, body);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
});

export const DELETE = integrationAdminRoute(async (_request, context) => {
  const { id } = await (context as RouteContext).params;
  const deleted = integrationEngine.deleteProvider(id);
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
});
