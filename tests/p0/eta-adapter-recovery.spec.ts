import { afterEach, describe, expect, it, vi } from "vitest";

// ── ETA adapter recovery tests ──────────────────────────────────────────────
// These tests assert the fail-closed boundaries of the ETA integration path.
// They never simulate an external ETA approval or financing — every external
// call is mocked and the assertion is that the boundary holds.

const { ETAAdapter } = await import("@/lib/eta/adapter");
const etaClient = await import("@/lib/eta/client");
const { checkFraCompliance } = await import("@/lib/compliance/fra-license");
const { rejectNativeFunding } = await import("@/lib/fintech/external-only");
const { processFactoringRequest } = await import("@/lib/workers/fra-factoring.worker");

const original = {
  api: process.env.ETA_API_URL,
  identity: process.env.ETA_IDENTITY_URL,
  clientId: process.env.ETA_CLIENT_ID,
  clientSecret: process.env.ETA_CLIENT_SECRET,
  enabled: process.env.ETA_SUBMISSION_ENABLED,
};

afterEach(() => {
  for (const [key, value] of Object.entries({
    ETA_API_URL: original.api,
    ETA_IDENTITY_URL: original.identity,
    ETA_CLIENT_ID: original.clientId,
    ETA_CLIENT_SECRET: original.clientSecret,
    ETA_SUBMISSION_ENABLED: original.enabled,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

const samplePayload = {
  uuid: "uuid", serialNumber: "s", documentTypeCode: "t", documentTypeVersion: "v",
  issuerName: "i", issuerTaxId: "it", receiverName: "r", receiverTaxId: "rt",
  issueDate: "2026-01-01", totalAmount: 100, vatAmount: 10, items: [],
  digitalSignatureUuid: "d", signedAt: "2026-01-01",
} as never;

describe("ETA adapter — submission gate", () => {
  it("refuses to submit when ETA_SUBMISSION_ENABLED is not set", async () => {
    const adapter = new ETAAdapter();
    const result = await adapter.submitInvoice(samplePayload);
    expect(result.status).toBe("FAILED");
    expect(result.errors).toContain("ETA_SUBMISSION_DISABLED");
  });

  it("refuses to submit when ETA_SUBMISSION_ENABLED is false", async () => {
    process.env.ETA_SUBMISSION_ENABLED = "false";
    const adapter = new ETAAdapter();
    const result = await adapter.submitInvoice(samplePayload);
    expect(result.status).toBe("FAILED");
  });

  it("throws when credentials are not configured before any network call", async () => {
    process.env.ETA_SUBMISSION_ENABLED = "true";
    const adapter = new ETAAdapter();
    await expect(adapter.getToken()).rejects.toThrow(/ETA credentials are not configured/);
  });
});

describe("ETA client — submission gate", () => {
  it("throws ETA_SUBMISSION_DISABLED when submission is not explicitly enabled", async () => {
    await expect(etaClient.submitInvoice({} as never)).rejects.toThrow("ETA_SUBMISSION_DISABLED");
  });

  it("throws when the signing bridge is unconfigured", async () => {
    process.env.ETA_SUBMISSION_ENABLED = "true";
    await expect(etaClient.submitInvoice({} as never)).rejects.toThrow(/ETA_HARDWARE_SIGNING_NOT_CONFIGURED/);
  });
});

describe("ETA callback — tenant integrity", () => {
  it("processCallback rejects an invoice whose tenant is not ACTIVE", async () => {
    const { prisma } = await import("@/lib/prisma");
    const findUnique = vi.fn().mockResolvedValue({
      id: "inv-1",
      etaUuid: "uuid-1",
      tenantId: "tenant-1",
      tenant: { id: "tenant-1", status: "SUSPENDED" },
    });
    vi.spyOn(prisma.invoice, "findUnique").mockImplementation(findUnique as never);
    await expect(etaClient.processCallback({ uuid: "uuid-1", status: "Valid" })).rejects.toThrow(/inactive\/missing tenant/);
  });
});

describe("FRA adapter — licensing boundary", () => {
  it("permits factoring referral only", async () => {
    const result = await checkFraCompliance("FACTORING_REFERRAL", "tenant-1", "user-1");
    expect(result.allowed).toBe(true);
  });

  it("blocks direct factoring", async () => {
    const result = await checkFraCompliance("FACTORIZATION", "tenant-1", "user-1");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Digital Marketing license only");
  });

  it("blocks payment processing", async () => {
    const result = await checkFraCompliance("PAYMENT_PROCESSING", "tenant-1", "user-1");
    expect(result.allowed).toBe(false);
  });

  it("blocks lending", async () => {
    const result = await checkFraCompliance("LENDING", "tenant-1", "user-1");
    expect(result.allowed).toBe(false);
  });

  it("rejects unknown activity types", async () => {
    const result = await checkFraCompliance("UNKNOWN" as never, "tenant-1", "user-1");
    expect(result.allowed).toBe(false);
  });

  it("the factoring worker cannot disburse native credit", async () => {
    expect(rejectNativeFunding).toThrow("EXTERNAL_FUNDER_REQUIRED");
    await expect(processFactoringRequest({} as never)).rejects.toThrow("EXTERNAL_FUNDER_REQUIRED");
  });
});