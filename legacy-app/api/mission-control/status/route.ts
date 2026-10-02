import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { prisma } from "@/lib/prisma";
import { authenticate, error as apiError, success } from "@/lib/api-utils";

const STATE_FILE = "/tmp/mission-control-state.json";

function readState(): any {
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
  } catch {
    return {};
  }
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 1. Authenticate — admin access only
  let auth;
  try {
    auth = await authenticate(request);
  } catch {
    return apiError("Unauthorized", 401);
  }

  // 2. RBAC — only platform admins may access infrastructure telemetry
  if (auth.platformRole !== "ADMIN" && auth.platformRole !== "SUPER_ADMIN") {
    return apiError("Forbidden", 403);
  }

  try {
    const state = readState();
    const { tenantId } = auth;

    // ── BullMQ Queues ──
    let queues: any[] = [];
    try {
      const { redis } = await import("@/lib/redis");
      if (redis) {
        const queueNames = ["swarm_execution", "swarm_intelligence", "eta_submission", "email"];
        for (const name of queueNames) {
          const waiting = await redis.llen(`bull:${name}:wait`).catch(() => 0);
          const active = await redis.llen(`bull:${name}:active`).catch(() => 0);
          const completed = await redis.get(`bull:${name}:id`).catch(() => 0);
          const failed = await redis.llen(`bull:${name}:failed`).catch(() => 0);
          queues.push({ name, waiting, active, completed: Number(completed) || 0, failed });
        }
      }
    } catch { queues = []; }

    // ── Recent Pipeline Activity (tenant-scoped) ──
    const recentActivity = await getRecentActivity(tenantId);

    // ── Payment Pipeline (tenant-scoped) ──
    const paymentPipeline = await getPaymentPipeline(tenantId);

    // ── Factoring Pipeline (tenant-scoped) ──
    const factoringPipeline = await getFactoringPipeline(tenantId);

    return success({
      kimi: {
        agents: state.kimi?.agents || [],
        queues,
      },
      hermes: {
        agents: state.hermes?.agents || [],
        lastSync: state.hermes?.lastSync || "never",
      },
      paymentPipeline,
      factoringPipeline,
      recentActivity,
      syncTime: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Mission Control status error:", err);
    return apiError(err.message, 500);
  }
}

async function getRecentActivity(tenantId: string) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        entityName: true,
        entityId: true,
        actionType: true,
        actorId: true,
        actorRole: true,
        createdAt: true,
      },
    });
    return logs.map((l) => ({
      id: l.id,
      type: l.entityName,
      action: l.actionType,
      actor: l.actorId || "system",
      role: l.actorRole || "SYSTEM",
      time: l.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

async function getPaymentPipeline(tenantId: string) {
  try {
    const txs = await prisma.paymentTransaction.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        transactionType: true,
        status: true,
        amount: true,
        currency: true,
        gatewayRef: true,
        observedMethod: true,
        createdAt: true,
      },
    });
    return txs.map((t) => ({
      id: t.id,
      type: t.transactionType,
      status: t.status,
      amount: Number(t.amount),
      currency: t.currency,
      gatewayRef: t.gatewayRef,
      method: t.observedMethod,
      time: t.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

async function getFactoringPipeline(tenantId: string) {
  try {
    const reqs = await prisma.factoringRequest.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        invoice: { select: { invoiceNumber: true } },
        factoringCompany: { select: { name: true } },
      },
    });
    return reqs.map((r) => ({
      id: r.id,
      status: r.status,
      invoiceNumber: r.invoice?.invoiceNumber || "—",
      partner: r.factoringCompany?.name || "—",
      amount: Number(r.disbursedAmount || r.requestedAmount || 0),
      advanceRate: Number(r.advanceRate),
      time: r.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}
