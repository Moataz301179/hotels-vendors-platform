import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { authenticate, requirePermission } from "@/lib/api-utils";

const InvoOrderCreateSchema = z.object({
  hotel_id: z.string().min(1, "Hotel ID is required"),
  supplier_id: z.string().min(1, "Supplier ID is required"),
  total_value: z.number().positive("Total value must be positive"),
  currency: z.string().default("EGP"),
  maker_user_id: z.string().optional(),
});

const InvoOrderQuerySchema = z.object({
  hotel_id: z.string().optional(),
  supplier_id: z.string().optional(),
  state: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

/**
 * POST /api/v1/invo/orders
 * Creates an order in Supabase (Invo marketplace layer).
 * The HotelsVendors (Prisma) layer syncs via background reconciliation.
 */
export async function POST(req: NextRequest) {
  try {
    // TODO (security): Add unit tests for permission `order:create` and validate Supabase row-level tenant enforcement.
    const auth = await authenticate(req);
    await requirePermission(auth, "order:create");

    const body = await req.json();
    const parsed = InvoOrderCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request body" },
        { status: 400 }
      );
    }
    const { hotel_id, supplier_id, total_value, currency, maker_user_id } = parsed.data;

    const supabase = await createClient();

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        hotel_id,
        supplier_id,
        total_value,
        currency,
        procurement_state: "draft",
        maker_user_id: maker_user_id || null,
      })
      .select()
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: `Order creation failed: ${error?.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
      layer: "invo",
      message: "Order created in Invo marketplace layer",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/v1/invo/orders
 * List orders from Supabase with optional filtering.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    await requirePermission(auth, "order:read");

    const { searchParams } = new URL(req.url);
    const parsed = InvoOrderQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid query parameters" },
        { status: 400 }
      );
    }
    const { hotel_id, supplier_id, state, limit } = parsed.data;

    const supabase = await createClient();
    let query = supabase
      .from("orders")
      .select("*, hotels(name), suppliers(name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (hotel_id) query = query.eq("hotel_id", hotel_id);
    if (supplier_id) query = query.eq("supplier_id", supplier_id);
    if (state) query = query.eq("procurement_state", state);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
