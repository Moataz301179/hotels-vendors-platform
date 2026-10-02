/**
 * /api/v1/logistics/providers
 * GET  → list Egyptian providers + connection status (+ ?mode=quote for quotes)
 * POST → connect a provider API key (operational immediately)
 */

import { NextRequest } from "next/server";
import { apiRoute, authenticate, success, error } from "@/lib/api-utils";
import { listProviders, getProvider } from "@/lib/logistics/providers";
import { quoteCorridor, arbitrageBestRate } from "@/lib/logistics/cost-matrix";
import { prisma } from "@/lib/prisma";

export const providerCache: Record<string, string> = {};
export async function readConnectedKeys(): Promise<string[]> { return Object.keys(providerCache); }

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const { searchParams } = new URL(request.url);

  if (searchParams.get("mode") === "quote") {
    const dest = searchParams.get("to") || "Cairo";
    const parcels = Number(searchParams.get("parcels")) || 1;
    const weight = Number(searchParams.get("weight")) || 1;
    const service = (searchParams.get("service") === "EXPRESS" ? "EXPRESS" : "REGULAR") as "EXPRESS" | "REGULAR";
    const pref = searchParams.get("provider");
    const avail = Object.keys(providerCache).length ? Object.keys(providerCache) : ["bosta", "mylerz", "onetrolley"];

    if (pref && pref !== "auto" && getProvider(pref)) {
      const q = quoteCorridor(dest, parcels, weight, service, pref);
      return success({ mode: "quote", single: q, connected: avail });
    }
    const best = arbitrageBestRate(dest, parcels, weight, service, avail, undefined);
    return success({ mode: "quote", arbitrated: best, connected: avail });
  }

  const providers = listProviders().map((p) => ({
    id: p.id, name: p.name, type: p.type, apiBaseUrl: p.apiBaseUrl,
    deliveryTypes: p.deliveryTypes, coverage: p.coverage, connected: !!providerCache[p.id],
  }));
  return success({ providers });
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  const body = await request.json();
  const providerId = (body.providerId as string) || "";
  const apiKey = (body.apiKey as string) || "";

  if (!getProvider(providerId)) return error("Unknown provider", 400);
  if (!apiKey) return error("apiKey is required", 400);

  providerCache[providerId] = apiKey;
  await prisma.auditLog.create({
    data: { tenantId: auth.tenantId, entityId: `logistics:${providerId}`, actorId: auth.userId, actionType: "UPDATE", changes: { providerId, action: "API_KEY_CONNECTED" } },
  });
  const provider = getProvider(providerId)!;
  return success({ connected: true, providerId, providerName: provider.name, message: `${provider.name} connected — shipping live now.` });
});
