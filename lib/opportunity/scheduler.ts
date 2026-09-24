/**
 * Opportunity Analysis Scheduler
 *
 * Queues daily cost-opportunity analysis for all active tenants via BullMQ.
 * Gracefully degrades when Redis is unavailable.
 */

import { Queue, type ConnectionOptions } from "bullmq";
import { prisma } from "../prisma";

const REDIS_URL = process.env.REDIS_URL;

function redisConnection(): ConnectionOptions {
  if (REDIS_URL) {
    const url = new URL(REDIS_URL);
    return {
      host: url.hostname,
      port: Number(url.port || "6379"),
      password: url.password || undefined,
      maxRetriesPerRequest: null,
    };
  }
  return {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT || "6380"),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
  };
}

export interface OpportunityAnalysisJobData {
  tenantId: string;
  triggeredBy: "scheduler" | "manual";
  timestamp: string;
}

let queueInstance: Queue<OpportunityAnalysisJobData> | null = null;

function getQueue(): Queue<OpportunityAnalysisJobData> | null {
  if (!REDIS_URL && !process.env.REDIS_HOST) return null;
  if (!queueInstance) {
    queueInstance = new Queue<OpportunityAnalysisJobData>("hv-opportunity-analysis", {
      connection: redisConnection(),
    });
  }
  return queueInstance;
}

/**
 * Fetch all active tenant IDs from the database.
 */
async function getActiveTenantIds(): Promise<string[]> {
  const tenants = await prisma.tenant.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });
  return tenants.map((t) => t.id);
}

/**
 * Schedule daily analysis for all active tenants.
 * Returns the number of jobs queued, or 0 if Redis is unavailable.
 */
export async function scheduleDailyAnalysis(): Promise<{
  queued: number;
  tenantIds: string[];
  errors: string[];
}> {
  const queue = getQueue();
  const errors: string[] = [];

  if (!queue) {
    return { queued: 0, tenantIds: [], errors: ["Redis not available — queue unavailable"] };
  }

  let tenantIds: string[];
  try {
    tenantIds = await getActiveTenantIds();
  } catch (err) {
    return {
      queued: 0,
      tenantIds: [],
      errors: [`Failed to fetch tenants: ${err instanceof Error ? err.message : String(err)}`],
    };
  }

  if (tenantIds.length === 0) {
    return { queued: 0, tenantIds: [], errors: [] };
  }

  let queued = 0;
  const timestamp = new Date().toISOString();

  for (const tenantId of tenantIds) {
    try {
      await queue.add(
        "analyze-tenant",
        {
          tenantId,
          triggeredBy: "scheduler",
          timestamp,
        },
        {
          jobId: `daily-analysis:${tenantId}:${timestamp.slice(0, 10)}`, // dedupe per day
          removeOnComplete: 100,
          removeOnFail: 100,
          attempts: 2,
          backoff: { type: "exponential", delay: 10000 },
        }
      );
      queued++;
    } catch (err) {
      errors.push(
        `Failed to queue ${tenantId}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return { queued, tenantIds, errors };
}

/**
 * Schedule analysis for a single tenant (used by manual trigger or testing).
 */
export async function scheduleTenantAnalysis(
  tenantId: string,
  triggeredBy: "manual" | "scheduler" = "manual"
): Promise<{ queued: boolean; jobId?: string; error?: string }> {
  const queue = getQueue();
  if (!queue) {
    return { queued: false, error: "Redis not available" };
  }

  try {
    const job = await queue.add(
      "analyze-tenant",
      {
        tenantId,
        triggeredBy,
        timestamp: new Date().toISOString(),
      },
      {
        removeOnComplete: 100,
        removeOnFail: 100,
        attempts: 2,
        backoff: { type: "exponential", delay: 5000 },
      }
    );
    return { queued: true, jobId: job.id };
  } catch (err) {
    return {
      queued: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Get queue status for monitoring.
 */
export async function getSchedulerStatus(): Promise<{
  available: boolean;
  waiting: number;
  active: number;
  failed: number;
  completed: number;
}> {
  const queue = getQueue();
  if (!queue) {
    return { available: false, waiting: 0, active: 0, failed: 0, completed: 0 };
  }
  try {
    const [waiting, active, failed, completed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getFailedCount(),
      queue.getCompletedCount(),
    ]);
    return { available: true, waiting, active, failed, completed };
  } catch {
    return { available: false, waiting: 0, active: 0, failed: 0, completed: 0 };
  }
}
