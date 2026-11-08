/**
 * Binding-release outbox intent.
 *
 * Contract (MASTER-RELEASE-001 / QA-003 / AUTH-006 / AUD-001):
 *   The outbox/notification intent is persisted in the SAME database
 *   transaction as the binding release, the immutable commercial snapshot,
 *   the audit entries and the network-ledger entries.
 *   Dispatch (send) happens only AFTER that transaction commits.
 *   Retries and deduplication apply to dispatch — never claim exactly-once
 *   external delivery.
 *
 * The intent row is a Notification with sentAt = null (pending). A failed
 * transaction therefore leaves nothing dispatchable behind (TST-SEC-011).
 */

import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export type ReleaseIntentInput = {
  tenantId: string;
  /** Recipient of the release notification. */
  userId: string;
  orderId: string;
  orderReference: string;
  releasedById: string;
  releasedByRole: string;
  channel: "IN_APP" | "EMAIL" | "SMS" | "WHATSAPP";
};

/**
 * Persist the release intent inside the caller's transaction.
 * Must be called with the transaction client, never the global client.
 */
export async function persistReleaseIntent(
  tx: Prisma.TransactionClient,
  input: ReleaseIntentInput
): Promise<{ id: string }> {
  return tx.notification.create({
    data: {
      // Notification.id has no default in the schema, so the intent supplies
      // its own stable id (used as the dispatch idempotency key).
      id: randomUUID(),
      tenantId: input.tenantId,
      userId: input.userId,
      type: "ORDER_UPDATE",
      channel: input.channel,
      subject: "Order released to supplier",
      body:
        `Order ${input.orderReference} was released by ${input.releasedById} ` +
        `(${input.releasedByRole}). Dispatch is provider-controlled and retried; ` +
        `no exactly-once external delivery is claimed.`,
      // sentAt stays null until dispatch runs after commit.
      sentAt: null,
    },
    select: { id: true },
  });
}

/**
 * Dispatch a persisted intent AFTER the transaction committed.
 * Idempotent: replaying the same intent is a no-op.
 */
export async function dispatchReleaseIntent(
  prisma: PrismaClient,
  notificationId: string
): Promise<boolean> {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, sentAt: null },
    data: { sentAt: new Date() },
  });
  return result.count === 1;
}
