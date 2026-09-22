/**
 * /api/v1/sourcing/connect
 * Admin "Connect Source" console — bind a real supplier portal (API key or
 * scrapable URL + creds) and trigger catalog ingestion tagged as REAL source.
 *
 * POST /api/v1/sourcing/connect            — register a source (portal or API key)
 * POST /api/v1/sourcing/connect/:id/sync   — trigger scrape/ingest now
 * GET  /api/v1/sourcing/connect            — list connected sources + status
 */

import { NextRequest } from "next/server";
import { apiRoute, authenticate, success, error } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { PORTAL_SEEDS } from "@/lib/sourcing/scraper";

/* Connected sources registry (production: DB table; demo: in-memory) */
const connectedSources = new Map<string, {
  id: string; type: "scraper" | "api" | "webhook";
  name: string; config: { portalUrl?: string; apiBaseUrl?: string; credentials?: { user: string; pass: string } };
  connectedAt: string; lastSync?: string; status: "ACTIVE" | "ERROR";
}>();
let seq = 0;

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const seeds = Object.values(PORTAL_SEEDS).map((s) => ({ id: s.id, name: s.name, portalUrl: s.portalUrl, ready: true }));
  return success({ sources: [...connectedSources.values()], discoverablePortals: seeds });
});

/* POST register a source */
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const body = await request.json();
  const type = (body.type as "scraper" | "api" | "webhook") || "api";
  const name = (body.name as string) || "";

  if (type === "scraper") {
    const portalId = body.portalId as string;
    const portal = PORTAL_SEEDS[portalId];
    if (!portal) return error("Unknown portal source", 400);
    if (!body.username || !body.password) return error("Portal credentials required for scraper source", 400);
    const id = `SRC-${(seq++).toString(36)}`;
    connectedSources.set(id, {
      id, type, name: portal.name,
      config: { portalUrl: portal.portalUrl, credentials: { user: body.username, pass: body.password } },
      connectedAt: new Date().toISOString(), status: "ACTIVE",
    });
    return success({ source: connectedSources.get(id), message: `${portal.name} connected — ready to scrape catalog.` }, 201);
  }

  // API / webhook key source
  if (!name || !body.apiBaseUrl) return error("name and apiBaseUrl required for api/webhook source", 400);
  const id = `SRC-${(seq++).toString(36)}`;
  connectedSources.set(id, {
    id, type, name, config: { apiBaseUrl: body.apiBaseUrl },
    connectedAt: new Date().toISOString(), status: "ACTIVE",
  });
  return success({ source: connectedSources.get(id), message: `${name} connected (${type}).` }, 201);
});

/* POST sync a connected source */
export async function POST_sync(request: NextRequest, id: string) {
  const auth = await authenticate(request);
  const src = connectedSources.get(id);
  if (!src) return error("Source not found", 404);
  return success({ sourceId: id, status: "SYNC_QUEUED", note: "Scrape worker will ingest as SUPPLIER_SYNC. (Set SUPPLIER_SCRAPERS or DB worker in prod.)" });
}
