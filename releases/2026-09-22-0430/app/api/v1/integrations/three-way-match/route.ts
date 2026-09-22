import { NextResponse } from 'next/server';
import { integrationEngine } from "@/lib/stubs-export";

export async function POST(request: Request) {
  try {
    const { poId, receivingSlipId, invoiceId } = await request.json();
    const result = await integrationEngine.matchThreeWay(poId, receivingSlipId, invoiceId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
