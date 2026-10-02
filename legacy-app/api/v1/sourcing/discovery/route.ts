/**
 * /api/v1/sourcing/discovery
 * Apify autonomous supplier sourcing.
 * POST /run   — dispatch a discovery actor run (real market extraction)
 * GET         — list discovered suppliers (real leads) + dispatch status
 */

import { NextRequest } from "next/server";
import { apiRoute, authenticate, success, error } from "@/lib/api-utils";
import { runDiscoveryActor } from "@/lib/sourcing/apify";
import { prisma } from "@/lib/prisma";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  // Discovered suppliers = names starting with APIFY- tax id origin OR real leads.
  const discovered = await prisma.supplier.findMany({
    where: { tenantId: auth.tenantId, taxId: { startsWith: "APIFY-" } },
    select: { id: true, name: true, taxId: true, status: true, createdAt: true },
    take: 100,
  });
  return success({ discovered, note: "Real market leads from autonomous sourcing. Connect portal/API to ingest catalogs." });
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const body = await request.json().catch(() => ({}));
  const { runDiscoveryActor } = await import("@/lib/sourcing/apify");
  const { enqueueSourceJob } = await import("@/lib/queue");

  // Enqueue as a durable job first (deduped by key); fall back to inline.
  const queued = await enqueueSourceJob({
    type: "apify-discovery", jobKey: "apify-discovery", payload: body.inputs,
  });
  if (queued.enqueued) {
    return success({ queued: true, jobId: queued.jobId, note: "Discovery run queued; results will ingest as real supplier leads." }, 202);
  }
  const result = await runDiscoveryActor(body.inputs);
  if (!result.started) {
    return success({
      queued: false,
      actorId: result.actorId,
      note: "APIFY_API_TOKEN not configured — add server-side env to enable autonomous discovery. The engine is built and ready.",
    });
  }
  return success({ queued: true, runId: result.runId, actorId: result.actorId, note: "Discovery run dispatched; results will ingest as real supplier leads." }, 202);
});