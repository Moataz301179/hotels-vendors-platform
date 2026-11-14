import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

const handleInbound = vi.fn();
const checkWebhookReplay = vi.fn();
const markWebhookProcessed = vi.fn();

vi.mock("@/lib/notifications/whatsapp-inbound", async () => {
  const actual = await vi.importActual<typeof import("../../lib/notifications/whatsapp-inbound")>(
    "../../lib/notifications/whatsapp-inbound",
  );
  return {
    ...actual,
    handleInboundWhatsAppMessage: handleInbound,
  };
});
vi.mock("@/lib/security/webhook-idempotency", () => ({
  checkWebhookReplay,
  markWebhookProcessed,
}));

const original = {
  verify: process.env.WHATSAPP_VERIFY_TOKEN,
  secret: process.env.WHATSAPP_APP_SECRET,
};

function sign(body: string, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(body, "utf8").digest("hex")}`;
}

beforeEach(() => {
  process.env.WHATSAPP_VERIFY_TOKEN = "verify-test-token";
  process.env.WHATSAPP_APP_SECRET = "app-secret-test";
  handleInbound.mockReset().mockResolvedValue({
    handled: true,
    linked: true,
    command: "HELP",
    replied: true,
  });
  checkWebhookReplay.mockReset().mockResolvedValue({ isReplay: false });
  markWebhookProcessed.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  if (original.verify === undefined) delete process.env.WHATSAPP_VERIFY_TOKEN;
  else process.env.WHATSAPP_VERIFY_TOKEN = original.verify;
  if (original.secret === undefined) delete process.env.WHATSAPP_APP_SECRET;
  else process.env.WHATSAPP_APP_SECRET = original.secret;
});

describe("WhatsApp Meta webhook", () => {
  it("fails closed on GET when verify token env is missing", async () => {
    delete process.env.WHATSAPP_VERIFY_TOKEN;
    const { GET } = await import("../../app/api/webhooks/whatsapp/route");
    const response = await GET(
      new Request("https://example.test/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=x&hub.challenge=123"),
    );
    expect(response.status).toBe(503);
  });

  it("rejects GET with a wrong verify token", async () => {
    const { GET } = await import("../../app/api/webhooks/whatsapp/route");
    const response = await GET(
      new Request(
        "https://example.test/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=abc",
      ),
    );
    expect(response.status).toBe(403);
  });

  it("returns the hub.challenge on a valid Meta subscription handshake", async () => {
    const { GET } = await import("../../app/api/webhooks/whatsapp/route");
    const response = await GET(
      new Request(
        "https://example.test/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=verify-test-token&hub.challenge=challenge-42",
      ),
    );
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("challenge-42");
  });

  it("fails closed on POST when app secret env is missing", async () => {
    delete process.env.WHATSAPP_APP_SECRET;
    const { POST } = await import("../../app/api/webhooks/whatsapp/route");
    const response = await POST(
      new Request("https://example.test/api/webhooks/whatsapp", {
        method: "POST",
        body: "{}",
      }),
    );
    expect(response.status).toBe(503);
    expect(handleInbound).not.toHaveBeenCalled();
  });

  it("rejects POST with an invalid signature", async () => {
    const { POST } = await import("../../app/api/webhooks/whatsapp/route");
    const body = JSON.stringify({ object: "whatsapp_business_account", entry: [] });
    const response = await POST(
      new Request("https://example.test/api/webhooks/whatsapp", {
        method: "POST",
        headers: { "x-hub-signature-256": "sha256=deadbeef" },
        body,
      }),
    );
    expect(response.status).toBe(401);
    expect(handleInbound).not.toHaveBeenCalled();
  });

  it("routes a signed inbound text message exactly once", async () => {
    const { POST } = await import("../../app/api/webhooks/whatsapp/route");
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    id: "wamid.TEST1",
                    from: "201001234567",
                    type: "text",
                    text: { body: "STATUS" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    const body = JSON.stringify(payload);
    const response = await POST(
      new Request("https://example.test/api/webhooks/whatsapp", {
        method: "POST",
        headers: { "x-hub-signature-256": sign(body, "app-secret-test") },
        body,
      }),
    );
    expect(response.status).toBe(200);
    expect(handleInbound).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: "wamid.TEST1", from: "201001234567", text: "STATUS" }),
    );
    expect(markWebhookProcessed).toHaveBeenCalledWith("whatsapp", "wamid.TEST1", expect.stringContaining("HANDLED"));
  });

  it("acknowledges Meta retries without re-handling", async () => {
    checkWebhookReplay.mockResolvedValue({ isReplay: true, previousResult: "HANDLED:STATUS:linked" });
    const { POST } = await import("../../app/api/webhooks/whatsapp/route");
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    id: "wamid.RETRY",
                    from: "201001234567",
                    type: "text",
                    text: { body: "HELP" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    const body = JSON.stringify(payload);
    const response = await POST(
      new Request("https://example.test/api/webhooks/whatsapp", {
        method: "POST",
        headers: { "x-hub-signature-256": sign(body, "app-secret-test") },
        body,
      }),
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.replayed).toBe(1);
    expect(handleInbound).not.toHaveBeenCalled();
  });

  it("returns 503 and does not mark idempotency when inbound processing fails", async () => {
    handleInbound.mockRejectedValue(new Error("preference write failed"));
    const { POST } = await import("../../app/api/webhooks/whatsapp/route");
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    id: "wamid.FAIL1",
                    from: "201001234567",
                    type: "text",
                    text: { body: "STOP" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    const body = JSON.stringify(payload);
    const response = await POST(
      new Request("https://example.test/api/webhooks/whatsapp", {
        method: "POST",
        headers: { "x-hub-signature-256": sign(body, "app-secret-test") },
        body,
      }),
    );
    expect(response.status).toBe(503);
    const json = await response.json();
    expect(json).toMatchObject({ failed: 1, retryable: true, processed: 0 });
    expect(markWebhookProcessed).not.toHaveBeenCalled();
  });
});
