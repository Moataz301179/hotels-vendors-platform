/**
 * ETA E-Invoicing Adapter (G4 — invisible engine)
 * Source spec: https://sdk.invoicing.eta.gov.eg/api/
 * Scope: Background submission triggered by invoice lifecycle events.
 * Zero UI references. Zero client-side exposure.
 *
 * SECURITY: Client credentials are resolved server-side ONLY via process.env
 * (ETA_CLIENT_ID / ETA_CLIENT_SECRET / ETA_IDENTITY_URL / ETA_API_URL).
 * Never hardcode credentials, taxpayer values, PINs, or hardware-token claims.
 */

import { getSigningBridge } from "./signer-bridge";

export interface ETAPayload {
  uuid: string;
  serialNumber: string;
  documentTypeCode: string;
  documentTypeVersion: string;
  issuerName: string;
  issuerTaxId: string;
  receiverName: string;
  receiverTaxId: string;
  issueDate: string;
  totalAmount: number;
  vatAmount: number;
  items: Array<{
    itemName: string;
    itemCode: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  digitalSignatureUuid: string;
  signedAt: string;
}

export interface ETAResponse {
  status: "ACCEPTED" | "REJECTED" | "PENDING" | "VALIDATED" | "FAILED";
  message?: string;
  documentUuid?: string;
  errors?: string[];
}

export class ETAAdapter {
  private readonly endpoint: string;
  private readonly identityEndpoint: string;
  private token: string | null = null;

  constructor() {
    this.endpoint = process.env.ETA_API_URL?.trim() || "";
    this.identityEndpoint = process.env.ETA_IDENTITY_URL?.trim() || "";
  }

  async getToken(): Promise<string> {
    // 01-login-as-taxpayer-system (official SDK endpoint; versioned via api/v1/ per G9)
    const clientId = process.env.ETA_CLIENT_ID;
    const clientSecret = process.env.ETA_CLIENT_SECRET;
    if (!this.endpoint || !this.identityEndpoint || !clientId || !clientSecret) {
      throw new Error("ETA credentials are not configured. ETA_API_URL, ETA_IDENTITY_URL, ETA_CLIENT_ID and ETA_CLIENT_SECRET must be supplied through the deployment secret store.");
    }
    const tokenUrl = new URL("/connect/token", this.identityEndpoint).toString();
    const basicAuthorization = Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuthorization}`,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
      }).toString(),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "unknown");
      throw new Error(
        `ETA token acquisition failed (${response.status}): ${text}`
      );
    }
    const data = (await response.json()) as { access_token?: string };
    const accessToken = data.access_token;
    if (!accessToken || typeof accessToken !== "string") {
      throw new Error(
        "ETA token response missing access_token; verify Client ID / Client Secret and environment (sandbox vs production)."
      );
    }
    this.token = accessToken;
    return this.token;
  }

  async submitInvoice(payload: ETAPayload): Promise<ETAResponse> {
    void payload;
    if (process.env.ETA_SUBMISSION_ENABLED !== "true") {
      return {
        status: "FAILED",
        message: "ETA_SUBMISSION_DISABLED",
        errors: ["ETA_SUBMISSION_DISABLED"],
      };
    }
    // ETA requires an issuer CAdES-BES signature embedded in each submitted
    // document. Do not allow this older adapter to bypass the verified eSeal
    // bridge while that bridge remains unavailable to the service.
    try {
      const bridge = getSigningBridge();
      await bridge.sign(Buffer.from(JSON.stringify(payload)), 'SHA256');
    } catch (error) {
      return {
        status: "FAILED",
        message: error instanceof Error ? error.message : "ETA_HARDWARE_SIGNING_NOT_CONFIGURED",
        errors: [error instanceof Error ? error.message : "ETA_HARDWARE_SIGNING_NOT_CONFIGURED"],
      };
    }

    requireVerifiedEsealSubmissionBridge();

    // Kept below as the controlled integration path. It becomes reachable only
    // when an approved bridge provides a canonical CAdES-BES-signed document.
  }

  async getStatus(uuid: string): Promise<ETAResponse> {
    if (!this.token) {
      this.token = await this.getToken();
    }
    const statusUrl = new URL(`/api/v1.0/documents/${encodeURIComponent(uuid)}/details`, this.endpoint);
    try {
      const response = await fetch(statusUrl.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "unknown");
        return {
          status: "FAILED",
          message: `Status query failed (${response.status}): ${text}`,
        };
      }
      const data = (await response.json()) as Partial<ETAResponse>;
      return {
        status:
          data.status ??
          ("PENDING" as ETAResponse["status"]),
        message: data.message ?? undefined,
        documentUuid: data.documentUuid ?? uuid,
        errors: data.errors ?? undefined,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        status: "FAILED",
        message: `Status query network error: ${message}`,
      };
    }
  }
}
