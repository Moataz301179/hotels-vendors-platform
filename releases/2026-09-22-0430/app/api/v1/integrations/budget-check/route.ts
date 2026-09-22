import { NextResponse } from 'next/server';
import { integrationEngine } from "@/lib/stubs-export";

export async function POST(request: Request) {
  try {
    const { hotelId, amount } = await request.json();
    const result = await integrationEngine.checkBudget(hotelId, amount);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
