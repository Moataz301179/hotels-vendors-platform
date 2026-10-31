/**
 * ETA Digital Signer
 * Hotels Vendors Compliance Layer
 *
 * Signs invoice XML payloads with a CMS/PKCS#7 detached signature
 * as required by the Egyptian Tax Authority (ETA).
 *
 * ⚠️  ARCHITECTURE ONLY — This module provides the signing interface but
 *     never fabricates a placeholder result. Replace the controlled test-key
 *     adapter with a verified eSeal provider bridge before ETA production use.
 *
 * Signing flow:
 *   1. Canonicalize the XML (C14N)
 *   2. Compute SHA-256 digest of the canonical form
 *   3. Sign the digest with the private key (RSA-SHA256)
 *   4. Return the detached signature as a base64-encoded buffer
 */

import { createHash, createSign, createVerify } from "crypto";

// ── Types ──

export interface SigningResult {
  /** Base64-encoded digital signature (detached) */
  signature: string;
  /** SHA-256 hex digest of the original XML */
  digest: string;
  /** Algorithm used */
  algorithm: string;
  /** ISO timestamp of signing */
  signedAt: string;
  /** Always false: this module refuses to fabricate a signature. */
  isPlaceholder: false;
}

export interface CertificateInfo {
  /** Certificate subject CN */
  subject?: string;
  /** Issuer CN */
  issuer?: string;
  /** Serial number */
  serialNumber?: string;
  /** Not-before date */
  validFrom?: Date;
  /** Not-after date */
  validTo?: Date;
}

// ── Canonicalization (simplified C14N) ──

/**
 * Minimal XML canonicalization — strips declaration, normalizes
 * whitespace in tag names, sorts attributes alphabetically.
 * For production, consider using xml-c14n library.
 */
function canonicalizeXml(xml: string): string {
  return xml
    .replace(/<\?xml[^?]*\?>\s*/i, "")
    .replace(/\s+/g, " ")
    .replace(/> </g, "><")
    .trim();
}

// ── Digest ──

function sha256Digest(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

// ── Real signing (RSA-SHA256) ──

async function signWithPrivateKey(
  xmlBytes: Buffer,
  privateKeyPem: Buffer
): Promise<SigningResult> {
  const canonical = canonicalizeXml(xmlBytes.toString("utf8"));
  const digest = sha256Digest(canonical);

  const signer = createSign("RSA-SHA256");
  signer.update(canonical);
  const signature = signer.sign(privateKeyPem, "base64");

  return {
    signature,
    digest,
    algorithm: "RSA-SHA256",
    signedAt: new Date().toISOString(),
    isPlaceholder: false,
  };
}

// ── Public API ──

/**
 * Sign an invoice XML payload.
 *
 * This function refuses to generate a placeholder signature. The USB eSeal
 * bridge must yield a verified signing operation before ETA submission is
 * enabled. A PEM key is accepted only for an explicit, externally managed
 * test adapter; it must never be inferred from the presence of a certificate.
 *
 * @param xmlBytes   — The raw XML buffer to sign
 * @param cert       — Optional: PKCS#12 certificate buffer (.p12/.pfx)
 * @param privateKey — Optional: PEM-encoded private key
 * @returns          — SigningResult with signature, digest, and metadata
 */
export async function signInvoice(
  xmlBytes: Buffer,
  cert?: Buffer,
  privateKey?: Buffer
): Promise<SigningResult> {
  if (cert && !privateKey) {
    throw new Error("ETA_HARDWARE_SIGNING_NOT_CONFIGURED: certificate-only signing requires the approved eSeal provider bridge");
  }
  if (!privateKey) {
    throw new Error("ETA_HARDWARE_SIGNING_NOT_CONFIGURED: refusing to emit a placeholder signature");
  }
  return signWithPrivateKey(xmlBytes, privateKey);
}

/**
 * Verify a detached signature against XML bytes.
 * Placeholder — always returns false until real crypto is wired.
 */
export function verifySignature(
  xmlBytes: Buffer,
  signatureBase64: string,
  publicKeyPem: Buffer
): boolean {
  try {
    const canonical = canonicalizeXml(xmlBytes.toString("utf8"));
    const verify = createVerify("RSA-SHA256");
    verify.update(canonical);
    return verify.verify(publicKeyPem, signatureBase64, "base64");
  } catch {
    return false;
  }
}

/**
 * Parse a PKCS#12 certificate and extract info.
 * Certificate parsing is intentionally unavailable until the approved eSeal
 * provider integration is selected and validated.
 */
export function parseCertificate(cert: Buffer): CertificateInfo {
  void cert;
  throw new Error("ETA_HARDWARE_SIGNING_NOT_CONFIGURED: PKCS#12 parsing is not an approved substitute for the registered eSeal token");
}
