import { NextResponse } from 'next/server';
import { integrationEngine } from "@/lib/stubs-export";

export async function POST(request: Request) {
  try {
    const { providerId, direction, entity } = await request.json();
    const job = direction === 'inbound'
      ? await integrationEngine.syncInbound(providerId, entity)
      : await integrationEngine.syncOutbound(providerId, entity);
    return NextResponse.json(job);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json(integrationEngine.getSyncJobs());
}
