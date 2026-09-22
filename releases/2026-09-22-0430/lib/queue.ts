/**
 * BullMQ job queue — transactional backbone for scraping / catalog-sync / webhooks.
 *
 * Enables: dedupe, retry with backoff, rate-limiting, and visible job state.
 * Jobs are processed by scripts/queue-worker.ts (BullMQ worker on Redis).
 * Gracefully degrades to no-op when Redis is unavailable.
 */

import { Queue, Worker, Job } from "bullmq";
import { getRedis } from "@/lib/redis";

const REDIS_URL = process.env.REDIS_URL;

export type SourceJobType = "scrape" | "catalog-sync" | "aggregator-checkout" | "apify-discovery";

export interface SourceJobData {
  type: SourceJobType;
  providerId?: string;
  payload?: unknown;
  jobKey: string; // dedupe key (e.g. "scrape:metro-egypt")
  attempt?: number;
}

function redisConnection() {
  return {
    host: (REDIS_URL ? new URL(REDIS_URL).hostname : process.env.REDIS_HOST) || "localhost",
    port: REDIS_URL ? Number(new URL(REDIS_URL).port || "6379") : Number(process.env.REDIS_PORT || "6380"),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null, // required by bullmq
  };
}

let queueInstance: Queue<SourceJobData> | null = null;
function getQueue(): Queue<SourceJobData> | null {
  if (!REDIS_URL && !process.env.REDIS_HOST) return null;
  if (!queueInstance) {
    queueInstance = new Queue<SourceJobData>("hv-sourcing", { connection: redisConnection() });
  }
  return queueInstance;
}

export const SOURCE_JOB_CONCURRENCY = 4;

/**
 * Enqueue a sourcing job. Returns false (degrade-to-sync) when the queue
 * isn't available so callers can fall back to running inline.
 */
export async function enqueueSourceJob(data: SourceJobData): Promise<{ enqueued: boolean; jobId?: string }> {
  const q = getQueue();
  if (!q) return { enqueued: false };
  try {
    const job = await q.add(
      data.type,
      data,
      {
        jobId: data.jobKey,               // dedupe: same jobKey replaces pending/duplicates
        removeOnComplete: 500,
        removeOnFail: 500,
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      }
    );
    return { enqueued: true, jobId: job.id };
  } catch {
    return { enqueued: false };
  }
}

export async function getQueueStatus(): Promise<{ count: number; waiting: number; active: number; failed: number }> {
  const q = getQueue();
  if (!q) return { count: 0, waiting: 0, active: 0, failed: 0 };
  try {
    const [waiting, active, failed] = await Promise.all([
      q.getWaitingCount(), q.getActiveCount(), q.getFailedCount(),
    ]);
    return { count: waiting + active + failed, waiting, active, failed };
  } catch {
    return { count: 0, waiting: 0, active: 0, failed: 0 };
  }
}
