import { afterEach, describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import {
  isWhatsAppConfigured,
  normalizeWhatsAppDigits,
  verifyMetaSignature,
  verifyMetaWebhookChallenge,
} from "../../lib/notifications/whatsapp";

const original = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in original)) delete process.env[key];
  }
  Object.assign(process.env, original);
});

describe("WhatsApp gateway helpers", () => {
  it("normalizes phone digits for Meta/Twilio payloads", () => {
    expect(normalizeWhatsAppDigits("+20 100 123 4567")).toBe("201001234567");
  });

  it("reports configured only when Meta or Twilio credentials are present", () => {
    delete process.env.WHATSAPP_BEARER_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_WHATSAPP_FROM;
    expect(isWhatsAppConfigured()).toBe(false);

    process.env.WHATSAPP_BEARER_TOKEN = "token";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123";
    expect(isWhatsAppConfigured()).toBe(true);
  });

  it("verifies Meta hub challenges with timing-safe token compare", () => {
    process.env.WHATSAPP_VERIFY_TOKEN = "expected-token";
    expect(
      verifyMetaWebhookChallenge({
        mode: "subscribe",
        token: "expected-token",
        challenge: "99",
      }),
    ).toBe("99");
    expect(
      verifyMetaWebhookChallenge({
        mode: "subscribe",
        token: "wrong",
        challenge: "99",
      }),
    ).toBeNull();
  });

  it("verifies X-Hub-Signature-256 and fails closed without a secret", () => {
    const body = '{"ok":true}';
    delete process.env.WHATSAPP_APP_SECRET;
    expect(verifyMetaSignature(body, "sha256=abc")).toBe(false);

    process.env.WHATSAPP_APP_SECRET = "secret";
    const good = `sha256=${createHmac("sha256", "secret").update(body, "utf8").digest("hex")}`;
    expect(verifyMetaSignature(body, good)).toBe(true);
    expect(verifyMetaSignature(body, "sha256=00")).toBe(false);
  });
});
