import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { requestMac, validateSignRequest, validateSignResponse, verifyRequestMac } from "@/lib/eta/signer-gateway-contract";

const document = Buffer.from("signed-document-input");
const documentBase64 = document.toString("base64");
const documentSha256 = createHash("sha256").update(document).digest("hex");

describe("ETA local signer gateway contract", () => {
  it("accepts a bounded document only when its digest is exact", () => {
    expect(validateSignRequest({ jobId: "eta_job_123456", documentBase64, documentSha256 })).toMatchObject({ documentSha256 });
    expect(() => validateSignRequest({ jobId: "eta_job_123456", documentBase64, documentSha256: "0".repeat(64) })).toThrow("DOCUMENT_DIGEST_MISMATCH");
  });

  it("requires a fresh signed request envelope", () => {
    const secret = "gateway-secret-for-test";
    const timestamp = String(Date.now());
    const nonce = "nonce-for-eta-signing-0001";
    const raw = JSON.stringify({ jobId: "eta_job_123456", documentBase64, documentSha256 });
    const signature = requestMac(secret, timestamp, nonce, raw);
    expect(verifyRequestMac(secret, timestamp, nonce, signature, raw)).toBe(nonce);
    expect(() => verifyRequestMac(secret, String(Date.now() - 61_000), nonce, signature, raw)).toThrow("STALE_SIGN_REQUEST");
  });

  it("refuses a provider result without a real signature or leaf fingerprint", () => {
    expect(() => validateSignResponse({ algorithm: "RSASSA-PKCS1-v1_5", signedAt: new Date().toISOString() })).toThrow("INVALID_SIGNER_RESPONSE");
  });
});
