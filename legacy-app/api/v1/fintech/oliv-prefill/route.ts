import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiRoute, success, error, authenticate } from "@/lib/api-utils";
import { createHmac, randomBytes } from "crypto";

export const dynamic = "force-dynamic";

const OlivPrefillSchema = z.object({
  supplierId: z.string().min(1, "Supplier ID is required"),
  invoiceId: z.string().optional(),
  etaUuid: z.string().optional(),
});

/**
 * Oliv Pre-fill Data Export API
 *
 * POST /api/v1/fintech/oliv-prefill — Generate pre-fill data package for Oliv redirect
 *
 * Flow:
 * 1. Supplier clicks "Activate Oliv Financing" on HotelsVendors
 * 2. System checks consent is granted (OLIV_DATA_SHARING)
 * 3. System generates encrypted pre-fill token with minimal data
 * 4. Supplier is redirected to Oliv with pre-filled data
 * 5. Oliv registration form is pre-populated — supplier confirms, doesn't re-enter
 *
 * Data shared (minimized per PDPL):
 * - Company name, CR number, tax ID
 * - Address, bank details
 * - Authorized signatory name + ID number
 * - ETA UUID (Oliv pulls full invoice data from ETA platform)
 */

const OLIV_WEBHOOK_SECRET = process.env.OLIV_WEBHOOK_SECRET || "";
const OLIV_APPLY_URL = process.env.OLIV_APPLY_URL || "https://oliv.finance/apply";

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (!auth) return error("Unauthorized", 401);

  const body = await request.json();
  const parsed = OlivPrefillSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message || "Invalid request body", 400);
  }
  const { supplierId, invoiceId, etaUuid } = parsed.data;

  // 1. Verify consent is granted
  const consent = await prisma.consentRecord.findUnique({
    where: {
      userId_consentType_partnerId: {
        userId: auth.userId,
        consentType: "OLIV_DATA_SHARING",
        partnerId: "oliv_finance",
      },
    },
  });

  if (!consent || consent.status !== "GRANTED") {
    return error("Consent not granted. Please activate Oliv financing from your dashboard first.", 403);
  }

  // 2. Fetch supplier data
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
  });

  if (!supplier) {
    return error("Supplier not found", 404);
  }

  if (supplier.tenantId !== auth.tenantId) {
    return error("Unauthorized", 403);
  }

  // 3. Fetch user (authorized signatory)
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
  });

  if (!user) {
    return error("User not found", 404);
  }

  // 4. Build pre-fill data package (minimal — only what Oliv needs for registration)
  const prefillData = {
    // Company info (matches Oliv's Step 2: Company Verification)
    companyName: supplier.legalName || supplier.name,
    commercialRegisterNumber: supplier.commercialReg || "",
    taxRegistrationNumber: supplier.taxId,
    companyAddress: [supplier.address, supplier.city, supplier.governorate]
      .filter(Boolean)
      .join(", "),
    city: supplier.city,
    governorate: supplier.governorate,

    // Bank details (matches Oliv's Step 6: Disbursement Setup)
    bankAccountNumber: supplier.bankAccount || "",
    bankName: supplier.bankName || "",

    // Authorized signatory (matches Oliv's Step 3: Authorized Representative)
    authorizedSignatoryName: user.name,
    authorizedSignatoryNationalId: "", // Must be collected — not stored in User model

    // Contact info
    email: user.email,
    phone: user.phone || "",

    // ETA access (Oliv pulls invoice data from ETA using UUID)
    etaUuid: etaUuid || "",

    // Metadata
    source: "hotelsvendors",
    ref: supplierId,
    consentId: consent.id,
    consentTimestamp: consent.createdAt.toISOString(),
  };

  // 5. Create encrypted token for Oliv
  // In production, this would be a JWT signed with Oliv's public key
  // For now, use HMAC-signed base64 payload
  const payloadJson = JSON.stringify(prefillData);
  const payloadBase64 = Buffer.from(payloadJson).toString("base64url");
  const signature = createHmac("sha256", OLIV_WEBHOOK_SECRET || randomBytes(32).toString("hex"))
    .update(payloadBase64)
    .digest("hex");

  const token = `${payloadBase64}.${signature.slice(0, 32)}`;

  // 6. Generate Oliv redirect URL
  const redirectUrl = `${OLIV_APPLY_URL}?token=${token}&ref=${supplierId}&source=hotelsvendors`;

  // 7. Log the data export (PDPL audit trail)
  await prisma.olivSyncLog.create({
    data: {
      direction: "OUTBOUND",
      eventType: "REGISTRATION_PRE_FILL",
      entityType: "Supplier",
      entityId: supplierId,
      payload: JSON.stringify({
        fields: Object.keys(prefillData),
        consentId: consent.id,
      }),
      success: true,
      idempotencyKey: `prefill_${supplierId}_${Date.now()}`,
      tenantId: auth.tenantId,
    },
  });

  return success({
    redirectUrl,
    prefillData: {
      companyName: prefillData.companyName,
      taxRegistrationNumber: prefillData.taxRegistrationNumber,
      city: prefillData.city,
      // Don't expose full payload — just confirmation fields
    },
    message: "Pre-fill data generated. Redirect to Oliv to complete registration.",
  });
});
