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
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
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
    // Idempotency handled by queue layer (lib/fintech/idempotency) using key invoice_eta:{invoiceId}
    const token = await this.getToken();
    // Actual submission is permitted only after the caller supplies a
    // production-format, externally signed document. This adapter never signs
    // documents and never assumes a hardware-token integration exists.
    const submitUrl = new URL("/api/v1.0/documentsubmissions", this.endpoint).toString();
    try {
      const response = await fetch(submitUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errText = await response.text().catch(() => "unknown error");
        return {
          status: "FAILED",
          message: `ETA submission returned ${response.status}: ${errText}`,
          errors: [errText],
        };
      }
      const result = (await response.json()) as Partial<ETAResponse>;
      return {
        status:
          result.status ??
          ("PENDING" as ETAResponse["status"]),
        message: result.message ?? undefined,
        documentUuid: result.documentUuid ?? payload.uuid,
        errors: result.errors ?? undefined,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        status: "FAILED",
        message: `ETA submission network error: ${message}`,
        errors: [message],
      };
    }
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
