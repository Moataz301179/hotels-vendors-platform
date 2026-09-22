import { NextResponse } from 'next/server';
import { integrationEngine } from "@/lib/stubs-export";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await integrationEngine.triggerWebhook(body);
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json(integrationEngine.getWebhookQueue());
}
