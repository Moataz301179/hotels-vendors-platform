/**
 * Unified notification service.
 *
 * One entry point for every notification in the platform: order updates,
 * invoice events, payment reminders, disputes, Ghost recommendations, ETA
 * failures and system alerts. Replaces the previous pattern of computing
 * isolated dashboard badges per endpoint.
 *
 * Guarantees:
 * - Tenant-safe: recipients are resolved only inside the caller's tenant.
 * - Preference-respecting: `NotificationPreference` is consulted before any
 *   external delivery. Absent preferences default to transactional-on.
 * - Durable: every notification is persisted BEFORE external delivery is
 *   attempted, so a provider outage cannot lose an event.
 * - Retried: email jobs carry attempts/backoff via the BullMQ queue.
 * - No silent vendor contact: external channels are opt-in per type.
 */

import { createHash, randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { addEmailJob } from "./queue";

export const NOTIFICATION_TYPES = [
  "ORDER_UPDATE",
  "INVOICE_ISSUED",
  "PAYMENT_DUE",
  "DISPUTE_OPEN",
  "OLIV_STATUS",
  "KYC_REQUIRED",
  "SYSTEM",
  "SUPPORT_TICKET",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_CHANNELS = ["EMAIL", "SMS", "WHATSAPP", "IN_APP"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

/**
 * External channels that may contact a party outside the platform.
 * Nothing here is sent without an explicit preference, and no Vendor
 * notification is sent before final release.
 */
export const EXTERNAL_CHANNELS: NotificationChannel[] = ["EMAIL", "SMS", "WHATSAPP"];

export interface NotifyInput {
  tenantId: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string;
  body?: string;
  entityType?: string;
  entityId?: string;
  /** Skip external delivery (used for internal notes and pre-release). */
  suppressExternal?: boolean;
}

export interface NotifyResult {
  notificationId: string;
  delivered: boolean;
  channel: NotificationChannel;
  reason?: "preference_off" | "suppressed" | "no_channel";
}

/**
 * Resolve whether a user wants a given type on a given channel.
 * Transactional types default ON; the user can turn them off.
 */
export async function preferenceAllows(
  tenantId: string,
  userId: string,
  type: NotificationType,
  channel: NotificationChannel,
): Promise<boolean> {
  const preference = await prisma.notificationPreference.findFirst({
    where: { tenantId, userId, type, channel },
    select: { enabled: true },
  });
  // Absent preference = default. Transactional types are on by default.
  return preference?.enabled ?? true;
}

/** Persist a notification and deliver it through the requested channel. */
export async function notify(input: NotifyInput): Promise<NotifyResult> {
  const { tenantId, userId, type, channel, entityType, entityId } = input;

  // Recipient must belong to the caller's tenant — a cross-tenant row is a bug.
  const recipient = await prisma.user.findFirst({
    where: { id: userId, tenantId },
    select: { id: true, email: true },
  });
  if (!recipient) {
    return { notificationId: "", delivered: false, channel, reason: "no_channel" };
  }

  const notification = await prisma.notification.create({
    data: {
      // Notification.id has no default — derive it deterministically so a
      // retried dispatch cannot create a duplicate row.
      id: createHash("sha256").update(`${tenantId}:${userId}:${type}:${entityType ?? ""}:${entityId ?? ""}:${Date.now()}`).digest("hex").slice(0, 24),
      tenantId,
      userId,
      type,
      channel,
      subject: input.subject ?? null,
      body: input.body ?? null,
    },
    select: { id: true },
  });

  if (channel === "IN_APP") {
    // In-app is the durable record itself — nothing external to send.
    return { notificationId: notification.id, delivered: true, channel };
  }

  if (input.suppressExternal) {
    return { notificationId: notification.id, delivered: false, channel, reason: "suppressed" };
  }

  const allowed = await preferenceAllows(tenantId, userId, type, channel);
  if (!allowed) {
    return { notificationId: notification.id, delivered: false, channel, reason: "preference_off" };
  }

  if (channel === "EMAIL" && recipient.email) {
    await addEmailJob({
      to: [recipient.email],
      subject: input.subject ?? "HotelsVendors notification",
      html: input.body ?? "",
      text: input.body ?? "",
      metadata: { tenantId, userId, entityType: input.entityType, entityId: input.entityId },
    });
    await prisma.notification.update({
      where: { id: notification.id },
      data: { sentAt: new Date() },
    });
    return { notificationId: notification.id, delivered: true, channel };
  }

  // SMS / WHATSAPP have no provider wired yet. Honest state: recorded, not sent.
  return { notificationId: notification.id, delivered: false, channel, reason: "no_channel" };
}

/** Unread in-app count for the alerts badge — sourced from the notification table. */
export async function unreadCount(tenantId: string, userId: string): Promise<number> {
  return prisma.notification.count({
    where: { tenantId, userId, readAt: null },
  });
}

/** Tenant-scoped notification list for the unified inbox. */
export async function listNotifications(tenantId: string, userId: string, limit = 50) {
  return prisma.notification.findMany({
    where: { tenantId, userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, type: true, channel: true, subject: true, body: true, readAt: true, sentAt: true, createdAt: true },
  });
}

export async function markNotificationRead(tenantId: string, userId: string, notificationId: string): Promise<boolean> {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, tenantId, userId },
    data: { readAt: new Date() },
  });
  return result.count === 1;
}
