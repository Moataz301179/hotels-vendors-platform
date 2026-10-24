import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type SignRequest = {
  jobId: string;
  documentBase64: string;
  documentSha256: string;
};

export type SignResponse = {
  signature: string;
  algorithm: string;
  certificateFingerprint: string;
  signedAt: string;
};

const base64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const sha256 = /^[a-f0-9]{64}$/i;
const fingerprint = /^(?:[a-f0-9]{2}:){31}[a-f0-9]{2}$/i;

export function validateSignRequest(value: unknown): SignRequest {
  if (!value || typeof value !== "object") throw new Error("INVALID_SIGN_REQUEST");
  const request = value as Record<string, unknown>;
  const jobId = typeof request.jobId === "string" ? request.jobId : "";
  const documentBase64 = typeof request.documentBase64 === "string" ? request.documentBase64 : "";
  const documentSha256 = typeof request.documentSha256 === "string" ? request.documentSha256 : "";
  if (!/^[A-Za-z0-9_-]{12,128}$/.test(jobId) || !base64.test(documentBase64) || !sha256.test(documentSha256)) {
    throw new Error("INVALID_SIGN_REQUEST");
  }
  const document = Buffer.from(documentBase64, "base64");
  if (!document.length || document.length > 1024 * 1024) throw new Error("INVALID_SIGN_REQUEST");
  const digest = createHash("sha256").update(document).digest("hex");
  if (!timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(documentSha256, "hex"))) throw new Error("DOCUMENT_DIGEST_MISMATCH");
  return { jobId, documentBase64, documentSha256: documentSha256.toLowerCase() };
}

export function requestMac(secret: string, timestamp: string, nonce: string, rawBody: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${nonce}.${rawBody}`, "utf8").digest("hex");
}

export function verifyRequestMac(secret: string, timestamp: string | undefined, nonce: string | undefined, signature: string | undefined, rawBody: string, now = Date.now()): string {
  if (!secret || !timestamp || !nonce || !signature || !/^\d{13}$/.test(timestamp) || !/^[A-Za-z0-9_-]{16,128}$/.test(nonce) || !sha256.test(signature)) {
    throw new Error("UNAUTHORIZED_SIGN_REQUEST");
  }
  if (Math.abs(now - Number(timestamp)) > 60_000) throw new Error("STALE_SIGN_REQUEST");
  const expected = requestMac(secret, timestamp, nonce, rawBody);
  if (!timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"))) throw new Error("UNAUTHORIZED_SIGN_REQUEST");
  return nonce;
}

export function validateSignResponse(value: unknown): SignResponse {
  if (!value || typeof value !== "object") throw new Error("INVALID_SIGNER_RESPONSE");
  const response = value as Record<string, unknown>;
  const signature = typeof response.signature === "string" ? response.signature : "";
  const algorithm = typeof response.algorithm === "string" ? response.algorithm : "";
  const certificateFingerprint = typeof response.certificateFingerprint === "string" ? response.certificateFingerprint : "";
  const signedAt = typeof response.signedAt === "string" ? response.signedAt : "";
  if (!base64.test(signature) || !algorithm || !fingerprint.test(certificateFingerprint) || Number.isNaN(Date.parse(signedAt))) {
    throw new Error("INVALID_SIGNER_RESPONSE");
  }
  return { signature, algorithm, certificateFingerprint: certificateFingerprint.toUpperCase(), signedAt };
}
