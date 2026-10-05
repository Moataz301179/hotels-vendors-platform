import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/v2-auth";
import { aggregateHotelDemand } from "@/lib/demand/aggregation";

const querySchema = z.object({
  days: z.coerce.number().int().min(7).max(180).default(30),
  minHotels: z.coerce.number().int().min(1).max(100).default(2),
});
export async function GET(request: NextRequest) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (!["HOTEL", "ADMIN"].includes(actor.platformRole)) return NextResponse.json({ error: "Hotel workspace access required" }, { status: 403 });
  const parsed = querySchema.safeParse({
    days: request.nextUrl.searchParams.get("days") ?? undefined,
    minHotels: request.nextUrl.searchParams.get("minHotels") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "Use 7–180 days and 1–100 hotels, in whole numbers." }, { status: 400 });
  try {
    const demand = await aggregateHotelDemand(actor.tenantId, parsed.data);
    return NextResponse.json({ data: { demand, summary: {
      opportunities: demand.length,
      aggregatedQuantity: demand.reduce((sum, row) => sum + row.requestedQuantity, 0),
      spendByCurrency: [...demand.reduce((totals, row) => { totals.set(row.currency, (totals.get(row.currency) ?? 0) + row.currentSpend); return totals; }, new Map<string, number>()).entries()].map(([currency, amount]) => ({ currency, amount: Number(amount.toFixed(2)) })).sort((a, b) => a.currency.localeCompare(b.currency)),
      highSignal: demand.filter(row => row.volumeDealSignal === "HIGH").length,
    } } });
  } catch {
    return NextResponse.json({ error: "Demand is temporarily unavailable. Please retry." }, { status: 503 });
  }
}
