import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const processCallback = vi.fn();
const checkWebhookReplay = vi.fn();
const markWebhookProcessed = vi.fn();

vi.mock("@/lib/eta/client", () => ({ processCallback }));
vi.mock("@/lib/security/webhook-idempotency", () => ({ checkWebhookReplay, markWebhookProcessed }));

const originalCallbackKey = process.env.ETA_CALLBACK_API_KEY;

beforeEach(() => {
  process.env.ETA_CALLBACK_API_KEY = "callback-test-key";
  processCallback.mockReset();
  checkWebhookReplay.mockReset().mockResolvedValue({ isReplay: false });
  markWebhookProcessed.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  if (originalCallbackKey === undefined) delete process.env.ETA_CALLBACK_API_KEY;
  else process.env.ETA_CALLBACK_API_KEY = originalCallbackKey;
});

const body = {
  deliveryId: "delivery-1",
  type: "document",
  count: 1,
  message: [{ type: "document-validated", uuid: "eta-uuid-1", status: "Valid" }],
};

describe("ETA document notification callback", () => {
  it("fails closed until the callback key is configured", async () => {
    delete process.env.ETA_CALLBACK_API_KEY;
    const { PUT } = await import("@/app/notifications/documents/route");
    const response = await PUT(new Request("https://example.test/notifications/documents", { method: "PUT" }));
    expect(response.status).toBe(503);
  });

  it("rejects an invalid ETA callback credential", async () => {
    const { PUT } = await import("@/app/notifications/documents/route");
    const response = await PUT(new Request("https://example.test/notifications/documents", {
      method: "PUT", headers: { authorization: "ApiKey wrong", "content-type": "application/json" }, body: JSON.stringify(body),
    }));
    expect(response.status).toBe(401);
    expect(processCallback).not.toHaveBeenCalled();
  });

  it("processes an authenticated batch exactly once per ETA delivery", async () => {
    const { PUT } = await import("@/app/notifications/documents/route");
    const response = await PUT(new Request("https://example.test/notifications/documents", {
      method: "PUT", headers: { authorization: "ApiKey callback-test-key", "content-type": "application/json" }, body: JSON.stringify(body),
    }));
    expect(response.status).toBe(200);
    expect(processCallback).toHaveBeenCalledWith(expect.objectContaining({ uuid: "eta-uuid-1", status: "Valid", deliveryId: "delivery-1" }));
    expect(markWebhookProcessed).toHaveBeenCalledWith("eta", "delivery-1", "PROCESSED:1");
  });

  it("acknowledges an ETA retry without processing it twice", async () => {
    checkWebhookReplay.mockResolvedValue({ isReplay: true, previousResult: "PROCESSED:1" });
    const { PUT } = await import("@/app/notifications/documents/route");
    const response = await PUT(new Request("https://example.test/notifications/documents", {
      method: "PUT", headers: { authorization: "ApiKey callback-test-key", "content-type": "application/json" }, body: JSON.stringify(body),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, replay: true });
    expect(processCallback).not.toHaveBeenCalled();
  });
});
