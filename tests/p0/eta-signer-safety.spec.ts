import { describe, expect, it } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import { parseCertificate, signInvoice } from "@/lib/eta/signer";

describe("ETA signer safety", () => {
  it("refuses to fabricate a signature when no approved signing key is available", async () => {
    await expect(signInvoice(Buffer.from("<Invoice/>"))).rejects.toThrow("ETA_HARDWARE_SIGNING_NOT_CONFIGURED");
  });

  it("creates a real signature only when an explicit test adapter supplies a key", async () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const result = await signInvoice(Buffer.from("<Invoice id=\"test\"/>"), undefined, Buffer.from(privateKey.export({ type: "pkcs1", format: "pem" }) as string));
    expect(result).toMatchObject({ algorithm: "RSA-SHA256", isPlaceholder: false });
    expect(result.signature).not.toContain("PLACEHOLDER");
  });

  it("does not pretend to parse an eSeal certificate without its approved provider bridge", () => {
    expect(() => parseCertificate(Buffer.from("not-a-certificate"))).toThrow("ETA_HARDWARE_SIGNING_NOT_CONFIGURED");
  });
});
