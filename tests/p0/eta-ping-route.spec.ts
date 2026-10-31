import { afterEach, beforeEach, describe, expect, it } from "vitest";

const originalKey = process.env.ETA_CALLBACK_API_KEY;
const originalRin = process.env.ETA_REGISTRATION_NUMBER;

beforeEach(() => {
  process.env.ETA_CALLBACK_API_KEY = "callback-test-key";
  process.env.ETA_REGISTRATION_NUMBER = "123456789";
});

afterEach(() => {
  if (originalKey === undefined) delete process.env.ETA_CALLBACK_API_KEY;
  else process.env.ETA_CALLBACK_API_KEY = originalKey;
  if (originalRin === undefined) delete process.env.ETA_REGISTRATION_NUMBER;
  else process.env.ETA_REGISTRATION_NUMBER = originalRin;
});

describe("ETA registration ping", () => {
  it("fails closed without the configured callback credentials", async () => {
    delete process.env.ETA_CALLBACK_API_KEY;
    const { PUT } = await import("@/app/ping/route");
    const response = await PUT(new Request("https://example.test/ping", { method: "PUT" }));
    expect(response.status).toBe(503);
  });

  it("requires ETA ApiKey authentication and the registered RIN", async () => {
    const { PUT } = await import("@/app/ping/route");
    const unauthorized = await PUT(new Request("https://example.test/ping", {
      method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ rin: "123456789" }),
    }));
    expect(unauthorized.status).toBe(401);
    const mismatch = await PUT(new Request("https://example.test/ping", {
      method: "PUT", headers: { authorization: "ApiKey callback-test-key", "content-type": "application/json" }, body: JSON.stringify({ rin: "wrong" }),
    }));
    expect(mismatch.status).toBe(400);
  });

  it("returns the verified RIN to an authenticated ETA probe", async () => {
    const { PUT } = await import("@/app/ping/route");
    const response = await PUT(new Request("https://example.test/ping", {
      method: "PUT", headers: { authorization: "ApiKey callback-test-key", "content-type": "application/json" }, body: JSON.stringify({ rin: "123456789" }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ rin: "123456789" });
  });
});
