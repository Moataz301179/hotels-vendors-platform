import { NextRequest, NextResponse } from "next/server";
import { apiRoute, authenticate, requirePermission } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getSquadPerformance } from "@/lib/swarm/monitoring";

export const GET = apiRoute(async (request: NextRequest) => {
  const auth = await authenticate(request);
  await requirePermission(auth, "admin:manage_platform");

  const [battlePlan, squadHealth, recentJobs, pendingApprovals, recentEvents, metrics] = await Promise.all([
    prisma.swarmMemory.findFirst({
      where: { agentId: "director", memoryType: "STRATEGY" },
      orderBy: { createdAt: "desc" },
    }),
    getSquadPerformance(7),
    prisma.swarmJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        jobType: true,
        squad: true,
        status: true,
        priority: true,
        output: true,
        findings: true,
        createdAt: true,
        completedAt: true,
      },
    }),
    prisma.swarmJob.findMany({
      where: { status: "WAITING_APPROVAL" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        jobType: true,
        squad: true,
        status: true,
        priority: true,
        output: true,
        findings: true,
        createdAt: true,
      },
    }),
    prisma.swarmEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        eventType: true,
        severity: true,
        message: true,
        payload: true,
        createdAt: true,
        acknowledgedAt: true,
      },
    }),
    Promise.all([
      prisma.hotel.count(),
      prisma.supplier.count(),
      prisma.order.count(),
      prisma.product.count(),
      prisma.user.count(),
      prisma.order.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        select: { total: true },
      }),
      prisma.invoice.count({ where: { etaStatus: { in: ["ACCEPTED"] } } }),
      prisma.factoringRequest.count(),
    ]),
  ]);

  const [hotelCount, supplierCount, orderCount, productCount, userCount, recentOrders, etaCompliantInvoices, factoringCount] = metrics;
  const monthlyGmv = recentOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  return NextResponse.json({
    success: true,
    data: {
      battlePlan: battlePlan ? {
        date: battlePlan.createdAt,
        content: battlePlan.content,
        confidence: battlePlan.confidence,
      } : null,
      squadHealth,
      recentJobs: recentJobs.map((j) => ({
        ...j,
        result: j.output || j.findings || null,
      })),
      pendingApprovals: pendingApprovals.map((j) => ({
        ...j,
        result: j.output || j.findings || null,
      })),
      recentEvents,
      metrics: {
        hotels: hotelCount,
        suppliers: supplierCount,
        orders: orderCount,
        products: productCount,
        users: userCount,
        monthlyGmv,
        etaCompliantInvoices,
        factoringRequests: factoringCount,
      },
    },
  });
});
