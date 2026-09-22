/**
 * Factoring Disbursement Queue
 * Hotels Vendors Fintech Layer
 *
 * Background jobs for factoring lifecycle:
 * - Eligibility inquiry
 * - Funding execution
 * - Fee collection
 * - Settlement tracking
 */

import { Queue, Worker, Job } from "bullmq";
import { getRedisConnection } from "@/lib/queues/connection";
import { prisma } from "@/lib/prisma";
import { recordSwarmEvent } from "@/lib/swarm/monitoring";
import { assessRisk } from "@/lib/fintech/risk-engine";
import { inquireAll, fundThroughPartner, getPartner } from "@/lib/fintech/factoring-bridge";
import { addEmailJob } from "@/lib/notifications/queue";
import { factoringDisbursedTemplate } from "@/lib/notifications/email";

// ── Queue ──
export const factoringQueue = new Queue("factoring-disbursement", {
  connection: getRedisConnection(),
});

// ── Types ──
export interface FactoringJobPayload {
  factoringRequestId: string;
  tenantId: string;
  userId: string;
  action: "INQUIRE" | "FUND" | "COLLECT_FEES" | "SETTLE";
  metadata?: Record<string, unknown>;
}

// ── Add Job ──
export async function addFactoringJob(
  payload: FactoringJobPayload,
  options: { delay?: number } = {}
): Promise<Job> {
  return factoringQueue.add(payload.action, payload, {
    delay: options.delay,
    attempts: 3,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  });
}

