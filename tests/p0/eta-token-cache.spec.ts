import { afterEach, describe, expect, it, vi } from "vitest";

const original = {
  api: process.env.ETA_API_URL,
  identity: process.env.ETA_IDENTITY_URL,
  clientId: process.env.ETA_CLIENT_ID,
  clientSecret: process.env.ETA_CLIENT_SECRET,
  environment: process.env.ETA_ENVIRONMENT,
};

afterEach(() => {
  for (const [key, value] of Object.entries({
    ETA_API_URL: original.api,
    ETA_IDENTITY_URL: original.identity,
    ETA_CLIENT_ID: original.clientId,
    ETA_CLIENT_SECRET: original.clientSecret,
    ETA_ENVIRONMENT: original.environment,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("ETA access-token cache", () => {
  it("shares one token request across concurrent authenticated reads", async () => {
    process.env.ETA_API_URL = "https://api.eta.example.test";
    process.env.ETA_IDENTITY_URL = "https://identity.eta.example.test";
    process.env.ETA_CLIENT_ID = "client";
    process.env.ETA_CLIENT_SECRET = "secret";
    process.env.ETA_ENVIRONMENT = "preprod";

    const fetchSpy = vi.fn(async (input: string | URL | Request) => {
      const url = input.toString();
      if (url === "https://identity.eta.example.test/connect/token") {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return new Response(JSON.stringify({
          access_token: "shared-token",
          expires_in: 3600,
          token_type: "Bearer",
        }), { status: 200 });
      }

      return new Response(JSON.stringify({ status: "Valid" }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchSpy);

    const { getInvoiceStatus } = await import("@/lib/eta/client");
    await Promise.all([
      getInvoiceStatus("document-a"),
      getInvoiceStatus("document-b"),
    ]);

    expect(fetchSpy.mock.calls.filter(([url]) => url.toString() === "https://identity.eta.example.test/connect/token"))
      .toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it("does not retain a rejected token request", async () => {
    process.env.ETA_API_URL = "https://api.eta.example.test";
    process.env.ETA_IDENTITY_URL = "https://identity.eta.example.test";
    process.env.ETA_CLIENT_ID = "client";
    process.env.ETA_CLIENT_SECRET = "secret";
    process.env.ETA_ENVIRONMENT = "preprod";

    let tokenAttempts = 0;
    const fetchSpy = vi.fn(async (input: string | URL | Request) => {
      if (input.toString() === "https://identity.eta.example.test/connect/token") {
        tokenAttempts += 1;
        if (tokenAttempts === 1) {
          return new Response("temporarily unavailable", { status: 503 });
        }
        return new Response(JSON.stringify({
          access_token: "fresh-token",
          expires_in: 3600,
          token_type: "Bearer",
        }), { status: 200 });
      }

      return new Response(JSON.stringify({ status: "Valid" }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchSpy);

    const { getInvoiceStatus } = await import("@/lib/eta/client");
    await expect(getInvoiceStatus("document-retry")).rejects.toThrow("ETA auth failed: 503");
    await expect(getInvoiceStatus("document-retry")).resolves.toBe("Valid");

    expect(tokenAttempts).toBe(2);
  });
});
