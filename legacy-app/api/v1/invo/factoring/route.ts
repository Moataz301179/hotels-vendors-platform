import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { authenticate, requirePermission } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

const InvoFactoringCreateSchema = z.object({
  invoice_id: z.string().min(1, "Invoice ID is required"),
  hotel_id: z.string().min(1, "Hotel ID is required"),
  face_value: z.number().positive("Face value must be positive"),
  creditor_name: z.string().optional(),
  debtor_name: z.string().optional(),
  maturity_date: z.string().optional(),
});

const InvoFactoringQuerySchema = z.object({
  hotel_id: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

/**
 * POST /api/v1/invo/factoring
 * Creates a factoring request from a qualified invoice.
 * Triggers agent_4_routing for funder matching.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    await requirePermission(auth, "invoice:factor");

    const body = await req.json();
    const parsed = InvoFactoringCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request body" },
        { status: 400 }
      );
    }
    const {
      invoice_id,
      hotel_id,
      face_value,
      creditor_name,
      debtor_name,
      maturity_date,
    } = parsed.data;

    if (auth.platformRole !== "ADMIN") {
      const hotel = await prisma.hotel.findFirst({
        where: { id: hotel_id, tenantId: auth.tenantId },
        select: { id: true },
      });
      if (!hotel) {
        return NextResponse.json({ error: "Unauthorized hotel" }, { status: 403 });
      }
    }

    const supabase = await createClient();

    // Verify invoice is qualified for factoring
    const { data: qualification } = await supabase
      .from("invoice_qualification_details")
      .select("*")
      .eq("invoice_id", invoice_id)
      .single();

    if (qualification && !qualification.factoring_eligible) {
      return NextResponse.json(
        { error: "Invoice is not eligible for factoring", qualification },
        { status: 422 }
      );
    }

    const { data: request, error } = await supabase
      .from("factoring_requests")
      .insert({
        invoice_id,
        hotel_id,
        face_value,
        creditor_name: creditor_name || null,
        debtor_name: debtor_name || null,
        maturity_date: maturity_date || null,
        status: "bidding_open",
        match_status: "not_submitted",
      })
      .select()
      .single();

    if (error || !request) {
      return NextResponse.json(
        { error: `Factoring request failed: ${error?.message}` },
        { status: 500 }
      );
    }

    // Log agent action
    await supabase.from("agent_audit_log").insert({
      agent_name: "agent_4_routing",
      action_executed: "factoring_request_created",
      invoice_id,
      previous_state: "qualified",
      new_state: "bidding_open",
    });

    return NextResponse.json({
      success: true,
      request,
      layer: "invo",
      message: "Factoring request created — funders can now bid",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/v1/invo/factoring
 * List factoring requests with bids.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = InvoFactoringQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid query parameters" },
        { status: 400 }
      );
    }
    const { hotel_id, status, limit } = parsed.data;

    const supabase = await createClient();
    let query = supabase
      .from("factoring_requests")
      .select("*, hotels(name), factoring_bids(*)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (hotel_id) query = query.eq("hotel_id", hotel_id);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requests: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
