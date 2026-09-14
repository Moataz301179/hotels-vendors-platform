/**
 * WhatsApp Notifications — Hotels Vendors
 *
 * Single gateway for outbound WhatsApp messages. Supports:
 *   - Meta Cloud API   (WHATSAPP_PROVIDER=meta,    default)
 *   - Twilio WhatsApp  (WHATSAPP_PROVIDER=twilio)
 *
 * Env vars (see HOSTINGER-DEPLOY.md / .env.example):
 *   WHATSAPP_PROVIDER          = "meta" | "twilio"
 *   WHATSAPP_BEARER_TOKEN      = Meta permanent token
 *   WHATSAPP_PHONE_NUMBER_ID   = Meta phone number ID
 *   TWILIO_ACCOUNT_SID         = Twilio Account SID
 *   TWILIO_AUTH_TOKEN          = Twilio Auth Token
 *   TWILIO_WHATSAPP_FROM       = Twilio WhatsApp sender (e.g. +14155238886)
 *
 * All senders return a boolean so callers can report delivery status without
 * throwing (invite flows treat WhatsApp as best-effort).
 */

export interface WhatsAppMessage {
  /** Recipient number. Accepts +20..., 20..., or spaces/dashes. */
  to: string;
  /** Plain-text message body (Meta text message or Twilio Body). */
  body: string;
}

const META_GRAPH_BASE = "https://graph.facebook.com";
const META_GRAPH_VERSION = "v18.0";

/** Normalize to E.164 digits (no leading +) — e.g. "+20 100 123 4567" -> "201001234567". */
function normalizeDigits(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

function isMetaConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_BEARER_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_FROM
  );
}

async function sendViaMeta(msg: WhatsAppMessage): Promise<boolean> {
  const token = process.env.WHATSAPP_BEARER_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return false;

  const url = `${META_GRAPH_BASE}/${META_GRAPH_VERSION}/${phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: normalizeDigits(msg.to),
      type: "text",
      text: { body: msg.body },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[WhatsApp] Meta send failed:", res.status, errText.slice(0, 500));
    return false;
  }
  return true;
}

async function sendViaTwilio(msg: WhatsAppMessage): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!sid || !token || !from) return false;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      From: `whatsapp:${from}`,
      To: `whatsapp:+${normalizeDigits(msg.to)}`,
      Body: msg.body,
    }).toString(),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[WhatsApp] Twilio send failed:", res.status, errText.slice(0, 500));
    return false;
  }
  return true;
}

/**
 * Send a WhatsApp message using the configured provider.
 *
 * Provider fallback behavior:
 *   - provider=meta:    try Meta first, then Twilio.
 *   - provider=twilio:  try Twilio first, then Meta.
 *
 * Returns true if any provider delivered the message.
 */
export async function sendWhatsApp(msg: WhatsAppMessage): Promise<boolean> {
  const provider = (process.env.WHATSAPP_PROVIDER || "meta").toLowerCase();

  if (provider === "twilio") {
    const ok = await sendViaTwilio(msg);
    if (ok) return true;
    return sendViaMeta(msg);
  }

  // default: meta
  const ok = await sendViaMeta(msg);
  if (ok) return true;
  return sendViaTwilio(msg);
}

/**
 * True when any WhatsApp provider is configured (used to decide whether to
 * surface WhatsApp delivery status to the UI).
 */
export function isWhatsAppConfigured(): boolean {
  return isMetaConfigured() || isTwilioConfigured();
}
