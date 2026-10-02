import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRoute, success, error, authenticate, audit } from "@/lib/api-utils";
import { validateForFactoring } from "@/lib/eta/validator";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * Invoice Upload & Financing Request API
 * POST /api/v1/financing/invoice-upload
 *
 * Phase 1 (Offline): Hotel uploads paper invoice → validate → route to Oliv
 * Phase 2 (Online): Supplier plugin sends invoice data → validate → route to Oliv
 *
 * The ETA VAT invoice is the trust layer:
 * - Proves transaction happened
 * - Amount is verified via ETA API
 * - Both parties are tax-registered
 * - UUID prevents double-financing
 */

const InvoiceUploadSchema = z.object({
  // Phase 1: Manual entry or photo upload
  invoiceNumber: z.string().min(1, "Invoice number required"),
  etaUuid: z.string().uuid("Invalid ETA UUID format").optional(),

  // Invoice details (extracted from photo or manually entered)
  supplierName: z.string().min(1, "Supplier name required"),
  supplierTaxId: z.string().min(1, "Supplier tax ID required"),
  hotelName: z.string().optional(),
  hotelTaxId: z.string().optional(),

  amount: z.number().positive("Amount must be positive"),
  vatAmount: z.number().min(0).optional(),
  total: z.number().positive("Total must be positive"),
  currency: z.string().default("EGP"),

  issueDate: z.string().optional(),
  dueDate: z.string().optional(),

  // Financing options
  requestedAmount: z.number().positive().optional(), // Amount to factor (usually 88% of total)
  financingDays: z.number().min(7).max(180).default(60), // Credit period

  // Phase 2: Plugin metadata
  source: z.enum(["UPLOAD", "PLUGIN", "MANUAL"]).default("UPLOAD"),
  pluginSessionId: z.string().optional(),
  supplierPluginId: z.string().optional(),

  // File upload (base64 or URL)
  invoicePhoto: z.string().optional(), // Base64 encoded image
  invoicePhotoUrl: z.string().url().optional(), // Or URL to uploaded file
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (!auth) return error("Unauthorized", 401);

  const body = await request.json();
  const parsed = InvoiceUploadSchema.safeParse(body);

  if (!parsed.success) {
    return error(`Validation failed: ${parsed.error.issues.map((e: { message: string }) => e.message).join(", ")}`, 400);
  }

  const data = parsed.data;

  // G10: Minimum order amount check
  const MIN_ORDER_EGP = 5000;
  if (data.total < MIN_ORDER_EGP) {
    return error(
      `Minimum invoice amount is EGP ${MIN_ORDER_EGP.toLocaleString()}. Invoice total: EGP ${data.total.toLocaleString()}`,
      400
    );
  }

  // Find or create supplier in platform
  let supplier = await prisma.supplier.findFirst({
    where: {
      tenantId: auth.tenantId,
      OR: [
        { taxId: data.supplierTaxId },
        { name: { contains: data.supplierName, mode: "insensitive" } },
      ],
    },
  });

  if (!supplier) {
    // Auto-register supplier from invoice data
    supplier = await prisma.supplier.create({
      data: {
        name: data.supplierName,
        legalName: data.supplierName,
        taxId: data.supplierTaxId,
        tenantId: auth.tenantId,
        status: "ACTIVE",
        city: "Unknown",
        governorate: "Unknown",
        email: `supplier-${Date.now()}@placeholder.local`,
      },
    });

    await audit({
      entityType: "Supplier",
      entityId: supplier.id,
      action: "AUTO_REGISTERED_FROM_INVOICE",
      tenantId: auth.tenantId,
      actorId: auth.userId,
      actorRole: auth.platformRole,
      afterState: { name: data.supplierName, taxId: data.supplierTaxId },
    });
  }

  // Find or create hotel in platform
  let hotel = await prisma.hotel.findFirst({
    where: {
      tenantId: auth.tenantId,
      OR: [
        data.hotelTaxId ? { taxId: data.hotelTaxId } : undefined,
        { name: { contains: data.hotelName || "", mode: "insensitive" } },
      ].filter(Boolean) as Array<{ taxId: string } | { name: { contains: string; mode: "insensitive" } }>,
    },
  });

  if (!hotel && data.hotelName) {
    hotel = await prisma.hotel.create({
      data: {
        name: data.hotelName,
        legalName: data.hotelName,
        taxId: data.hotelTaxId || `PENDING-${Date.now()}`,
        tenantId: auth.tenantId,
        status: "ACTIVE",
        city: "Unknown",
        governorate: "Unknown",
      },
    });
  }

  // Create a minimal Order record (for audit trail + linking)
  const orderNumber = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      status: "CONFIRMED", // Immediately confirmed — invoice exists
      subtotal: data.amount,
      vatAmount: data.vatAmount || data.total - data.amount,
      total: data.total,
      currency: data.currency,
      hotelId: hotel?.id || "",
      supplierId: supplier.id,
      requesterId: auth.userId,
      tenantId: auth.tenantId,
      paymentGuaranteed: false, // Will be set after Oliv approval
      poNumber: data.invoiceNumber,
    },
  });

  // Create Invoice record
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: data.invoiceNumber,
      subtotal: data.amount,
      vatAmount: data.vatAmount || data.total - data.amount,
      total: data.total,
      currency: data.currency,
      issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + data.financingDays * 24 * 60 * 60 * 1000),
      status: "ISSUED",
      paymentStatus: "UNPAID",
      orderId: order.id,
      hotelId: hotel?.id || "",
      supplierId: supplier.id,
      tenantId: auth.tenantId,
      etaUuid: data.etaUuid || null,
      etaStatus: data.etaUuid ? "PENDING" : "PENDING",
      factoringStatus: "NOT_FACTORABLE", // Will be updated after ETA validation
    },
  });

  // Validate ETA if UUID provided
  let etaValid = false;
  let etaError: string | null = null;

  if (data.etaUuid) {
    const etaResult = await validateForFactoring(invoice.id);
    etaValid = etaResult.valid;
    etaError = etaResult.valid ? null : (etaResult.message ?? null);

    // Update invoice with ETA status
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        etaStatus: etaResult.valid ? "ACCEPTED" : "REJECTED",
        factoringStatus: etaResult.valid ? "AVAILABLE" : "NOT_FACTORABLE",
      },
    });
  }

  // Calculate platform fee (2% of total)
  const platformFee = data.total * 0.02;

  // Calculate financing amount (advance rate - typically 88%)
  const advanceRate = 0.88;
  const requestedAmount = data.requestedAmount || data.total * advanceRate;

  // Audit log
  await audit({
    entityType: "Invoice",
    entityId: invoice.id,
    action: "INVOICE_UPLOADED_FOR_FINANCING",
    tenantId: auth.tenantId,
    actorId: auth.userId,
    actorRole: auth.platformRole,
    afterState: {
      invoiceNumber: data.invoiceNumber,
      total: data.total,
      source: data.source,
      etaUuid: data.etaUuid,
      etaValid,
      platformFee,
      requestedAmount,
      financingDays: data.financingDays,
    },
  });

  return success({
    orderId: order.id,
    invoiceId: invoice.id,
    invoiceNumber: data.invoiceNumber,
    total: data.total,
    platformFee,
    requestedAmount,
    financingDays: data.financingDays,
    eta: {
      uuid: data.etaUuid,
      valid: etaValid,
      error: etaError,
    },
    supplier: {
      id: supplier.id,
      name: supplier.name,
    },
    hotel: hotel ? {
      id: hotel.id,
      name: hotel.name,
    } : null,
    nextStep: etaValid
      ? "READY_FOR_FACTORING — Invoice validated. Oliv will review and disburse."
      : data.etaUuid
        ? "ETA_VALIDATION_FAILED — Invoice could not be validated with ETA. Manual review required."
        : "PENDING_ETA — Submit invoice to ETA to enable factoring.",
    message: `Invoice uploaded. Platform fee: EGP ${platformFee.toLocaleString()} (2%). Financing request: EGP ${requestedAmount.toLocaleString()}.`,
  });
});
