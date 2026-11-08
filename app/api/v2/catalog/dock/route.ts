import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/v2-auth";
import { requirePermission } from "@/lib/auth/rbac";
import { PermissionDeniedError } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { receiveRawListings, type RawListingInput } from "@/lib/catalog/raw-dock";

const listingSchema = z.object({
  itemName: z.string().trim().min(1).max(400),
  itemNameAr: z.string().trim().max(400).optional(),
  categoryCode: z.string().trim().min(1).max(40),
  technicalSpecs: z.record(z.string(), z.unknown()).optional(),
  imageUrls: z.array(z.string().url()).max(12).optional(),
  imageRightsStatus: z.string().trim().max(40).optional(),
  defaultMoq: z.number().int().positive().max(100000).optional(),
  estimatedPriceEgp: z.number().positive().max(100000000).optional(),
  egsCode: z.string().trim().max(40).optional(),
  taxCodeScheme: z.enum(["EGS", "GS1", "HV_INTERNAL"]).optional(),
  sourceRecordKey: z.string().trim().max(200).optional(),
  sourceObservedAt: z.string().datetime().optional(),
});

const intakeSchema = z.object({
  sourceName: z.string().trim().min(1).max(160),
  attributionSource: z.string().trim().min(1).max(80),
  accessPolicy: z.string().trim().min(1).max(80),
  listings: z.array(listingSchema).min(1).max(500),
});

/**
 * POST /api/v2/catalog/dock — receive a batch of raw listings into the dock.
 *
 * Nothing enters the buyer-facing catalog here. Every record lands as a
 * CatalogStagingItem with attribution, awaiting agent staging.
 */
export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  try {
    await requirePermission(
      { userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole },
      "product:create",
    );
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ error: "CATALOG_DOCK_PERMISSION_REQUIRED" }, { status: 403 });
    }
    throw error;
  }

  const parsed = intakeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid dock intake payload.", detail: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await receiveRawListings({
    tenantId: actor.tenantId,
    actorId: actor.id,
    sourceName: parsed.data.sourceName,
    attributionSource: parsed.data.attributionSource,
    accessPolicy: parsed.data.accessPolicy,
    listings: parsed.data.listings.map((l) => ({
      ...l,
      sourceObservedAt: l.sourceObservedAt ? new Date(l.sourceObservedAt) : undefined,
    })) as RawListingInput[],
  });

  return NextResponse.json(result, { status: 201 });
}

/**
 * GET /api/v2/catalog/dock — list staged dock items for this tenant's catalog.
 *
 * Dock records are internal. They are never served to buyer catalog routes.
 */
export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  try {
    await requirePermission(
      { userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole },
      "product:read",
    );
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ error: "CATALOG_DOCK_PERMISSION_REQUIRED" }, { status: 403 });
    }
    throw error;
  }

  const items = await prisma.catalogStagingItem.findMany({
    where: { status: { in: ["STAGED", "PENDING_REVIEW"] } },
    orderBy: { sourceObservedAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ items });
}
