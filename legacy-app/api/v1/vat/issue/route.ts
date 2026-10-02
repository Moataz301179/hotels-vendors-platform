import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils"
import crypto from "crypto"

const VAT_RATE = 0.14
const SERVICE_FEE_RATE = 0.01

const VATItemSchema = z.object({
  description: z.string().min(1, "Item description is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Unit price must be positive"),
  vatRate: z.number().refine((r) => [0, 5, 8, 10, 14].includes(r), "Invalid VAT rate"),
})

const VATIssueSchema = z.object({
  companyTaxId: z.string().min(1, "Company Tax ID is required"),
  buyerName: z.string().min(1, "Buyer name is required"),
  buyerTaxId: z.string().min(1, "Buyer Tax ID is required"),
  items: z.array(VATItemSchema).min(1, "At least one item is required"),
  notes: z.string().max(500).optional(),
})

function generateEtaUuid(payload: object): string {
  const hash = crypto.createHash("sha256")
  hash.update(JSON.stringify(payload) + Date.now().toString())
  return hash.digest("hex")
}

function generateInvoiceRef(): string {
  const prefix = "VAT"
  const ts = Date.now().toString(36).toUpperCase()
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase()
  return `${prefix}-${ts}-${rand}`
}

export const POST = apiRoute(async (req: NextRequest) => {
  const auth = await authenticate(req);
  await requirePermission(auth, "invoice:create");

  try {
    const body = await req.json()
    const parsed = VATIssueSchema.safeParse(body)
    if (!parsed.success) {
      return error(parsed.error.issues[0]?.message || "Invalid request body", 400)
    }
    const { companyTaxId, buyerName, buyerTaxId, items, notes } = parsed.data

    // Calculate amounts
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )

    const vatAmount = Math.round(subtotal * VAT_RATE * 100) / 100
    const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE * 100) / 100
    const total = subtotal + vatAmount + serviceFee

    // Generate identifiers
    const etaPayload = {
      companyTaxId,
      buyerName,
      buyerTaxId,
      items,
      subtotal,
      vatAmount,
      total,
      timestamp: new Date().toISOString(),
    }
    const etaUuid = generateEtaUuid(etaPayload)
    const invoiceRef = generateInvoiceRef()

    // Simulate ETA submission — store record in DB
    const invoice = await prisma.invoice.create({
      data: {
        id: etaUuid,
        invoiceNumber: invoiceRef,
        etaUuid,
        subtotal,
        vatRate: 14,
        vatAmount,
        total,
        status: "ISSUED" as any,
        paymentStatus: "UNPAID" as any,
        orderId: "VAT-STANDALONE",
        hotelId: "VAT-STANDALONE",
        supplierId: "VAT-STANDALONE",
        tenantId: auth.tenantId,
        issueDate: new Date(),
        updatedAt: new Date(),
        submissionLog: JSON.stringify({
          submissionId: `ETA-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
          submittedAt: new Date().toISOString(),
          status: "ACCEPTED",
        }),
      },
    })

    const etaResponse = invoice.submissionLog ? JSON.parse(invoice.submissionLog) as Record<string, unknown> : null

    return success({
      etaUuid,
      invoiceRef,
      subtotal,
      vatAmount,
      serviceFee,
      total,
      etaSubmissionId: etaResponse?.submissionId || undefined,
      submittedAt: new Date().toISOString(),
    })
  } catch (e) {
    console.error("Invoice issue error:", e)
    return error("Internal server error", 500)
  }
})
