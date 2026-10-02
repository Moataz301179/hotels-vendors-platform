import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { apiRoute, authenticate, requirePermission, success, error } from "@/lib/api-utils";

const CreditLineApplicationSchema = z.object({
  hotelInfo: z.object({
    hotelName: z.string().min(1),
    brand: z.string().optional(),
    properties: z.string().optional(),
    rooms: z.string().optional(),
    governorate: z.string().optional(),
    address: z.string().optional(),
    crNumber: z.string().min(1),
    taxId: z.string().min(1),
    tourismLicense: z.string().optional(),
    gmName: z.string().optional(),
    gmPhone: z.string().optional(),
    gmEmail: z.string().email().optional(),
    cfoName: z.string().optional(),
    cfoPhone: z.string().optional(),
  }),
  financials: z.object({
    annualRevenue: z.string().optional(),
    netProfit: z.string().optional(),
    totalAssets: z.string().optional(),
    currentAssets: z.string().optional(),
    totalLiabilities: z.string().optional(),
    currentLiabilities: z.string().optional(),
    bankBalance: z.string().optional(),
    monthlyPurchases: z.string().optional(),
    avgPaymentDays: z.string().optional(),
    existingDebt: z.string().optional(),
  }),
  collateral: z.object({
    propertyDeed: z.boolean(),
    bankGuarantee: z.boolean(),
    personalGuarantee: z.boolean(),
    equipmentCollateral: z.boolean(),
    depositAmount: z.string().optional(),
  }),
  creditScore: z.number().min(0).max(100),
  recommendedLimit: z.number().min(0),
});

export const POST = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "factoring:manage");

  try {
    const body = await request.json();
    const data = CreditLineApplicationSchema.parse(body);

    const application = await prisma.creditLineApplication.create({
      data: {
        hotelName: data.hotelInfo.hotelName,
        brand: data.hotelInfo.brand || null,
        properties: parseInt(data.hotelInfo.properties || "0") || null,
        rooms: parseInt(data.hotelInfo.rooms || "0") || null,
        governorate: data.hotelInfo.governorate || null,
        address: data.hotelInfo.address || null,
        crNumber: data.hotelInfo.crNumber,
        taxId: data.hotelInfo.taxId,
        tourismLicense: data.hotelInfo.tourismLicense || null,
        gmName: data.hotelInfo.gmName || null,
        gmPhone: data.hotelInfo.gmPhone || null,
        gmEmail: data.hotelInfo.gmEmail || null,
        cfoName: data.hotelInfo.cfoName || null,
        cfoPhone: data.hotelInfo.cfoPhone || null,
        annualRevenue: data.financials.annualRevenue ? parseFloat(data.financials.annualRevenue) : null,
        netProfit: data.financials.netProfit ? parseFloat(data.financials.netProfit) : null,
        totalAssets: data.financials.totalAssets ? parseFloat(data.financials.totalAssets) : null,
        currentAssets: data.financials.currentAssets ? parseFloat(data.financials.currentAssets) : null,
        totalLiabilities: data.financials.totalLiabilities ? parseFloat(data.financials.totalLiabilities) : null,
        currentLiabilities: data.financials.currentLiabilities ? parseFloat(data.financials.currentLiabilities) : null,
        bankBalance: data.financials.bankBalance ? parseFloat(data.financials.bankBalance) : null,
        monthlyPurchases: data.financials.monthlyPurchases ? parseFloat(data.financials.monthlyPurchases) : null,
        avgPaymentDays: data.financials.avgPaymentDays ? parseFloat(data.financials.avgPaymentDays) : null,
        existingDebt: data.financials.existingDebt ? parseFloat(data.financials.existingDebt) : null,
        propertyDeed: data.collateral.propertyDeed,
        bankGuarantee: data.collateral.bankGuarantee,
        personalGuarantee: data.collateral.personalGuarantee,
        equipmentCollateral: data.collateral.equipmentCollateral,
        depositAmount: data.collateral.depositAmount ? parseFloat(data.collateral.depositAmount) : null,
        creditScore: data.creditScore,
        recommendedLimit: data.recommendedLimit,
        status: "PENDING_REVIEW",
        tenantId: auth.tenantId,
      },
    });

    // Trigger AI analysis asynchronously with internal service authentication.
    const serviceKey = process.env.INVO_SERVICE_KEY;
    if (!serviceKey) {
      console.error("[Credit Line] INVO_SERVICE_KEY not configured — skipping AI analysis");
    } else {
      fetch(`${process.env.APP_URL || "http://localhost:3000"}/api/v1/factoring/credit-lines/${application.id}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
      }).catch(() => {});
    }

    return success({ id: application.id, status: application.status });
  } catch (err) {
    console.error("[Credit Line] Error:", err);
    return error("Failed to submit application", 500);
  }
});

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "factoring:manage");

  try {
    const applications = await prisma.creditLineApplication.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return success(applications);
  } catch {
    return error("Failed to fetch applications", 500);
  }
});
