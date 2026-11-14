/**
 * WhatsApp inbound channel — HotelsVendors MVP.
 *
 * Meta Cloud API webhook messages are routed here after signature verification.
 * Commands are intentionally narrow:
 *   HELP  — list available commands
 *   STATUS — buyer/supplier order status for the linked phone (no vendor identity)
 *   STOP  — opt out of WHATSAPP ORDER_UPDATE preferences
 *
 * Does NOT create orders, approve credit lines, or disclose supplier identity /
 * private commercial data. Credit-line and PO payment remain on the desk/funder path.
 */

import { createHash, randomUUID } from "node:crypto";
import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/auth/phone";
import { hasPermission } from "@/lib/auth/rbac";
import { NOTIFICATION_TYPES, type NotificationType } from "@/lib/notifications/service";
import { normalizeWhatsAppDigits, sendWhatsApp } from "@/lib/notifications/whatsapp";

export type InboundWhatsAppMessage = {
  messageId: string;
  from: string;
  text: string;
};

export type InboundHandleResult = {
  handled: boolean;
  linked: boolean;
  command: string;
  replied: boolean;
  reason?: string;
};

const HELP_TEXT =
  "HotelsVendors WhatsApp\n\n" +
  "Commands:\n" +
  "• STATUS — recent order status (order number + state only)\n" +
  "• STOP — pause WhatsApp order updates\n" +
  "• HELP — this message\n\n" +
  "Orders and credit-line approvals stay in the HotelsVendors workspace. " +
  "This channel never names suppliers or shares private commercial terms.";

function phoneCandidates(raw: string): string[] {
  const e164 = normalizePhone(raw);
  const digits = normalizeWhatsAppDigits(raw);
  const withPlus = digits.startsWith("+") ? digits : `+${digits}`;
  return Array.from(new Set([e164, withPlus, digits, e164.replace(/^\+/, "")].filter(Boolean)));
}

/**
 * Resolve a WhatsApp sender to an operational account.
 * Mirrors getActorInternal: deleted rows and non-ACTIVE statuses are not actors.
 */
async function findUserByWhatsAppPhone(from: string) {
  const candidates = phoneCandidates(from);
  return prisma.user.findFirst({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      OR: candidates.map((phone) => ({ phone })),
    },
    select: {
      id: true,
      tenantId: true,
      phone: true,
      platformRole: true,
      hotelId: true,
      supplierId: true,
      status: true,
    },
  });
}

function parseCommand(text: string): string {
  const cleaned = text.trim().split(/\s+/)[0]?.toUpperCase() ?? "";
  if (cleaned === "STATUS" || cleaned === "STOP" || cleaned === "HELP" || cleaned === "START") {
    return cleaned;
  }
  return "UNKNOWN";
}

/**
 * Buyer-safe order lines: order number + status only. Never supplier names/ids.
 * Auth boundary matches GET /api/v2/orders: ACTIVE actor (lookup) + order:read.
 */
async function statusReplyForUser(user: {
  id: string;
  tenantId: string;
  platformRole: PlatformRole;
  hotelId: string | null;
  supplierId: string | null;
}): Promise<string> {
  const allowed = await hasPermission(
    { userId: user.id, tenantId: user.tenantId, platformRole: user.platformRole },
    "order:read",
  );
  if (!allowed) {
    return (
      "Your account cannot read orders on WhatsApp.\n" +
      "Ask a workspace admin for order:read, or check status in the HotelsVendors workspace."
    );
  }

  const where = user.supplierId
    ? { tenantId: user.tenantId, supplierId: user.supplierId, deletedAt: null }
    : { tenantId: user.tenantId, requesterId: user.id, deletedAt: null };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { orderNumber: true, status: true },
  });

  if (orders.length === 0) {
    return (
      "No recent orders found for this account.\n" +
      "Credit-line approval and purchase orders are managed in the HotelsVendors workspace."
    );
  }

  const lines = orders.map((o) => `• ${o.orderNumber}: ${o.status}`);
  return (
    "Recent order status (number + state only):\n" +
    lines.join("\n") +
    "\n\nCounterparty identity and commercial terms stay sealed until authorized stages."
  );
}

