import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiRoute, success, error, authenticate } from "@/lib/api-utils";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

/**
 * Consent Management API
 *
 * POST /api/v1/consent — Grant consent for data sharing with a partner
 * GET  /api/v1/consent — List user's consent records
 *
 * PDPL-compliant: Every data share event requires a consent record.
 */

const CONSENT_VERSION = "1.0";

const CONSENT_TEXT: Record<string, string> = {
  OLIV_DATA_SHARING:
    "I consent to sharing my business registration data (company name, commercial register number, tax ID, address, bank details) and ETA e-invoicing history with Oliv Finance for the purpose of credit assessment and factoring services. I understand that Oliv Finance will process my data in accordance with their privacy policy and that I may withdraw consent at any time from my dashboard settings.",
  OLIV_CREDIT_ASSESSMENT:
    "I consent to Oliv Finance conducting a credit check and assessing my creditworthiness using my business registration data, ETA e-invoicing history, and credit bureau data.",
};

const GrantConsentSchema = z.object({
  consentType: z.enum(["OLIV_DATA_SHARING", "OLIV_CREDIT_ASSESSMENT"], {
    error: () => ({ message: `Invalid consent type. Valid types: ${Object.keys(CONSENT_TEXT).join(", ")}` }),
  }),
  partnerId: z.string().min(1, "Partner ID is required"),
  dataCategories: z.array(z.string().min(1)).min(1, "At least one data category is required"),
});

// POST — Grant consent
export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (!auth) return error("Unauthorized", 401);

  const body = await request.json();
  const parsed = GrantConsentSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message || "Invalid request body", 400);
  }
  const { consentType, partnerId, dataCategories } = parsed.data;

  // Check if consent already exists and is active
  const existing = await prisma.consentRecord.findUnique({
    where: {
      userId_consentType_partnerId: {
        userId: auth.userId,
        consentType,
        partnerId,
      },
    },
  });

  if (existing && existing.status === "GRANTED") {
    return success({
      consent: existing,
      message: "Consent already granted",
    });
  }

  // Create consent record
  const consentVersion = CONSENT_VERSION;
  const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Create audit hash
  const hashInput = `${auth.userId}:${consentType}:${partnerId}:${consentVersion}:${dataCategories.join(",")}:${new Date().toISOString()}`;
  const hash = createHash("sha256").update(hashInput).digest("hex");

  const consent = await prisma.consentRecord.create({
    data: {
      userId: auth.userId,
      tenantId: auth.tenantId,
      consentType,
      partnerId,
      consentVersion,
      dataCategories: dataCategories.join(","),
      ipAddress,
      userAgent,
      status: "GRANTED",
      hash,
    },
  });

  // Update supplier's Oliv status
  if (consentType === "OLIV_DATA_SHARING" && partnerId === "oliv_finance") {
    await prisma.supplier.updateMany({
      where: { tenantId: auth.tenantId },
      data: { olivStatus: "CONSENT_GRANTED" },
    });
  }

  return success({ consent, message: "Consent granted successfully" });
});

// GET — List user's consent records
export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  if (!auth) return error("Unauthorized", 401);

  const { partnerId, status } = Object.fromEntries(request.nextUrl.searchParams);

  const where: Record<string, unknown> = { userId: auth.userId };
  if (partnerId) where.partnerId = partnerId;
  if (status) where.status = status;

  const consents = await prisma.consentRecord.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return success({ consents, consentText: CONSENT_TEXT });
});