// ── Worker ──
export function createFactoringWorker(): Worker {
  return new Worker<FactoringJobPayload>(
    "factoring-disbursement",
    async (job) => {
      const { factoringRequestId, tenantId, action } = job.data;

      const request = await prisma.factoringRequest.findUnique({
        where: { id: factoringRequestId },
        include: {
          invoice: { include: { hotel: true, supplier: true, order: true } },
          factoringCompany: true,
        },
      });

      if (!request) {
        throw new Error(`Factoring request ${factoringRequestId} not found`);
      }

      const { invoice } = request;

      if (!invoice) {
        throw new Error(`Factoring request ${factoringRequestId} does not have an associated individual invoice`);
      }

      switch (action) {
        case "INQUIRE": {
          const risk = await assessRisk(invoice.hotelId, tenantId);

          const { bestOffer } = await inquireAll({
            hotelTaxId: invoice.hotel.taxId,
            hotelName: invoice.hotel.name,
            hotelRiskScore: risk.compositeScore,
            hotelRiskTier: risk.riskTier,
            invoiceAmount: Number(invoice.total ?? 0),
            invoiceCurrency: "EGP",
            invoiceDueDate: invoice.dueDate || new Date(Date.now() + 30 * 86400000),
            etaUuid: invoice.etaUuid || "",
          });

          const eligible = !!bestOffer;

          await prisma.factoringRequest.update({
            where: { id: factoringRequestId },
            data: {
              status: eligible ? "UNDER_REVIEW" : "REJECTED",
              partnerResponse: eligible
                ? JSON.stringify({
                    offer: {
                      partnerId: bestOffer.partnerId,
                      partnerName: bestOffer.partnerName,
                      advanceRate: bestOffer.maxAdvanceRate,
                      discountRate: bestOffer.discountRate,
                      estimatedDisbursement: bestOffer.estimatedDisbursement,
                    },
                  })
                : undefined,
            },
          });

          await recordSwarmEvent("factoring_inquiry", eligible ? "INFO" : "WARNING", {
            jobId: job.id,
            factoringRequestId,
            eligible,
          });

          return { eligible };
        }

        case "FUND": {
          if (request.status !== "APPROVED") {
            throw new Error(`Cannot fund request in status ${request.status}`);
          }

          const platformFee = Number(request.platformFee || Number(invoice.total) * 0.025);
          const partnerFee = Number(request.factoringFee || 0);
          const netDisbursement = Number(invoice.total) - platformFee - partnerFee;

          const partner = getPartner(request.factoringCompanyId || "");
          if (!partner) {
            throw new Error("Factoring partner not found");
          }

          const funding = await fundThroughPartner(request.factoringCompanyId, {
            eligibilityResponseId: request.id,
            invoiceId: invoice.id,
            etaUuid: invoice.etaUuid || "",
            grossAmount: Number(invoice.total ?? 0),
            platformFee,
            netDisbursement,
            supplierBankAccount: invoice.supplier.bankAccount || "",
            supplierBankName: invoice.supplier.bankName || "",
            supplierTaxId: invoice.supplier.taxId,
            hotelTaxId: invoice.hotel.taxId,
          });

          if (!funding.success) {
            throw new Error("Funding execution failed");
          }

          await prisma.factoringRequest.update({
            where: { id: factoringRequestId },
            data: {
              status: "DISBURSED",
              disbursedAmount: funding.disbursedAmount,
              disbursedAt: funding.disbursedAt,
              partnerResponse: JSON.stringify({
                transactionReference: funding.transactionReference,
                partnerResponse: funding.partnerResponse,
              }),
            },
          });

          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { factoringStatus: "PAID" },
          });

          // Write CreditTransaction ledger entries
          await prisma.creditTransaction.createMany({
            data: [
              {
                tenantId,
                hotelId: invoice.hotelId,
                invoiceId: invoice.id,
                factoringCompanyId: request.factoringCompanyId,
                type: "FACTORING_ADVANCE",
                amount: funding.disbursedAmount,
                description: `Factoring disbursement — ${funding.transactionReference}`,
              },
              {
                tenantId,
                hotelId: invoice.hotelId,
                invoiceId: invoice.id,
                factoringCompanyId: request.factoringCompanyId,
                type: "FACTORING_COLLECTION",
                amount: platformFee,
                description: `Platform fee on factoring — ${invoice.invoiceNumber}`,
              },
              {
                tenantId,
                hotelId: invoice.hotelId,
                invoiceId: invoice.id,
                factoringCompanyId: request.factoringCompanyId,
                type: "ADJUSTMENT",
                amount: partnerFee,
                description: `Factoring partner fee — ${invoice.invoiceNumber}`,
              },
            ],
          });

          // Auto-post factoring journal: Dr Bank / Cr Factoring Liability
          const journalLines = [
            { accountCode: "1100", accountName: "Bank / Cash", debit: funding.disbursedAmount, credit: 0 },
            { accountCode: "2300", accountName: "Factoring Liability", debit: 0, credit: funding.disbursedAmount },
          ];
          await prisma.journalEntry.create({
            data: {
              tenantId,
              entryNumber: `JE-FAC-${invoice.invoiceNumber}-${Date.now()}`,
              date: new Date(),
              sourceType: "ADJUSTMENT",
              sourceId: invoice.id,
              description: `Factoring disbursement — ${funding.transactionReference}`,
              lines: JSON.stringify(journalLines),
              totalDebit: funding.disbursedAmount,
              totalCredit: funding.disbursedAmount,
              status: "POSTED",
              hotelId: invoice.hotelId,
            },
          });

          // Update credit facility utilization
          await prisma.creditFacility.updateMany({
            where: { hotelId: invoice.hotelId, status: "ACTIVE" },
            data: {
              utilized: { increment: Number(invoice.total ?? 0) },
            },
          });

          // Notify supplier
          if (invoice.supplier?.email) {
            const template = factoringDisbursedTemplate({
              supplierName: invoice.supplier.name,
              invoiceId: invoice.invoiceNumber || invoice.id,
              amount: funding.disbursedAmount,
              currency: "EGP",
              partnerName: request.factoringCompany?.name || "Factoring Partner",
            });
            await addEmailJob({
              to: [invoice.supplier.email],
              ...template,
              metadata: { tenantId, entityType: "INVOICE", entityId: invoice.id },
            });
          }

          await recordSwarmEvent("factoring_funded", "INFO", {
            jobId: job.id,
            factoringRequestId,
            disbursedAmount: funding.disbursedAmount,
          });

          return { funded: true, disbursedAmount: funding.disbursedAmount };
        }

        case "COLLECT_FEES": {
          const platformFee = Number(request.platformFee || 0);

          if (platformFee > 0) {
            await prisma.creditTransaction.create({
              data: {
                tenantId,
                hotelId: invoice.hotelId,
                invoiceId: invoice.id,
                factoringCompanyId: request.factoringCompanyId,
                type: "FACTORING_COLLECTION",
                amount: platformFee,
                description: `Platform fee collected — ${invoice.invoiceNumber}`,
              },
            });
          }

          await recordSwarmEvent("factoring_fees_collected", "INFO", {
            jobId: job.id,
            factoringRequestId,
            platformFee,
          });

          return { feesCollected: true };
        }

        case "SETTLE": {
          await prisma.factoringRequest.update({
            where: { id: factoringRequestId },
            data: { status: "SETTLED", settledAt: new Date() },
          });

          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { factoringStatus: "PAID" },
          });

          await recordSwarmEvent("factoring_settled", "INFO", {
            jobId: job.id,
            factoringRequestId,
          });

          return { settled: true };
        }

        default:
          throw new Error(`Unknown factoring action: ${action}`);
      }
    },
    { connection: getRedisConnection(), concurrency: 2 }
  );
}
