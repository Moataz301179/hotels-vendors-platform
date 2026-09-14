import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { validateTaxId } from "@/lib/tax-id"
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils"

const VALID_VAT_RATES = [14, 5, 0, 10, 8]
const HIGH_AMOUNT_THRESHOLD = 100_000

const ComplianceCheckItemSchema = z.object({
  description: z.string().min(1, "Item description is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
  vatRate: z.number().refine((r) => VALID_VAT_RATES.includes(r), `Invalid VAT rate. Valid rates: ${VALID_VAT_RATES.join(", ")}%`),
})

const ComplianceCheckSchema = z.object({
  companyTaxId: z.string().min(1, "Company Tax ID is required"),
  companyName: z.string().min(1, "Company name is required"),
  commercialRegister: z.string().optional(),
  vatRegistration: z.string().optional(),
  invoiceAmount: z.number().positive("Invoice amount must be positive"),
  items: z.array(ComplianceCheckItemSchema).min(1, "At least one item is required"),
})

export const POST = apiRoute(async (req: NextRequest) => {
  const auth = await authenticate(req);
  await requirePermission(auth, "invoice:create");

  try {
    const body = await req.json()
    const parsed = ComplianceCheckSchema.safeParse(body)
    if (!parsed.success) {
      return error(parsed.error.issues[0]?.message || "Invalid request body", 400)
    }
    const { companyTaxId, companyName, invoiceAmount, items } = parsed.data

    const issues: string[] = []
    let riskScore: "low" | "medium" | "high" = "low"

    // 1. Tax ID format validation
    const taxIdCheck = validateTaxId(companyTaxId)
    if (!taxIdCheck.valid) {
      issues.push(taxIdCheck.message || "Invalid Tax ID format")
    }

    // 2. VAT registration status — scoped to tenant
    const existingSupplier = await prisma.supplier.findFirst({
      where: { taxId: companyTaxId, tenantId: auth.tenantId },
    })
    if (!existingSupplier) {
      issues.push("Company not found in our system. VAT registration could not be verified automatically.")
    }

    // 3. Amount threshold check
    if (invoiceAmount > HIGH_AMOUNT_THRESHOLD) {
      issues.push(`Invoice exceeds EGP ${HIGH_AMOUNT_THRESHOLD.toLocaleString()} threshold — additional approval required`)
    }

    // 4. Item-level validation (quantity/description already validated by Zod)
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!VALID_VAT_RATES.includes(item.vatRate)) {
        issues.push(
          `Item #${i + 1} ("${item.description}") has invalid VAT rate ${item.vatRate}%. Valid rates: ${VALID_VAT_RATES.join(", ")}%`
        )
      }
    }

    // Determine risk score based on issues
    if (issues.length > 3) {
      riskScore = "high"
    } else if (issues.length > 1) {
      riskScore = "medium"
    }

    // Calculate max allowed (if amount exceeds threshold, max is threshold)
    const maxAllowed = invoiceAmount > HIGH_AMOUNT_THRESHOLD ? HIGH_AMOUNT_THRESHOLD : invoiceAmount

    const etaCompliant =
      issues.length === 0 ||
      (issues.length === 1 && issues[0].includes("additional approval required"))

    return success({
      compliant: issues.length === 0,
      issues,
      maxAllowed,
      riskScore,
      etaCompliant,
    })
  } catch (e) {
    console.error("Compliance check error:", e)
    return error("Internal server error", 500)
  }
})
