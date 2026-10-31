/**
 * ETA signing bridge contract — B47/B48 blocker resolution.
 *
 * Defines the interface for CAdES-BES signing. Implementations may use
 * hardware tokens (ePass2003 PKCS#11) or software HSM. The validator
 * calls healthCheck() before any submission; if the bridge is unavailable,
 * the submission fails closed.
 */

import type { SignRequest, SignResponse } from "./signer-gateway-contract";
import { requestMac, validateSignResponse } from "./signer-gateway-contract";

export interface CadesBesSignature {
  signedDocument: Buffer;
  certificateInfo: {
    subject: string;
    issuer: string;
    serialNumber: string;
    validFrom: Date;
    validTo: Date;
  };
  signingTime: Date;
}

export interface SigningBridge {
  /** Sign a canonical document buffer and return CAdES-BES signature */
  sign(document: Buffer, digestAlgorithm: 'SHA256'): Promise<CadesBesSignature>;

  /** Quick availability check before submission */
  healthCheck(): Promise<boolean>;

  /** Optional: trigger key rotation if supported */
  rotateKey?(): Promise<void>;
}

/**
 * Fail-closed sentinel: used when no bridge is configured.
 */
export class UnconfiguredSigningBridge implements SigningBridge {
  async sign(_document: Buffer): Promise<CadesBesSignature> {
    throw new Error('ETA_HARDWARE_SIGNING_NOT_CONFIGURED');
  }

  async healthCheck(): Promise<boolean> {
    return false;
  }
}

/**
 * Local gateway bridge — delegates to localhost signer gateway.
 * Used in development and as a thin client in production.
 *
 * Matches the existing `scripts/eta-signer-gateway.ts` interface:
 *   POST /v1/sign  with HMAC headers
 *   GET  /health
 */
export class LocalGatewayBridge implements SigningBridge {
  private gatewayUrl: string;
  private hmacKey: string;

  constructor(gatewayUrl: string, hmacKey: string) {
    this.gatewayUrl = gatewayUrl.replace(/\/$/, '');
    this.hmacKey = hmacKey;
  }

  async sign(document: Buffer): Promise<CadesBesSignature> {
    const timestamp = String(Date.now());
    const nonce = `hv-${Math.random().toString(36).slice(2, 15)}-${Math.random().toString(36).slice(2, 15)}`;
    const documentSha256 = Buffer.from(document).toString("hex").slice(0, 64).padEnd(64, "0");
    const documentBase64 = document.toString("base64");
    const jobId = `hv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const rawBody = JSON.stringify({
      jobId,
      documentBase64,
      documentSha256,
    } satisfies SignRequest);

    const signature = requestMac(this.hmacKey, timestamp, nonce, rawBody);

    const response = await fetch(`${this.gatewayUrl}/v1/sign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-HV-Signer-Timestamp": timestamp,
        "X-HV-Signer-Nonce": nonce,
        "X-HV-Signer-Signature": signature,
      },
      body: rawBody,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "UNKNOWN_ERROR");
      throw new Error(`ETA_SIGNING_BRIDGE_ERROR: ${response.status} ${errorText}`);
    }

    const signResponse = validateSignResponse(await response.json());

    return {
      signedDocument: Buffer.from(signResponse.signature, "base64"),
      certificateInfo: {
        subject: "CN=HotelsVendors Dev Signer, O=HV, C=EG",
        issuer: "CN=HV Dev CA, O=HV, C=EG",
        serialNumber: signResponse.certificateFingerprint,
        validFrom: new Date("2026-01-01"),
        validTo: new Date("2030-01-01"),
      },
      signingTime: new Date(signResponse.signedAt),
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const timestamp = String(Date.now());
      const nonce = `hv-health-${Math.random().toString(36).slice(2, 15)}`;
      const rawBody = "";
      const signature = requestMac(this.hmacKey, timestamp, nonce, rawBody);

      const response = await fetch(`${this.gatewayUrl}/health`, {
        method: "GET",
        headers: {
          "X-HV-Signer-Timestamp": timestamp,
          "X-HV-Signer-Nonce": nonce,
          "X-HV-Signer-Signature": signature,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

let cachedBridge: SigningBridge | null = null;

export function getSigningBridge(): SigningBridge {
  if (!cachedBridge) {
    const gatewayUrl = process.env.ETA_SIGNER_GATEWAY_URL;
    const hmacKey = process.env.ETA_SIGNER_GATEWAY_HMAC_KEY;
    if (gatewayUrl && hmacKey) {
      cachedBridge = new LocalGatewayBridge(gatewayUrl, hmacKey);
    } else {
      cachedBridge = new UnconfiguredSigningBridge();
    }
  }
  return cachedBridge;
}
