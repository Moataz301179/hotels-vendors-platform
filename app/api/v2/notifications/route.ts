import { NextResponse } from "next/server";
import { z } from "zod";
import { getActor } from "@/lib/v2-auth";
import { requirePermission } from "@/lib/auth/rbac";
import { PermissionDeniedError } from "@/lib/auth/rbac";
import { listNotifications, markNotificationRead, unreadCount } from "@/lib/notifications/service";
import { isWhatsAppConfigured } from "@/lib/notifications/whatsapp";

export async function GET() {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    await requirePermission(
      { userId: actor.id, tenantId: actor.tenantId, platformRole: actor.platformRole },
      "order:read",
    );
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
    throw error;
  }

  const [notifications, unread] = await Promise.all([
    listNotifications(actor.tenantId, actor.id),
    unreadCount(actor.tenantId, actor.id),
  ]);

  return NextResponse.json({
    notifications,
    unread,
    // Honest channel readiness — WhatsApp flips on when Meta/Twilio env is present.
    channels: { inApp: true, email: true, sms: false, whatsapp: isWhatsAppConfigured() },
  });
}

const markSchema = z.object({ notificationId: z.string().min(1) });

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const parsed = markSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Provide a notificationId." }, { status: 400 });

  const ok = await markNotificationRead(actor.tenantId, actor.id, parsed.data.notificationId);
  if (!ok) {
    // 404 rather than 403 — the notification exists but is not the caller's.
    return NextResponse.json({ error: "Notification not found for this account." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
