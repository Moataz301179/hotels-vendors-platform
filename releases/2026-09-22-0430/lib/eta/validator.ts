/**
 * ETA Validator — Factoring Gate
 * Hotels Vendors Compliance Layer
 *
 * Validates that invoices are ETA-compliant BEFORE they enter the factoring pipeline.
 * Every factoring request MUST pass these checks.
 */

import { prisma } from "@/lib/prisma";
import type { EtaValidationResult, EtaValidationCode } from "./types";
import { etaClient } from "./client";

// ─────────────────────────────────────────
// 1. VALIDATION RULES
// ─────────────────────────────────────────

const RULES = {
  UUID_REQUIRED: true,
  UUID_FORMAT: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  VALID_STATUSES: ["ACCEPTED", "VALIDATED"] as const,
  SIGNATURE_REQUIRED: true,
  AMOUNT_TOLERANCE: 0.01, // EGP
};

// ─────────────────────────────────────────
// 2. MAIN VALIDATION FUNCTION
// ─────────────────────────────────────────

/**
 * Validate an invoice for factoring eligibility.
 * This is the COMPLIANCE GATE — no factoring without passing.
 */
export async function validateForFactoring(invoiceId: string): Promise<EtaValidationResult> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      hotel: true,
      supplier: true,
      order: { include: { items: { include: { product: true } } } },
    },
  });

  if (!invoice) {
    return {
      valid: false,
      code: "ETA_NOT_FOUND",
      message: "Invoice not found in platform database",
    };
  }

  // Rule 1: UUID Presence
  if (RULES.UUID_REQUIRED && !invoice.etaUuid) {
    return {
      valid: false,
      code: "ETA_UUID_MISSING",
      message: "Invoice has no ETA UUID. Submit to ETA before factoring.",
    };
  }

  // Rule 2: UUID Format
  if (invoice.etaUuid && !RULES.UUID_FORMAT.test(invoice.etaUuid)) {
    return {
      valid: false,
      code: "ETA_UUID_MISSING",
      message: `ETA UUID format invalid: ${invoice.etaUuid}`,
    };
  }

  // Rule 3: ETA Status
  const validStatus = RULES.VALID_STATUSES.includes(
    invoice.etaStatus as (typeof RULES.VALID_STATUSES)[number]
  );
  if (!validStatus) {
    return {
      valid: false,
      code: "ETA_STATUS_INVALID",
      message: `ETA status is '${invoice.etaStatus}'. Must be ACCEPTED or VALIDATED for factoring.`,
    };
  }

  // Rule 4: Digital Signature
  if (RULES.SIGNATURE_REQUIRED && !invoice.digitalSignature) {
    return {
      valid: false,
      code: "ETA_SIGNATURE_MISSING",
      message: "Digital signature missing. Invoice must be digitally signed before factoring.",
    };
  }

  // Rule 5 & 6: Cross-reference with ETA API
  try {
    const etaRecord = await etaClient.getInvoice(invoice.etaUuid!);

    if (!etaRecord) {
      return {
        valid: false,
        code: "ETA_NOT_FOUND",
        message: `ETA record not found for UUID: ${invoice.etaUuid}`,
      };
    }

    // Amount match check
    if (Math.abs(Number(etaRecord.total) - Number(invoice.total || 0)) > RULES.AMOUNT_TOLERANCE) {
      return {
        valid: false,
        code: "ETA_AMOUNT_MISMATCH",
        message: `Amount mismatch: Platform=${Number(invoice.total || 0).toFixed(2)}, ETA=${Number(etaRecord.total).toFixed(2)}`,
        details: { platformAmount: Number(invoice.total || 0), etaAmount: Number(etaRecord.total) },
      };
    }

    // Tax ID match check
    if (etaRecord.issuerId !== invoice.supplier.taxId && etaRecord.receiverId !== invoice.hotel.taxId) {
      return {
        valid: false,
        code: "ETA_TAX_ID_MISMATCH",
        message: "Tax ID mismatch between platform and ETA record",
        details: {
          platformSupplierTaxId: invoice.supplier.taxId,
          platformHotelTaxId: invoice.hotel.taxId,
          etaIssuerId: etaRecord.issuerId,
          etaReceiverId: etaRecord.receiverId,
        },
      };
    }

    // All checks passed
    return {
      valid: true,
      code: "ETA_VALID",
      message: "Invoice is ETA-compliant and eligible for factoring",
      etaRecord: etaRecord as unknown as Record<string, unknown>,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ETA API error";
    return {
      valid: false,
      code: "ETA_API_ERROR",
      message: `ETA API validation failed: ${message}`,
    };
  }
}

// ─────────────────────────────────────────
// 3. BATCH VALIDATION
// ─────────────────────────────────────────

export interface BatchValidationResult {
  invoiceId: string;
  result: EtaValidationResult;
}

/**
 * Validate multiple invoices in parallel for factoring.
 */
export async function validateBatchForFactoring(invoiceIds: string[]): Promise<BatchValidationResult[]> {
  const results = await Promise.all(
    invoiceIds.map(async (id) => ({
      invoiceId: id,
      result: await validateForFactoring(id),
    }))
  );
  return results;
}

// ─────────────────────────────────────────
// 4. PRE-SUBMISSION VALIDATION
// ─────────────────────────────────────────

/**
 * Validate that an invoice is ready for ETA submission.
 * Called before calling etaClient.submitInvoice().
 */
export async function validateForSubmission(invoiceId: string): Promise<EtaValidationResult> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      hotel: true,
      supplier: true,
      order: { include: { items: { include: { product: true } } } },
    },
  });

  if (!invoice) {
    return {
      valid: false,
      code: "ETA_NOT_FOUND",
      message: "Invoice not found",
    };
  }

  // Required fields
  if (!invoice.hotel.taxId) {
    return {
      valid: false,
      code: "ETA_TAX_ID_MISMATCH",
      message: "Hotel tax ID missing",
    };
  }

  if (!invoice.supplier.taxId) {
    return {
      valid: false,
      code: "ETA_TAX_ID_MISMATCH",
      message: "Supplier tax ID missing",
    };
  }

  if (Number(invoice.total || 0) <= 0) {
    return {
      valid: false,
      code: "ETA_AMOUNT_MISMATCH",
      message: "Invoice total must be positive",
    };
  }

  if (!invoice.order) {
    return {
      valid: false,
      code: "ETA_NOT_FOUND",
      message: "Invoice has no linked order",
    };
  }

  return {
    valid: true,
    code: "ETA_VALID",
    message: "Invoice ready for ETA submission",
  };
}
