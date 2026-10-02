import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireServiceKey, handleApiError } from "@/lib/api-utils";
import { onboardPartner, type InvoPartnerInput } from "@/lib/invo/partner-store";

/**
 * POST /api/v1/invo/partners/onboard
 *
 * Register a new INVO partner (supplier | logistics | bank).
 * Persisted to the InvoPartner table via Prisma — NOT in-memory.
 *
 * Auth: Bearer INVO_SERVICE_KEY (platform service key).
 */

const OnboardPartnerSchema = z.object({
  type: z.enum(["supplier", "logistics", "bank"], {
    error: () => ({ message: "type must be supplier, logistics, or bank" }),
  }),
  name: z.string().min(1, "name is required"),
  taxId: z.string().min(1, "taxId is required"),
  email: z.string().email("email must be a valid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  contactName: z.string().optional(),
  address: z.string().optional(),
  categories: z.array(z.string()).optional(),
  documents: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    requireServiceKey(request, "INVO_SERVICE_KEY");

    const body = await request.json().catch(() => {
      throw new Error("Invalid JSON body");
    });

    const parsed = OnboardPartnerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const input: InvoPartnerInput = {
      type: parsed.data.type,
      name: parsed.data.name,
      taxId: parsed.data.taxId,
      email: parsed.data.email || undefined,
      phone: parsed.data.phone,
      contactName: parsed.data.contactName,
      address: parsed.data.address,
      categories: parsed.data.categories,
      documents: parsed.data.documents,
    };

    const partner = await onboardPartner(input);

    return NextResponse.json(
      {
        success: true,
        data: {
          partnerId: partner.partnerId,
          status: partner.status,
          submittedAt: partner.submittedAt,
          reviewUrl: `https://invo.hotelsvendors.com/partner/status/${partner.partnerId}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
