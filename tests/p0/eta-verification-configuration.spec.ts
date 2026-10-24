import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const originalApiUrl = process.env.ETA_API_URL;
const originalApiKey = process.env.ETA_API_KEY;

afterEach(() => {
  if (originalApiUrl === undefined) delete process.env.ETA_API_URL;
  else process.env.ETA_API_URL = originalApiUrl;
  if (originalApiKey === undefined) delete process.env.ETA_API_KEY;
  else process.env.ETA_API_KEY = originalApiKey;
});

describe("ETA onboarding verification configuration", () => {
  it("fails closed when no ETA endpoint is configured", async () => {
    delete process.env.ETA_API_URL;
    process.env.ETA_API_KEY = "test-key";
    const { etaVerificationConfigurationError } = await import("@/lib/workers/eta-verification.worker");
    expect(etaVerificationConfigurationError()).toBe("ETA_API_URL is not configured");
  });

  it("fails closed when no ETA credential is configured", async () => {
    process.env.ETA_API_URL = "https://eta.example.test";
    delete process.env.ETA_API_KEY;
    const { etaVerificationConfigurationError } = await import("@/lib/workers/eta-verification.worker");
    expect(etaVerificationConfigurationError()).toBe("ETA_API_KEY is not configured");
  });

  it("does not report configuration success until both values are present", async () => {
    process.env.ETA_API_URL = "https://eta.example.test";
    process.env.ETA_API_KEY = "test-key";
    const { etaVerificationConfigurationError } = await import("@/lib/workers/eta-verification.worker");
    expect(etaVerificationConfigurationError()).toBeNull();
  });
});
