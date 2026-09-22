import { NextResponse } from 'next/server';
import { integrationEngine } from "@/lib/stubs-export";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await integrationEngine.triggerWebhook({
      providerId: body.providerId || 'external',
      eventType: body.eventType,
      payload: body.payload,
    });
    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }
}
