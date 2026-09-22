import { NextResponse } from 'next/server';
import { integrationEngine } from "@/lib/stubs-export";

export async function GET() {
  return NextResponse.json(integrationEngine.listProviders());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const provider = integrationEngine.registerProvider(body);
    return NextResponse.json(provider, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
