/**
 * Dead-Letter Queue Manager
 * Hotels Vendors Reliability Layer
 *
 * Centralized DLQ for all business-critical queues.
 * Failed jobs are moved here after max retries for manual inspection and retry.
 */

import { Queue, Worker, Job } from "bullmq";
import { getRedisConnection } from "./connection";
import { prisma } from "@/lib/prisma";

// ── DLQ Registry ──
export const deadLetterQueues: Record<string, Queue> = {};

export function getDeadLetterQueue(sourceQueueName: string): Queue {
  const dlqName = `${sourceQueueName}-dlq`;
  if (!deadLetterQueues[dlqName]) {
    deadLetterQueues[dlqName] = new Queue(dlqName, { connection: getRedisConnection() });
  }
  return deadLetterQueues[dlqName];
}

// ── Move job to DLQ ──
export async function moveToDeadLetter(
  sourceQueueName: string,
  job: Job,
  failedReason: string,
  tenantId: string = "system"
): Promise<Job> {
  const dlq = getDeadLetterQueue(sourceQueueName);

  const dlqJob = await dlq.add(
    job.name,
    {
      ...job.data,
      _dlq: {
        originalJobId: job.id,
        originalQueue: sourceQueueName,
        failedAt: new Date().toISOString(),
        failedReason,
        attemptsMade: job.attemptsMade,
      },
    },
    {
      jobId: `dlq-${sourceQueueName}-${job.id}`,
      removeOnComplete: false,
      removeOnFail: false,
    }
  );

  // Persist to Prisma for admin visibility
  await prisma.swarmJob.create({
    data: {
      queueName: `${sourceQueueName}-dlq`,
      jobType: `dlq:${job.name}`,
      jobName: `DLQ: ${job.name}`,
      squad: "dead-letter",
      assignedAgent: "dlq-manager",
      status: "FAILED",
      payload: JSON.stringify(job.data),
      error: failedReason,
      output: JSON.stringify({ failedReason, originalQueue: sourceQueueName }),
      startedAt: new Date(),
      completedAt: new Date(),
      durationMs: 0,
      tenantId,
    },
  });

  return dlqJob;
}

// ── Retry from DLQ ──
export async function retryFromDeadLetter(
  sourceQueueName: string,
  dlqJobId: string
): Promise<Job> {
  const dlq = getDeadLetterQueue(sourceQueueName);
  const dlqJob = await dlq.getJob(dlqJobId);

  if (!dlqJob) {
    throw new Error(`DLQ job ${dlqJobId} not found`);
  }

  const sourceQueue = new Queue(sourceQueueName, { connection: getRedisConnection() });
  const payload = dlqJob.data;
  delete payload._dlq;

  const newJob = await sourceQueue.add(dlqJob.name, payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 10000 },
  });

  await dlqJob.remove();

  return newJob;
}

// ── List DLQ jobs ──
export async function listDeadLetterJobs(sourceQueueName: string): Promise<Job[]> {
  const dlq = getDeadLetterQueue(sourceQueueName);
  const jobIds = await dlq.getJobs(["waiting", "delayed", "paused"]);
  return jobIds;
}

// ── DLQ Worker (generic) ──
export function createDlqWorker(sourceQueueName: string): Worker {
  const dlqName = `${sourceQueueName}-dlq`;
  return new Worker(
    dlqName,
    async (job) => {
      // DLQ jobs are not processed automatically — they await manual retry
      // This worker just logs that a job is sitting in DLQ
      console.log(`[DLQ] Job ${job.id} from ${sourceQueueName} awaiting manual retry`);
      return { status: "awaiting_manual_retry" };
    },
    { connection: getRedisConnection(), concurrency: 1 }
  );
}
