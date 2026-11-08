import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/v2-auth";
import { crawlCatalogPage, IMPORT_MAX_PAGES, IMPORT_MAX_RECORDS } from "@/lib/catalog/firecrawl-pipeline";
import { importCatalogRecords } from "@/lib/catalog/firecrawl-import";

const importSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(IMPORT_MAX_PAGES),
});

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const parsed = importSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: `Provide 1–${IMPORT_MAX_PAGES} source URLs to crawl.` }, { status: 400 });
  }

  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  const pages = [];
  const allRecords = [];

  for (const url of parsed.data.urls.slice(0, IMPORT_MAX_PAGES)) {
    try {
      const page = await crawlCatalogPage({ url, firecrawlKey });
      pages.push({ url, records: page.records.length, note: page.note ?? null });
      allRecords.push(...page.records);
    } catch (error) {
      pages.push({ url, records: 0, note: error instanceof Error ? error.message.slice(0, 160) : "failed" });
    }
  }

  const bounded = allRecords.slice(0, IMPORT_MAX_RECORDS);
  try {
    const outcome = await importCatalogRecords({ tenantId: actor.tenantId, actor, records: bounded });
    return NextResponse.json({
      ...outcome,
      pages,
      provider: firecrawlKey ? "firecrawl" : "direct-fetch",
      // Honest coverage — never an "all products" claim.
      crawledPages: pages.filter((p) => p.records > 0).length,
      extractedRecords: bounded.length,
      note: "Imported records are DRAFT and unverified. They are excluded from the buyer-facing catalogue until a human verifies product, supplier and image rights.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed";
    const status = message.startsWith("Permission denied") ? 403 : 500;
    return NextResponse.json({ error: message, pages }, { status });
  }
}
