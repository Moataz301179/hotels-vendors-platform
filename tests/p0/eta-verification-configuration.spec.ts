import { describe, expect, it } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

describe("ETA onboarding verification configuration", () => {
  it("does not claim taxpayer onboarding verification from the e-Invoicing API", async () => {
    const { etaVerificationConfigurationError } = await import("@/lib/workers/eta-verification.worker");
    expect(etaVerificationConfigurationError()).toContain("not an onboarding/KYC verification API");
  });
});