async function optOutWhatsApp(userId: string, tenantId: string): Promise<void> {
  for (const type of NOTIFICATION_TYPES) {
    const existing = await prisma.notificationPreference.findFirst({
      where: { userId, channel: "WHATSAPP", type },
      select: { id: true },
    });
    if (existing) {
      await prisma.notificationPreference.update({
        where: { id: existing.id },
        data: { enabled: false },
      });
      continue;
    }
    await prisma.notificationPreference.create({
      data: {
        id: createHash("sha256").update(`wa-optout:${userId}:${type}`).digest("hex").slice(0, 24),
        tenantId,
        userId,
        channel: "WHATSAPP",
        type: type as NotificationType,
        enabled: false,
      },
    });
  }
}

async function auditInbound(opts: {
  tenantId: string;
  userId: string;
  messageId: string;
  command: string;
  replied: boolean;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: opts.tenantId,
        entityId: opts.userId,
        entityName: "USER",
        actorId: opts.userId,
        actorRole: "WHATSAPP_CHANNEL",
        actionType: "UPDATE",
        changes: {
          channel: "WHATSAPP",
          messageId: opts.messageId,
          command: opts.command,
          replied: opts.replied,
          // Message body intentionally omitted — audit-safe.
        },
      },
    });
  } catch (error) {
    console.error("[WhatsApp] inbound audit failed", error);
  }
}

/**
 * Route one inbound WhatsApp text message. Always best-effort reply; never throws to the webhook.
 */
export async function handleInboundWhatsAppMessage(
  msg: InboundWhatsAppMessage,
): Promise<InboundHandleResult> {
  const command = parseCommand(msg.text);
  const user = await findUserByWhatsAppPhone(msg.from);

  if (!user) {
    const phoneHash = createHash("sha256")
      .update(normalizeWhatsAppDigits(msg.from))
      .digest("hex")
      .slice(0, 12);
    console.info("[WhatsApp] inbound from unlinked phone", { phoneHash, command });
    const replied = await sendWhatsApp({
      to: msg.from,
      body:
        "This WhatsApp number is not linked to a HotelsVendors account yet.\n" +
        "Sign in on the web or HOVIN app, verify your phone, then reply HELP.",
    });
    return { handled: true, linked: false, command, replied, reason: "unlinked" };
  }

  let reply: string;
  switch (command) {
    case "HELP":
    case "START":
    case "UNKNOWN":
      reply = HELP_TEXT;
      break;
    case "STATUS":
      reply = await statusReplyForUser(user);
      break;
    case "STOP":
      await optOutWhatsApp(user.id, user.tenantId);
      reply =
        "WhatsApp order updates are paused for this account.\n" +
        "You can re-enable them in workspace notification preferences.";
      break;
    default:
      reply = HELP_TEXT;
  }

  const replied = await sendWhatsApp({ to: msg.from, body: reply });
  await auditInbound({
    tenantId: user.tenantId,
    userId: user.id,
    messageId: msg.messageId || randomUUID(),
    command,
    replied,
  });

  return { handled: true, linked: true, command, replied };
}

/** Extract inbound text messages from a Meta Cloud API webhook payload. */
export function extractMetaInboundMessages(payload: unknown): InboundWhatsAppMessage[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as { object?: unknown; entry?: unknown };
  if (root.object !== "whatsapp_business_account" || !Array.isArray(root.entry)) return [];

  const out: InboundWhatsAppMessage[] = [];
  for (const entry of root.entry) {
    if (!entry || typeof entry !== "object") continue;
    const changes = (entry as { changes?: unknown }).changes;
    if (!Array.isArray(changes)) continue;
    for (const change of changes) {
      if (!change || typeof change !== "object") continue;
      const value = (change as { value?: unknown }).value;
      if (!value || typeof value !== "object") continue;
      const messages = (value as { messages?: unknown }).messages;
      if (!Array.isArray(messages)) continue;
      for (const message of messages) {
        if (!message || typeof message !== "object") continue;
        const m = message as {
          id?: unknown;
          from?: unknown;
          type?: unknown;
          text?: { body?: unknown };
        };
        if (m.type !== "text") continue;
        if (typeof m.from !== "string" || !m.from) continue;
        const body = typeof m.text?.body === "string" ? m.text.body : "";
        if (!body.trim()) continue;
        out.push({
          messageId: typeof m.id === "string" && m.id ? m.id : randomUUID(),
          from: m.from,
          text: body,
        });
      }
    }
  }
  return out;
}
