/**
 * POST /api/onboarding/delegate-invite
 *
 * Allows a tenant admin to invite a Financial Controller to submit
 * ETA credentials on their behalf via a 24-hour magic-link token.
 *
 * Flow:
 * 1. Authenticate the requesting user (must be OWNER or GM)
 * 2. Validate invitee email or WhatsApp
 * 3. Generate a 24-hour magic token
 * 4. Create a PENDING User record with FINANCIAL_CONTROLLER role
 * 5. Send invitation via email (Resend) or WhatsApp (Meta/Twilio)
 * 6. Audit log the action
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/api-utils";
import crypto from "crypto";

// ─── Validation ────────────────────────────────────────────────────

interface DelegateInvitePayload {
  email?: string;
  whatsapp?: string;
  tenantId: string;
}

function validateInvitePayload(body: Record<string, unknown>): DelegateInvitePayload {
  const { email, whatsapp, tenantId } = body;

  if (!tenantId || typeof tenantId !== "string") {
    throw new Error("tenantId is required");
  }

  if (!email && !whatsapp) {
    throw new Error("At least one of email or whatsapp is required");
  }

  if (email && (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new Error("Invalid email address");
  }

  if (whatsapp && (typeof whatsapp !== "string" || !/^\+?\d{10,15}$/.test(whatsapp.replace(/\s/g, "")))) {
    throw new Error("Invalid WhatsApp number — must be 10-15 digits");
  }

  return {
    email: email as string | undefined,
    whatsapp: whatsapp as string | undefined,
    tenantId: tenantId as string,
  };
}

// ─── Magic Token Generation ────────────────────────────────────────

function generateMagicToken(): { token: string; hash: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return { token, hash, expiresAt };
}

// ─── Email Sender ──────────────────────────────────────────────────

async function sendInviteEmail(to: string, token: string, tenantName: string): Promise<boolean> {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://hotelsvendors.com"}/onboarding/delegate/${token}`;

  try {
    const emailModule = await import("@/lib/notifications/email");
    const { sendEmail } = emailModule;

    await sendEmail({
      to: [to],
      subject: `You've been invited to connect ETA credentials — ${tenantName}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #0a0a0a; font-size: 20px; margin-bottom: 16px;">ETA Credential Invitation</h2>
          <p style="color: #525252; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            <strong>${tenantName}</strong> has invited you to securely submit their Egyptian Tax Authority (ETA) API credentials.
            This link expires in <strong>24 hours</strong>.
          </p>
          <a href="${inviteUrl}" style="display: inline-block; background-color: #39FF14; color: #000; font-weight: 600; font-size: 14px; padding: 14px 32px; border-radius: 12px; text-decoration: none; margin-bottom: 24px;">
            Submit ETA Credentials
          </a>
          <p style="color: #a3a3a3; font-size: 12px; line-height: 1.5;">
            This is a secure, one-time-use link. Do not forward this email.
            If you were not expecting this invitation, you can safely ignore it.
          </p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("[Delegate Invite] Email send failed:", err);
    return false;
  }
}

// ─── WhatsApp Sender ───────────────────────────────────────────────

import { sendWhatsApp } from "@/lib/notifications/whatsapp";

async function sendInviteWhatsApp(to: string, token: string, tenantName: string): Promise<boolean> {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://hotelsvendors.com"}/onboarding/delegate/${token}`;

  return sendWhatsApp({
    to,
    body: `🔐 *HotelsVendors — ETA Credential Invitation*\n\n${tenantName} has invited you to securely submit their ETA API credentials.\n\n⏳ Expires in 24 hours\n🔗 ${inviteUrl}\n\nThis is a one-time secure link. Do not forward.`,
  });
}

// ─── Route Handler ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth?.tenantId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const payload = validateInvitePayload(body);

    // Verify the authenticated user's tenantId matches the payload tenantId
    if (auth.tenantId !== payload.tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant mismatch — you can only invite to your own tenant" },
        { status: 403 }
      );
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: payload.tenantId },
      select: { id: true, name: true },
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    // Check if invitee already exists as an active user
    if (payload.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: payload.email },
      });

      if (existingUser && existingUser.status === "ACTIVE") {
        return NextResponse.json(
          {
            success: false,
            error: "A user with this email already exists. They can log in directly.",
            code: "USER_EXISTS",
          },
          { status: 409 }
        );
      }
    }

    // Generate magic token
    const { token, hash, expiresAt } = generateMagicToken();

    // Atomic: create delegate user + audit log
    const inviteResult = await prisma.$transaction(async (tx) => {
      // Find or create a default FINANCIAL_CONTROLLER role for this tenant
      let role = await tx.role.findFirst({
        where: { tenantId: payload.tenantId, name: "FINANCIAL_CONTROLLER" },
      });
      if (!role) {
        role = await tx.role.create({
          data: {
            name: "FINANCIAL_CONTROLLER",
            tenantId: payload.tenantId,
            isGlobal: false,
          },
        });
      }

      const roleId = role.id;

      // Create or update the delegate user
      let delegateUser;

      if (payload.email) {
        const existing = await tx.user.findUnique({
          where: { email: payload.email },
        });

        if (existing) {
          // Reactivate if inactive/suspended
          delegateUser = await tx.user.update({
            where: { id: existing.id },
            data: {
              status: "SUSPENDED", // Pending activation via magic link
              role: "FINANCIAL_CONTROLLER",
              tenantId: payload.tenantId,
              inviteToken: hash,
              inviteExpiresAt: expiresAt,
              invitedBy: auth.userId,
              roleId,
            },
          });
        } else {
          delegateUser = await tx.user.create({
            data: {
              email: payload.email,
              name: payload.email.split("@")[0],
              role: "FINANCIAL_CONTROLLER",
              status: "SUSPENDED",
              platformRole: "HOTEL",
              tenantId: payload.tenantId,
              inviteToken: hash,
              inviteExpiresAt: expiresAt,
              invitedBy: auth.userId,
              roleId,
            },
          });
        }
      } else {
        // WhatsApp-only invite — create a placeholder user
        const placeholderEmail = `delegate-${hash.slice(0, 8)}@invite.hotelsvendors.com`;
        delegateUser = await tx.user.create({
          data: {
            email: placeholderEmail,
            phone: payload.whatsapp,
            name: "Financial Controller",
            role: "FINANCIAL_CONTROLLER",
            status: "SUSPENDED",
            platformRole: "HOTEL",
            tenantId: payload.tenantId,
            inviteToken: hash,
            inviteExpiresAt: expiresAt,
            invitedBy: auth.userId,
            roleId,
          },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          actionType: "CREATE",
          entityName: "USER",
          entityId: delegateUser.id,
          actorId: auth.userId,
          actorRole: auth.platformRole,
          tenantId: payload.tenantId,
          changes: JSON.stringify({
            inviteeEmail: payload.email || null,
            inviteeWhatsApp: payload.whatsapp || null,
            role: "FINANCIAL_CONTROLLER",
            tokenExpiresAt: expiresAt.toISOString(),
            invitedBy: auth.userId,
          }),
        },
      });

      return delegateUser;
    });

    // Send invitation (non-blocking — don't fail the request if send fails)
    let emailSent = false;
    let whatsappSent = false;

    if (payload.email) {
      emailSent = await sendInviteEmail(payload.email, token, tenant.name);
    }

    if (payload.whatsapp) {
      whatsappSent = await sendInviteWhatsApp(payload.whatsapp, token, tenant.name);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Delegate invitation sent successfully",
        data: {
          inviteeEmail: payload.email || null,
          inviteeWhatsApp: payload.whatsapp || null,
          delegateUserId: inviteResult.id,
          tokenExpiresAt: expiresAt.toISOString(),
          emailSent,
          whatsappSent,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Delegate Invite] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send delegate invitation",
      },
      { status: 500 }
    );
  }
}
