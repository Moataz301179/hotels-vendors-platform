import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/v2-auth";
import { requirePermission } from "@/lib/auth/rbac";
import { PermissionDeniedError } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import {
  recordOlivOnboardingChoice,
  OLIV_ONBOARDING_CHOICES,
  type OlivOnboardingChoice,
} from "@/lib/oliv/onboarding-referral";

const payload = z.object({
  choice: z.enum(OLIV_ONBOARDING_CHOICES as unknown as [string, ...string[]]),
  existingOlivCustomerId: z.string().trim().max(120).optional(),
});

/**
 * Record a hotel's Oliv Finance onboarding choice.
 *
 * This endpoint never calls Oliv, never approves anything, and never invents an
 * application status. It records that the hotel was introduced to the agreed
 * Oliv process and what it chose, preserving the CHV000 referral attribution.
 */
export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  // Only a hotel is introduced to Oliv during onboarding.
  if (actor.platformRole !== "HOTEL") {
    return NextResponse.json({ error: "HOTEL_ROLE_REQUIRED" }, { status: 403 });
  }

  try {
    await requirePermission(
      { userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole },
      "order:read",
    );
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ error: "ONBOARDING_PERMISSION_REQUIRED" }, { status: 403 });
    }
    throw error;
  }

  const parsed = payload.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose one of: referral, existing or later." },
      { status: 400 },
    );
  }

  const hotel = await prisma.hotel.findFirst({
    where: { tenantId: actor.tenantId, deletedAt: null },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  const outcome = await recordOlivOnboardingChoice({
    hotelId: hotel?.id ?? null,
    tenantId: actor.tenantId,
    userId: actor.id,
    choice: parsed.data.choice as OlivOnboardingChoice,
    existingOlivCustomerId: parsed.data.existingOlivCustomerId,
  });

  return NextResponse.json(outcome, { status: 201 });
}
