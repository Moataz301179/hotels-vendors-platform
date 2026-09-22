/**
 * Email Notification Queue
 * Hotels Vendors Communications Layer
 *
 * All emails are queued for async delivery via BullMQ.
 * Prevents email API latency from blocking HTTP responses.
 */

import { Queue, Worker, Job } from "bullmq";
import { getRedisConnection } from "@/lib/queues/connection";
import { sendEmail } from "./email";
import { recordSwarmEvent } from "@/lib/swarm/monitoring";

export const emailQueue = new Queue("email-notifications", {
  connection: getRedisConnection(),
});

export interface EmailJobPayload {
  to: string[];
  subject: string;
  html: string;
  text?: string;
  metadata?: {
    tenantId?: string;
    userId?: string;
    entityType?: string;
    entityId?: string;
  };
}

export async function addEmailJob(
  payload: EmailJobPayload,
  options: { delay?: number } = {}
): Promise<Job> {
  return emailQueue.add("send-email", payload, {
    delay: options.delay,
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 50 },
  });
}

export function createEmailWorker(): Worker {
  return new Worker<EmailJobPayload>(
    "email-notifications",
    async (job) => {
      const { to, subject, html, text, metadata } = job.data;

      const result = await sendEmail({ to, subject, html, text });

      await recordSwarmEvent("email_sent", "INFO", {
        jobId: job.id,
        to: to.join(", "),
        subject,
        emailId: result.id,
        tenantId: metadata?.tenantId,
        entityType: metadata?.entityType,
        entityId: metadata?.entityId,
      });

      return { sent: true, emailId: result.id };
    },
    { connection: getRedisConnection(), concurrency: 5 }
  );
}
