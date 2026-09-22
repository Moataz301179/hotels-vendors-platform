/**
 * ETA Verification Worker
 * HotelsVendors — Autonomous Onboarding Pipeline
 *
 * Listens for User.Registered events (via BullMQ onboarding-queue).
 * Validates Tax ID and Commercial Register against Egyptian Tax Authority
 * eInvoicing API. Updates user KYC status on completion.
 *
 * Queue: onboarding-queue
 */

import { prisma } from "@/lib/prisma";

interface EtaVerificationPayload {
  userId: string;
  taxId: string;
  commercialReg: string;
  tenantId: string;
}

const ETA_BASE_URL = process.env.ETA_API_URL || "https://invoicing.eta.gov.eg/einvoicingapi";
const ETA_API_KEY = process.env.ETA_API_KEY || "";

async function callEtaApi(endpoint: string, payload: Record<string, unknown>, timeout = 15000) {
  if (!ETA_API_KEY) {
    console.warn("[ETA Worker] ETA_API_KEY not configured — using mock mode");
    return { status: "MOCK_VERIFIED", verified: true, source: "mock" };
  }

  const res = await fetch(`${ETA_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ETA_API_KEY}`,
      "X-Request-ID": `hv-${Date.now().toString(36)}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeout),
  });

  if (!res.ok) {
    throw new Error(`ETA API returned ${res.status}: ${await res.text().catch(() => "")}`);
  }

  return res.json();
}

export async function processEtaVerification(payload: EtaVerificationPayload) {
  const { userId, taxId, commercialReg, tenantId } = payload;

  console.log(`[ETA Worker] Verifying user ${userId} — Tax ID: ${taxId}, CR: ${commercialReg}`);

  try {
    // 1. Verify Tax ID against ETA eInvoicing
    const taxResult = await callEtaApi("/01-submit-documents", {
      documentType: "TAX_ID_VERIFICATION",
      taxId,
      commercialReg,
      requestType: "ONBOARDING_CHECK",
    });

    // 2. Query document status
    const docResult = await callEtaApi("/document-queries", {
      taxId,
      queryType: "STATUS_CHECK",
    }).catch(() => ({ status: "UNKNOWN" }));

    const verified = taxResult?.verified === true || taxResult?.status === "MOCK_VERIFIED";
    const status = verified ? "VERIFIED" : "FAILED";

    // 3. Update user KYC status
    await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: status as any,
        kycVerifiedAt: verified ? new Date() : undefined,
        kycLevel: verified ? 1 : 0,
      },
    });

    // 4. Audit log
    await prisma.auditLog.create({
      data: {
        tenantId,
        entityId: userId,
        actorId: "ETA_VERIFICATION_WORKER",
        actionType: "UPDATE",
        changes: {
          taxId,
          commercialReg,
          verified,
          etaStatus: taxResult?.status || "mock",
          processingTimeMs: Date.now() - (payload as any)._startTime || 0,
        },
      },
    });

    console.log(`[ETA Worker] User ${userId}: ${status}`);
    return { success: true, status, userId };
  } catch (err) {
    console.error(`[ETA Worker] Failed for user ${userId}:`, err instanceof Error ? err.message : err);

    // Log failure for retry
    await prisma.auditLog.create({
      data: {
        tenantId,
        entityId: userId,
        actorId: "ETA_VERIFICATION_WORKER",
        actionType: "UPDATE",
        changes: {
          error: err instanceof Error ? err.message : "Unknown error",
          taxId,
          commercialReg,
          status: "ERROR",
          retryAfter: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        },
      },
    });

    throw err; // Re-throw for BullMQ retry
  }
}

/**
 * Standalone entry for direct invocation (testing / CLI):
 *   npx tsx scripts/workers/eta-verification.worker.ts --userId=xxx --taxId=xxx --cr=xxx
 */
async function main() {
  const userId = process.argv.find((a) => a.startsWith("--userId="))?.split("=")[1];
  const taxId = process.argv.find((a) => a.startsWith("--taxId="))?.split("=")[1];
  const cr = process.argv.find((a) => a.startsWith("--cr="))?.split("=")[1];

  if (!userId || !taxId) {
    console.error("Usage: npx tsx eta-verification.worker.ts --userId=xxx --taxId=xxx [--cr=xxx]");
    process.exit(1);
  }

  await processEtaVerification({
    userId,
    taxId,
    commercialReg: cr || "",
    tenantId: process.env.DEFAULT_TENANT_ID || "TENANT_001",
  });

  console.log("Done.");
  await prisma.$disconnect();
}

// Only run main() if invoked directly (not imported as module)
if (require.main === module) {
  main().catch((err) => { console.error(err); process.exit(1); });
}