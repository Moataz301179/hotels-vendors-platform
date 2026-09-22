/**
 * Product Acquisition API — external ecommerce → marketplace
 *
 * GET  /api/v1/sourcing/providers  — list available sourcing providers
 * POST /api/v1/sourcing/acquire     — trigger acquisition from a provider
 * GET  /api/v1/sourcing/acquire     — preview candidates for a provider
 */

import { NextRequest } from "next/server";
import { apiRoute, authenticate, success, error, requirePermission } from "@/lib/api-utils";
import { listProviders, getProvider, acquireProductCatalog } from "@/lib/sourcing/product-acquisition";

/* ── POST Acquire ── */
export async function POST_ACQUIRE(request: NextRequest) {
  const auth = await authenticate(request);
  await requirePermission(auth, "catalog:manage");

  const body = await request.json().catch(() => ({}));
  const provider = (body.provider as string) || "";
  const filters = (body.filters as Record<string, unknown>) || {};

  if (!provider) return error("provider is required", 400);
  if (!getProvider(provider)) return error(`Unknown provider: ${provider}`, 400);

  // Credentials should come from tenant settings in production; here we
  // require the caller to pass a portal/api base so nothing is hardcoded.
  const creds = {
    apiKey: (body.apiKey as string) || undefined,
    portalUrl: (body.portalUrl as string) || undefined,
  };

  const result = await acquireProductCatalog(provider, creds, filters);

  return success({
    provider: result.provider,
    acquired: result.acquired,
    skipped: result.skipped,
    products: result.products,
    errors: result.errors,
  });
}

/* ── GET Preview candidates ── */
export async function GET_PREVIEW(request: NextRequest) {
  const auth = await authenticate(request);
  await requirePermission(auth, "catalog:manage");

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") || "";
  if (!getProvider(provider)) return error(`Unknown provider: ${provider}`, 400);

  const result = await acquireProductCatalog(provider, {}, {});
  return success({ provider, products: result.products, errors: result.errors });
}

// Next.js App Router exports
export const GET = GET_PREVIEW;   // /api/v1/sourcing/acquire?provider=taager
export const POST = POST_ACQUIRE; // /api/v1/sourcing/acquire