/**
 * FRA Factoring Worker
 * HotelsVendors — Autonomous 48-Hour Disbursement Pipeline
 *
 * Listens for Factoring.Requested events (via BullMQ factoring-queue).
 * Validates Goods Received Note (GRN), checks FRA anti-double-financing,
 * triggers payout via payment rails (InstaPay, Paymob, Bank Transfer).
 *
 * Queue: factoring-queue
 */

import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface FactoringPayload {
  invoiceId: string;
  supplierId: string;
  hotelId: string;
  amount: number;
  etaUuid: string;
  tenantId: string;
  payoutMethod?: "instapay" | "paymob" | "bank_transfer";
}

const FRA_API_URL = process.env.FRA_API_URL || "";
const FRA_API_KEY = process.env.FRA_API_KEY || "";

async function checkFraDoubleFinancing(
  etaUuid: string,
  invoiceId: string,
  tenantId: string,
  supplierId: string,
  hotelId: string,
  amount: number,
): Promise<{ locked: boolean; existingReference?: string }> {
  if (!FRA_API_KEY) {
    throw new Error("FRA verification integration is not configured");
  }

  try {
    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, tenantId, supplierId, hotelId, deletedAt: null } });
    if (!invoice || invoice.etaUuid !== etaUuid || !["ACCEPTED", "VALIDATED"].includes(invoice.etaStatus) || !invoice.digitalSignature || Number(invoice.total) !== amount) throw new Error("Verified invoice identity, amount and ETA acceptance required");
    const res = await fetch(`${FRA_API_URL}/factoring/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FRA_API_KEY}`,
      },
      body: JSON.stringify({ etaUuid, source: "hotelsvendors" }),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = z.object({ locked: z.boolean(), referenceId: z.string().optional() }).parse(await res.json());
      return { locked: data.locked, existingReference: data.referenceId };
    }
    throw new Error("FRA verification was not successful");
  } catch {
    throw new Error("FRA verification unavailable; financing remains blocked");
  }
}

async function triggerPayout(amount: number, supplierId: string, method: string = "bank_transfer"): Promise<{ success: boolean; reference: string; method: string }> {
  throw new Error(`Verified ${method} payout adapter is not configured for supplier ${supplierId} amount ${amount}`);
}

