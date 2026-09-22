import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { authenticate, requirePermission } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

const InvoInvoiceCreateSchema = z.object({
  order_id: z.string().min(1, "Order ID is required"),
  hotel_id: z.string().min(1, "Hotel ID is required"),
  supplier_id: z.string().min(1, "Supplier ID is required"),
  face_value: z.number().positive("Face value must be positive"),
  currency: z.string().default("EGP"),
  issue_date: z.string().optional(),
  due_date: z.string().optional(),
});

const InvoInvoiceQuerySchema = z.object({
  hotel_id: z.string().optional(),
  supplier_id: z.string().optional(),
  qualification: z.string().optional(),
  eta_status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

/**
 * POST /api/v1/invo/invoices
 * Creates an invoice in Supabase (Invo layer) with ETA compliance fields.
 * Triggers agent_1_ingestion audit log entry.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    await requirePermission(auth, "invoice:create");

    const body = await req.json();
    const parsed = InvoInvoiceCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request body" },
        { status: 400 }
      );
    }
    const {
      order_id,
      hotel_id,
      supplier_id,
      face_value,
      currency,
      issue_date,
      due_date,
    } = parsed.data;

    if (auth.platformRole !== "ADMIN") {
      if (hotel_id) {
        const hotel = await prisma.hotel.findFirst({
          where: { id: hotel_id, tenantId: auth.tenantId },
          select: { id: true },
        });
        if (!hotel) {
          return NextResponse.json({ error: "Unauthorized hotel" }, { status: 403 });
        }
      }
      if (supplier_id) {
        const supplier = await prisma.supplier.findFirst({
          where: { id: supplier_id, tenantId: auth.tenantId },
          select: { id: true },
        });
        if (!supplier) {
          return NextResponse.json({ error: "Unauthorized supplier" }, { status: 403 });
        }
      }
    }

    const supabase = await createClient();

    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        order_id,
        hotel_id,
        supplier_id,
        face_value,
        currency,
        issue_date: issue_date || new Date().toISOString().split("T")[0],
        due_date: due_date || null,
        workflow_state: "ingested",
        qualification_status: "pending_documents",
        fraud_gate_status: "pending",
        eta_status: "pending",
      })
      .select()
      .single();

    if (error || !invoice) {
      return NextResponse.json(
        { error: `Invoice creation failed: ${error?.message}` },
        { status: 500 }
      );
    }

    // Log agent audit entry
    await supabase.from("agent_audit_log").insert({
      agent_name: "agent_1_ingestion",
      action_executed: "invoice_created",
      invoice_id: invoice.id,
      previous_state: "none",
      new_state: "ingested",
    });

    return NextResponse.json({
      success: true,
      invoice,
      layer: "invo",
      message: "Invoice created and queued for agent processing",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/v1/invo/invoices
 * List invoices from Supabase with filtering.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    await requirePermission(auth, "invoice:read");

    const { searchParams } = new URL(req.url);
    const parsed = InvoInvoiceQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid query parameters" },
        { status: 400 }
      );
    }
    const { hotel_id, supplier_id, qualification, eta_status, limit } = parsed.data;

    if (auth.platformRole !== "ADMIN") {
      if (hotel_id) {
        const hotel = await prisma.hotel.findFirst({
          where: { id: hotel_id, tenantId: auth.tenantId },
          select: { id: true },
        });
        if (!hotel) {
          return NextResponse.json({ error: "Unauthorized hotel" }, { status: 403 });
        }
      }
      if (supplier_id) {
        const supplier = await prisma.supplier.findFirst({
          where: { id: supplier_id, tenantId: auth.tenantId },
          select: { id: true },
        });
        if (!supplier) {
          return NextResponse.json({ error: "Unauthorized supplier" }, { status: 403 });
        }
      }
    }

    const supabase = await createClient();
    let query = supabase
      .from("invoices")
      .select("*, hotels(name), suppliers(name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (hotel_id) query = query.eq("hotel_id", hotel_id);
    if (supplier_id) query = query.eq("supplier_id", supplier_id);
    if (qualification) query = query.eq("qualification_status", qualification);
    if (eta_status) query = query.eq("eta_status", eta_status);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invoices: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
