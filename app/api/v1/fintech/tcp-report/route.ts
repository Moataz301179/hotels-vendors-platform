/**
 * Total Cost of Procurement (TCP) Report API
 * Hotels Vendors Fintech Layer
 *
 * Generates a detailed TCP report that proves the platform is cheaper
 * than "cheaper" offline deals. This is the primary sales tool for
 * overcoming the "your prices are higher" objection from hotel CFOs.
 *
 * The TCP report accounts for:
 * - Cost of capital (payment delay)
 * - ETA compliance risk
 * - Logistics fragmentation
 * - Storage waste
 * - Dispute losses
 *
 * Endpoint: POST /api/v1/fintech/tcp-report
 */

import { NextRequest } from "next/server";
import { generateTcpReport, type TcpReport } from "@/lib/fintech/hub-revenue";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { authenticate, requirePermission } from "@/lib/api-utils";

const tcpReportSchema = z.object({
  orderId: z.string().optional(),
  hotelId: z.string().optional(),
  // Manual override fields (used if orderId not provided)
  orderTotal: z.number().positive().optional(),
  hotelName: z.string().optional(),
  paymentTermsDays: z.number().min(0).max(365).optional().default(90),
  hotelStorageCostMonthly: z.number().min(0).optional().default(15000),
  averageDisputeRate: z.number().min(0).max(1).optional().default(0.05),
  etaPenaltyRate: z.number().min(0).max(1).optional().default(0.025),
  supplierCostOfCapitalAnnual: z.number().min(0).max(1).optional().default(0.20),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    await requirePermission(auth, "report:read");

    const body = await request.json();
    const parsed = tcpReportSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const params = parsed.data;

    let orderTotal: number;
    let hotelName: string;
    let hotelId: string;
    let orderId: string;

    // If orderId provided, fetch from database
    if (params.orderId) {
      const order = await prisma.order.findFirst({
        where: { id: params.orderId, tenantId: auth.tenantId },
        include: { hotel: true },
      });

      if (!order) {
        return Response.json({ error: "Order not found or unauthorized" }, { status: 404 });
      }

      orderTotal = Number(order.total ?? 0);
      hotelName = order.hotel.name;
      hotelId = order.hotelId;
      orderId = order.id;
    } else if (params.hotelId) {
      const hotel = await prisma.hotel.findFirst({
        where: { id: params.hotelId, tenantId: auth.tenantId },
      });

      if (!hotel) {
        return Response.json({ error: "Hotel not found" }, { status: 404 });
      }

      orderTotal = params.orderTotal || 100_000;
      hotelName = hotel.name;
      hotelId = hotel.id;
      orderId = `demo-${Date.now()}`;
    } else {
      // Demo mode with manual inputs
      orderTotal = params.orderTotal || 100_000;
      hotelName = params.hotelName || "Demo Hotel";
      hotelId = "demo";
      orderId = `demo-${Date.now()}`;
    }

    const report = generateTcpReport({
      hotelId,
      hotelName,
      orderId,
      orderTotal,
      paymentTermsDays: params.paymentTermsDays || 90,
      hotelStorageCostMonthly: params.hotelStorageCostMonthly || 15_000,
      averageDisputeRate: params.averageDisputeRate || 0.05,
      etaPenaltyRate: params.etaPenaltyRate || 0.025,
      supplierCostOfCapitalAnnual: params.supplierCostOfCapitalAnnual || 0.20,
      factoringPartnerRate: 0.025,
      documentProcessingFee: 500,
    });

    // Enrich with platform-specific data
    const enrichedReport = {
      ...report,
      // Breakdown for visualization
      breakdown: [
        { label: "Offline Price", amount: report.offlinePrice, type: "base" },
        { label: "Cost of Capital", amount: report.costOfCapital, type: "hidden" },
        { label: "ETA Penalty Risk", amount: report.etaPenaltyRisk, type: "hidden" },
        { label: "Logistics Fragmentation", amount: report.logisticsFragmentation, type: "hidden" },
        { label: "Storage Waste", amount: report.storageWaste, type: "hidden" },
        { label: "Dispute Losses", amount: report.disputeLosses, type: "hidden" },
        { label: "TRUE Offline Cost", amount: report.totalOfflineCost, type: "total_offline" },
        { label: "Platform Order Total", amount: report.platformOrderTotal, type: "base" },
        { label: "Document Processing Fee", amount: report.platformDocumentFee, type: "fee" },
        { label: "Factoring Partner Fee", amount: report.factoringPartnerFee, type: "fee" },
        { label: "Total Platform Cost", amount: report.totalPlatformCost, type: "total_platform" },
        { label: "SAVINGS", amount: report.absoluteSavings, type: "savings" },
      ],
      // Comparison for quick reference
      comparison: {
        offline: report.totalOfflineCost,
        platform: report.totalPlatformCost,
        savings: report.absoluteSavings,
        savingsPercent: report.percentageSavings,
        paybackPeriodMonths: report.orderTotal > 0 ? Math.ceil(report.totalPlatformCost / (report.orderTotal * 0.025)) : 0,
      },
      // Narrative sections for different audiences
      narratives: {
        cfo: report.narrative,
        procurement: `By consolidating suppliers through Hotels Vendors, you eliminate fragmented delivery costs (${report.logisticsFragmentation.toLocaleString()} EGP savings) and reduce storage requirements by 30% (${report.storageWaste.toLocaleString()} EGP/month).`,
        gm: `Your supplier gets paid within 48 hours, strengthening your relationship and improving pricing power. The platform handles ETA compliance automatically, eliminating penalty risk.`,
        supplier: `You receive ${(report.orderTotal * 0.88).toLocaleString()} EGP within 48 hours instead of waiting 90 days. Zero default risk — if the hotel doesn't pay, the factoring partner absorbs the loss.`,
      },
      generatedAt: new Date().toISOString(),
    };

    return Response.json({
      success: true,
      report: enrichedReport,
    });
  } catch (error) {
    console.error("TCP Report API error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to generate TCP report" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/fintech/tcp-report?orderId=xxx
 * Quick lookup for existing orders
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return Response.json(
      { error: "Missing orderId parameter" },
      { status: 400 }
    );
  }

  // Re-use POST logic
  const req = new NextRequest(request.url, {
    method: "POST",
    body: JSON.stringify({ orderId }),
    headers: request.headers,
  });

  return POST(req);
}