export async function processFactoringRequest(payload: FactoringPayload) {
  const { invoiceId, supplierId, hotelId, amount, etaUuid, tenantId, payoutMethod } = payload;
  const startTime = Date.now();

  console.log(`[FRA Worker] Processing factoring for invoice ${invoiceId} — ${amount} EGP`);

  try {
    // 1. Verify order delivery status (proxy for Goods Received)
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId, supplierId, hotelId, deletedAt: null },
    });
    if (!invoice) throw new Error("Invoice not found in the requested tenant scope");

    const order = await prisma.order.findFirst({
      where: {
        id: invoice.orderId,
        tenantId,
        status: "DELIVERED",
        items: { some: { quantity: { gt: 0 } } },
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!order) {
      await prisma.auditLog.create({
        data: {
          tenantId,
          entityId: invoiceId,
          actorId: "FRA_FACTORING_WORKER",
          actionType: "UPDATE",
          changes: { error: "No delivered order found — Goods Received not confirmed", invoiceId, status: "REJECTED" },
        },
      });
      console.warn(`[FRA Worker] Invoice ${invoiceId}: No delivered order — marked for review`);
      return { success: false, reason: "GRN_NOT_FOUND", invoiceId };
    }
    const receipt = await prisma.goodsReceiptNote.findFirst({ where: { orderId: invoice.orderId, tenantId, status: "ACCEPTED", deletedAt: null } });
    if (!receipt) throw new Error("Accepted goods receipt for this invoice is required");

    // 2. FRA anti-double-financing check
    const fraCheck = await checkFraDoubleFinancing(etaUuid, invoiceId, tenantId, supplierId, hotelId, amount);
    if (fraCheck.locked) {
      await prisma.auditLog.create({
        data: {
          tenantId,
          entityId: invoiceId,
          actorId: "FRA_FACTORING_WORKER",
          actionType: "UPDATE",
          changes: {
            error: "Invoice already factored on another platform",
            existingReference: fraCheck.existingReference,
            etaUuid,
            status: "REJECTED_DOUBLE_FINANCING",
          },
        },
      });
      console.warn(`[FRA Worker] Invoice ${invoiceId}: DOUBLE FINANCING BLOCKED`);
      return { success: false, reason: "DOUBLE_FINANCING_BLOCKED", invoiceId };
    }

    // 3. Trigger payout
    const method = payoutMethod || "bank_transfer";
    const payout = await triggerPayout(amount, supplierId, method);

    // 4. Record factoring transaction
    const feeRate = 0.021; // 2.1% platform fee
    const fee = Math.round(amount * feeRate * 100) / 100;
    const net = amount - fee;
    const now = new Date();

    await prisma.factoringTransaction.create({
      data: {
        tenantId,
        etaUuid,
        supplierTaxId: supplierId,
        hotelTaxId: hotelId,
        referralTokenSignature: `standalone-${Date.now().toString(36)}`,
        referralTokenPayload: JSON.stringify({ invoiceId, amount, supplierId }),
        referralTokenGeneratedAt: now,
        referralTokenExpiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        callbackTimestamp: now,
        olivTransactionId: payout.reference,
        payoutStatus: "DISBURSED",
        disbursedAmount: amount,
        factoringFee: fee,
        advanceRate: 0.85,
        disbursementDate: now,
        expectedSettlementDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        processedAt: now,
      },
    });

    // 5. Ledger entry
    await prisma.ledgerEntry.create({
      data: {
        tenantId,
        entityType: "PLATFORM_FEE",
        entityId: payout.reference,
        entryType: "PLATFORM_FEE",
        account: "REVENUE",
        amount: fee,
        currency: "EGP",
        reference: `FRA-${payout.reference}`,
        metadata: JSON.stringify({
          etaUuid,
          invoiceId,
          amount,
          fee,
          net,
          method,
          processingTimeMs: Date.now() - startTime,
        }),
      },
    });

    // 6. Audit
    await prisma.auditLog.create({
      data: {
        tenantId,
        entityId: invoiceId,
        actorId: "FRA_FACTORING_WORKER",
        actionType: "UPDATE",
        changes: {
          invoiceId,
          amount,
          fee,
          net,
          etaUuid,
          grnId: order.id,
          payoutReference: payout.reference,
          method,
          processingTimeMs: Date.now() - startTime,
          status: "DISBURSED",
        },
      },
    });

    console.log(`[FRA Worker] Invoice ${invoiceId}: DISBURSED — ${net} EGP net (${fee} fee)`);
    return { success: true, invoiceId, net, fee, reference: payout.reference, processingTimeMs: Date.now() - startTime };
  } catch (err) {
    console.error(`[FRA Worker] Failed for invoice ${invoiceId}:`, err instanceof Error ? err.message : err);

    await prisma.auditLog.create({
      data: {
        tenantId,
        entityId: invoiceId,
        actorId: "FRA_FACTORING_WORKER",
        actionType: "UPDATE",
        changes: {
          error: err instanceof Error ? err.message : "Unknown error",
          invoiceId,
          etaUuid,
          retryAfter: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          status: "ERROR_RETRY",
        },
      },
    });

    throw err;
  }
}

/**
 * Standalone entry for direct invocation:
 *   npx tsx lib/workers/fra-factoring.worker.ts --invoiceId=xxx --supplierId=xxx --amount=14400
 */
async function main() {
  const invoiceId = process.argv.find((a) => a.startsWith("--invoiceId="))?.split("=")[1];
  const supplierId = process.argv.find((a) => a.startsWith("--supplierId="))?.split("=")[1];
  const amount = Number(process.argv.find((a) => a.startsWith("--amount="))?.split("=")[1] || "0");

  if (!invoiceId || !supplierId || !amount) {
    console.error("Usage: npx tsx fra-factoring.worker.ts --invoiceId=xxx --supplierId=xxx --amount=14400 [--payoutMethod=instapay]");
    process.exit(1);
  }

  await processFactoringRequest({
    invoiceId,
    supplierId,
    hotelId: process.argv.find((a) => a.startsWith("--hotelId="))?.split("=")[1] || "hotel-001",
    amount,
    etaUuid: process.argv.find((a) => a.startsWith("--etaUuid="))?.split("=")[1] || "eta-uuid-placeholder",
    tenantId: process.env.DEFAULT_TENANT_ID || "TENANT_001",
    payoutMethod: parsePayoutMethod(process.argv.find((a) => a.startsWith("--payoutMethod="))?.split("=")[1]),
  });

  console.log("Done.");
  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch((err) => { console.error(err); process.exit(1); });
}

function parsePayoutMethod(value: string | undefined): FactoringPayload['payoutMethod'] {
  if (value === undefined || value === "bank_transfer") return "bank_transfer";
  if (value === "instapay" || value === "paymob") return value;
  throw new Error("Unsupported payout method");
}
