import { afterEach, describe, expect, it, vi } from "vitest";

const original = {
  api: process.env.ETA_API_URL,
  identity: process.env.ETA_IDENTITY_URL,
  clientId: process.env.ETA_CLIENT_ID,
  clientSecret: process.env.ETA_CLIENT_SECRET,
};

afterEach(() => {
  for (const [key, value] of Object.entries({
    ETA_API_URL: original.api,
    ETA_IDENTITY_URL: original.identity,
    ETA_CLIENT_ID: original.clientId,
    ETA_CLIENT_SECRET: original.clientSecret,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  vi.unstubAllGlobals();
});

describe("ETA adapter configuration", () => {
  it("rejects missing identity configuration before a network call", async () => {
    process.env.ETA_API_URL = "https://api.eta.example.test";
    delete process.env.ETA_IDENTITY_URL;
    process.env.ETA_CLIENT_ID = "client";
    process.env.ETA_CLIENT_SECRET = "secret";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { ETAAdapter } = await import("@/lib/eta/adapter");
    await expect(new ETAAdapter().getToken()).rejects.toThrow("ETA credentials are not configured");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("uses the ETA identity host for an OAuth client-credentials token", async () => {
    process.env.ETA_API_URL = "https://api.eta.example.test";
    process.env.ETA_IDENTITY_URL = "https://identity.eta.example.test";
    process.env.ETA_CLIENT_ID = "client";
    process.env.ETA_CLIENT_SECRET = "secret";
    const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ access_token: "token" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const { ETAAdapter } = await import("@/lib/eta/adapter");
    await expect(new ETAAdapter().getToken()).resolves.toBe("token");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://identity.eta.example.test/connect/token",
      expect.objectContaining({ method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" } }),
    );
  });
});
