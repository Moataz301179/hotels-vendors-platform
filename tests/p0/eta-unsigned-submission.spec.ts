import { afterEach, describe, expect, it, vi } from "vitest";

const original = {
  api: process.env.ETA_API_URL,
  identity: process.env.ETA_IDENTITY_URL,
  clientId: process.env.ETA_CLIENT_ID,
  clientSecret: process.env.ETA_CLIENT_SECRET,
  environment: process.env.ETA_ENVIRONMENT,
  enabled: process.env.ETA_SUBMISSION_ENABLED,
};

afterEach(() => {
  for (const [key, value] of Object.entries({
    ETA_API_URL: original.api,
    ETA_IDENTITY_URL: original.identity,
    ETA_CLIENT_ID: original.clientId,
    ETA_CLIENT_SECRET: original.clientSecret,
    ETA_ENVIRONMENT: original.environment,
    ETA_SUBMISSION_ENABLED: original.enabled,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("ETA submission signing gate", () => {
  it("rejects a constructed but unsigned invoice before acquiring an ETA token", async () => {
    process.env.ETA_API_URL = "https://api.eta.example.test";
    process.env.ETA_IDENTITY_URL = "https://identity.eta.example.test";
    process.env.ETA_CLIENT_ID = "client";
    process.env.ETA_CLIENT_SECRET = "secret";
    process.env.ETA_ENVIRONMENT = "preprod";
    process.env.ETA_SUBMISSION_ENABLED = "true";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { submitInvoice } = await import("@/lib/eta/client");
    await expect(submitInvoice({ internalId: "HV-UNSIGNED-0001" } as never))
      .rejects.toThrow("ETA_HARDWARE_SIGNING_NOT_CONFIGURED");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not let the legacy adapter bypass the unsigned-submission gate", async () => {
    process.env.ETA_SUBMISSION_ENABLED = "true";
    process.env.ETA_API_URL = "https://api.eta.example.test";
    process.env.ETA_IDENTITY_URL = "https://identity.eta.example.test";
    process.env.ETA_CLIENT_ID = "client";
    process.env.ETA_CLIENT_SECRET = "secret";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { ETAAdapter } = await import("@/lib/eta/adapter");
    await expect(new ETAAdapter().submitInvoice({ uuid: "HV-UNSIGNED-0002" } as never))
      .resolves.toMatchObject({ status: "FAILED", message: "ETA_HARDWARE_SIGNING_NOT_CONFIGURED" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
