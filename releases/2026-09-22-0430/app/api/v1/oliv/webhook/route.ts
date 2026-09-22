import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyOlivWebhook, handleOlivWebhook } from "@/lib/payments/oliv/index";

const OlivStatusUpdateSchema = z.object({
  factoringRequestId: z.string(),
  invoiceId: z.string(),
  previousStatus: z.enum(["INITIALIZED", "UNDER_REVIEW", "APPROVED", "REJECTED", "DISBURSED", "MATURED", "DEFAULTED", "CANCELLED"]),
  newStatus: z.enum(["INITIALIZED", "UNDER_REVIEW", "APPROVED", "REJECTED", "DISBURSED", "MATURED", "DEFAULTED", "CANCELLED"]),
  updatedAt: z.string(),
  metadata: z.object({
    disbursedAmount: z.number().optional(),
    disbursedAt: z.string().optional(),
    maturityDate: z.string().optional(),
    rejectionReason: z.string().optional(),
    approvedAdvanceRate: z.number().optional(),
    approvedDiscountRate: z.number().optional(),
  }).optional(),
});

const OlivWebhookPayloadSchema = z.object({
  event: z.literal("FACTORING_STATUS_UPDATE"),
  timestamp: z.string(),
  data: OlivStatusUpdateSchema,
  signature: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { received: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const validation = OlivWebhookPayloadSchema.safeParse(parsed);
    if (!validation.success) {
      return NextResponse.json(
        { received: false, error: validation.error.issues[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    if (!verifyOlivWebhook(validation.data)) {
      return NextResponse.json(
        { received: false, error: "Webhook verification failed" },
        { status: 401 }
      );
    }

    await handleOlivWebhook(rawBody);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Oliv Webhook] Error:", error);
    return NextResponse.json(
      { received: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
