import { NextRequest, NextResponse } from "next/server";
import { requireServiceKey, handleApiError } from "@/lib/api-utils";
import { getPartnerStatus } from "@/lib/invo/partner-store";

/**
 * GET /api/v1/invo/partners/status/[id]
 *
 * Check an INVO partner's onboarding status.
 * Reads from the InvoPartner table via Prisma — NOT in-memory.
 *
 * Auth: Bearer INVO_SERVICE_KEY (platform service key).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireServiceKey(request, "INVO_SERVICE_KEY");

    const { id } = await params;
    const partner = await getPartnerStatus(id);

    if (!partner) {
      return NextResponse.json(
        { success: false, error: "Partner not found", code: "PARTNER_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        partnerId: partner.partnerId,
        status: partner.status,
        type: partner.type,
        name: partner.name,
        submittedAt: partner.submittedAt,
        reviewedAt: partner.reviewedAt,
        reviewerNotes: partner.reviewerNotes,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
