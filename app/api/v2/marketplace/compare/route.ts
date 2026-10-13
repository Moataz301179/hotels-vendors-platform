import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/v2-auth";
import { compareMarketOffers } from "@/lib/sourcing/scrapegraph-discovery";

const requestSchema = z.object({ query: z.string().trim().min(2).max(160), quantity: z.number().int().min(1).max(100000) });

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (actor.platformRole !== "HOTEL" && actor.platformRole !== "ADMIN") return NextResponse.json({ error: "HOTEL_ROLE_REQUIRED" }, { status: 403 });
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Product query and positive quantity are required" }, { status: 400 });
  try {
    const comparison = await compareMarketOffers(parsed.data);
    return NextResponse.json({ comparison, caveat: "These are observed public-source offers, not verified supplier terms. Request a quote before purchase; no order or product record is created by this search." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SCRAPEGRAPH_SEARCH_FAILED";
    return NextResponse.json({ error: message, configured: message !== "SCRAPEGRAPH_NOT_CONFIGURED" }, { status: message === "SCRAPEGRAPH_NOT_CONFIGURED" ? 503 : 502 });
  }
}
