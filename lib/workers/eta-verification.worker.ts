/**
 * ETA Verification Worker
 * HotelsVendors — Autonomous Onboarding Pipeline
 *
 * Listens for User.Registered events (via BullMQ onboarding-queue).
 * This worker previously treated the e-Invoicing surface as a taxpayer/KYC
 * lookup. The public ETA integration SDK does not define that operation.
 * It is deliberately disabled until an independently authorized KYC provider
 * and its data-processing controls are integrated.
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

/**
 * The onboarding worker is allowed to update KYC only from an authenticated
 * upstream result.  It must never turn missing credentials into a successful
 * mock verification: that would make an unconfigured production environment
 * look compliant.
 */
export function etaVerificationConfigurationError(): string | null {
  return "ETA e-Invoicing is not an onboarding/KYC verification API; configure an authorized KYC provider instead";
}

async function callEtaApi(endpoint: string, payload: Record<string, unknown>, timeout = 15000) {
  void endpoint;
  void payload;
  void timeout;
  throw new Error(`ETA_VERIFICATION_UNSUPPORTED: ${etaVerificationConfigurationError()}`);
}

export async function processEtaVerification(payload: EtaVerificationPayload) {
  const { userId, taxId, commercialReg, tenantId } = payload;

  // Never print tax or commercial-registration identifiers to worker logs.
  console.log(`[ETA Worker] Verifying onboarding tax registration for user ${userId}`);

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

    const verified = taxResult?.verified === true;
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
          verified,
          etaStatus: taxResult?.status || "UNKNOWN",
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
