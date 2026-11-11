import { canonicalizeEtaPayload } from "@/lib/eta/canonicalizer";
import { assertDetachedCades, signDetachedCades } from "@/lib/eta/eseal-cades";
import type { TokenConnection } from "@/lib/eta/eseal-provider";

export const PREPROD_API_ORIGIN = "https://api.preprod.invoicing.eta.gov.eg";
export const PREPROD_TOKEN_URL = "https://id.preprod.eta.gov.eg/connect/token";
export const PREPROD_SUBMISSION_PATH = "/api/v1.0/documentsubmissions";

const PREPROD_API_HOST = "api.preprod.invoicing.eta.gov.eg";
const PREPROD_IDENTITY_HOST = "id.preprod.eta.gov.eg";

export type PreprodHealth = {
  identityStatus: number;
  submissionStatus: number;
  healthy: boolean;
};

export type PreprodSendResult = {
  target: "preprod" | "loopback";
  httpStatus: number;
  submissionId: string | null;
  acceptedUuid: string | null;
  internalId: string;
  rejected: boolean;
  rejectionReason: string | null;
  certificateFingerprint: string;
};

export type PreprodDocumentInput = {
  issuerId: string;
  issuerName: string;
  receiverId: string;
  receiverName: string;
  activityCode: string;
  internalId: string;
  issuedAt: Date;
};

type SendTarget = {
  apiOrigin: string;
  tokenUrl: string;
};

export function officialPreprodTarget(env: NodeJS.ProcessEnv = process.env): SendTarget {
  const apiOrigin = (env.ETA_API_URL?.trim() || PREPROD_API_ORIGIN).replace(/\/$/, "");
  const tokenUrl = env.ETA_IDENTITY_URL?.trim() || PREPROD_TOKEN_URL;
  assertOfficialPreprod(apiOrigin, tokenUrl);
  return { apiOrigin, tokenUrl };
}

export function assertOfficialPreprod(apiOrigin: string, tokenUrl: string): void {
  const api = parseTarget(apiOrigin);
  const token = parseTarget(tokenUrl);
  if (api.protocol !== "https:" || api.hostname !== PREPROD_API_HOST || api.port || api.username || api.password) {
    throw new Error("ETA_TARGET_REFUSED");
  }
  if (token.protocol !== "https:" || token.hostname !== PREPROD_IDENTITY_HOST || token.pathname !== "/connect/token" || token.port || token.username || token.password) {
    throw new Error("ETA_TARGET_REFUSED");
  }
}

export function preprodInternalId(date: Date): string {
  return `HV-PREPROD-${date.getTime().toString(36).toUpperCase()}`;
}

export function buildPreprodDocument(input: PreprodDocumentInput): Record<string, unknown> {
  const issuerId = taxId(input.issuerId);
  const receiverId = taxId(input.receiverId);
  const issuerName = requiredName(input.issuerName);
  const receiverName = requiredName(input.receiverName);
  if (!/^\d{4}$/.test(input.activityCode)) throw new Error("ETA_ACTIVITY_CODE_REQUIRED");
  if (!/^HV-PREPROD-[A-Za-z0-9-]{4,40}$/.test(input.internalId)) throw new Error("ETA_INTERNAL_ID_INVALID");
  return {
    issuer: {
      address: address(),
      type: "B",
      id: issuerId,
      name: issuerName,
    },
    receiver: {
      address: address(),
      type: "B",
      id: receiverId,
      name: receiverName,
    },
    documentType: "I",
    documentTypeVersion: "1.0",
    dateTimeIssued: issuedAt(input.issuedAt),
    taxpayerActivityCode: input.activityCode,
    internalID: input.internalId,
    invoiceLines: [{
      description: "Preprod connectivity test",
      itemType: "EGS",
      itemCode: "EG-000000000-0",
      unitType: "EA",
      quantity: 1,
      salesTotal: 1,
      total: 1,
      valueDifference: 0,
      totalTaxableFees: 0,
      netTotal: 1,
      itemsDiscount: 0,
      unitValue: { currencySold: "EGP", amountEGP: 1 },
      discount: { rate: 0, amount: 0 },
      taxableItems: [{ taxType: "T1", amount: 0, subType: "V001", rate: 0 }],
    }],
    totalDiscountAmount: 0,
    totalSalesAmount: 1,
    netAmount: 1,
    taxTotals: [{ taxType: "T1", amount: 0 }],
    totalAmount: 1,
    extraDiscountAmount: 0,
    totalItemsDiscountAmount: 0,
  };
}

export function preprodCredentials(env: NodeJS.ProcessEnv = process.env): { clientId: string; clientSecret: string } {
  const clientId = env.ETA_CLIENT_ID?.trim() ?? "";
  const clientSecret = env.ETA_CLIENT_SECRET?.trim() ?? "";
  if (!clientId || !clientSecret) throw new Error("ETA_PREPROD_NOT_CONFIGURED");
  return { clientId, clientSecret };
}

export async function probePreprod(fetchImpl: typeof fetch = fetch, target = officialPreprodTarget()): Promise<PreprodHealth> {
  assertOfficialPreprod(target.apiOrigin, target.tokenUrl);
  const identity = await fetchImpl(target.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const submission = await fetchImpl(`${target.apiOrigin}${PREPROD_SUBMISSION_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  return {
    identityStatus: identity.status,
    submissionStatus: submission.status,
    healthy: identity.status === 400 && submission.status === 401,
  };
}

export async function sendPreprodInvoice(input: {
  connection: TokenConnection;
  pin: string;
  document: Record<string, unknown>;
  clientId: string;
  clientSecret: string;
  signedAt?: Date;
  fetchImpl?: typeof fetch;
  target?: SendTarget;
}): Promise<PreprodSendResult> {
  if (!input.pin.trim()) throw new Error("ESEAL_PIN_REQUIRED");
  if (!input.clientId.trim() || !input.clientSecret.trim()) throw new Error("ETA_PREPROD_NOT_CONFIGURED");
  if (Object.prototype.hasOwnProperty.call(input.document, "signatures")) throw new Error("ETA_CANONICALIZATION_REQUIRES_UNSIGNED_DOCUMENT");
  const target = input.target ?? officialPreprodTarget();
  assertSubmissionTarget(target);
  const signedAt = input.signedAt ?? new Date();
  const canonical = canonicalizeEtaPayload(input.document);
  const documentBytes = Buffer.from(canonical.canonicalString, "utf8");
  const signed = await signDetachedCades(input.connection, input.pin, documentBytes, signedAt);
  assertDetachedCades(documentBytes, signed.cmsDer, signedAt);
  const payload = {
    documents: [{
      ...input.document,
      signatures: [{ signatureType: "I", value: signed.cmsDer.toString("base64") }],
    }],
  };
  const fetchImpl = input.fetchImpl ?? fetch;
  const accessToken = await requestAccessToken(target.tokenUrl, input.clientId, input.clientSecret, fetchImpl);
  const response = await fetchImpl(`${target.apiOrigin}${PREPROD_SUBMISSION_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await readJson(response);
  if (response.status !== 200 && response.status !== 202) {
    await response.text().catch(() => "");
    throw new Error(`ETA_PREPROD_SEND_FAILED:${response.status}`);
  }
  const accepted = firstRecord(body, "acceptedDocuments");
  const rejected = firstRecord(body, "rejectedDocuments");
  return {
    target: new URL(target.apiOrigin).hostname === PREPROD_API_HOST ? "preprod" : "loopback",
    httpStatus: response.status,
    submissionId: textField(body, "submissionId"),
    acceptedUuid: accepted ? textField(accepted, "uuid") : null,
    internalId: String(input.document.internalID ?? ""),
    rejected: Boolean(rejected),
    rejectionReason: rejected ? rejectionReason(rejected, [input.clientId, input.clientSecret, accessToken]) : null,
    certificateFingerprint: signed.certificateFingerprint,
  };
}

function assertSubmissionTarget(target: SendTarget): void {
  try {
    assertOfficialPreprod(target.apiOrigin, target.tokenUrl);
    return;
  } catch {
    const api = parseTarget(target.apiOrigin);
    const token = parseTarget(target.tokenUrl);
    const loopback = (url: URL) => (url.hostname === "127.0.0.1" || url.hostname === "localhost") && url.protocol === "http:" && !url.username && !url.password;
    if (loopback(api) && loopback(token)) return;
    throw new Error("ETA_TARGET_REFUSED");
  }
}

async function requestAccessToken(tokenUrl: string, clientId: string, clientSecret: string, fetchImpl: typeof fetch): Promise<string> {
  const authorization = Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");
  const response = await fetchImpl(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${authorization}`,
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) {
    await response.text().catch(() => "");
    throw new Error(`ETA_PREPROD_AUTH_FAILED:${response.status}`);
  }
  const body = await readJson(response);
  const accessToken = textField(body, "access_token");
  if (!accessToken) throw new Error("ETA_PREPROD_AUTH_FAILED");
  return accessToken;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function firstRecord(body: unknown, key: string): Record<string, unknown> | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as Record<string, unknown>)[key];
  if (!Array.isArray(value) || !value[0] || typeof value[0] !== "object") return null;
  return value[0] as Record<string, unknown>;
}

function textField(body: unknown, key: string): string | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function rejectionReason(rejected: Record<string, unknown>, secrets: string[]): string {
  const error = rejected.error;
  if (!error || typeof error !== "object") return "ETA_DOCUMENT_REJECTED";
  const message = (error as Record<string, unknown>).message;
  if (typeof message !== "string" || !message.trim()) return "ETA_DOCUMENT_REJECTED";
  return secrets.reduce((text, secret) => secret ? text.split(secret).join("[redacted]") : text, message.slice(0, 300));
}

function parseTarget(value: string): URL {
  try {
    return new URL(value);
  } catch {
    throw new Error("ETA_TARGET_REFUSED");
  }
}

function taxId(value: string): string {
  const id = value.trim();
  if (!/^\d{9}$/.test(id)) throw new Error("ETA_TAX_ID_REQUIRED");
  return id;
}

function requiredName(value: string): string {
  const name = value.trim();
  if (name.length < 2 || name.length > 120) throw new Error("ETA_TAXPAYER_NAME_REQUIRED");
  return name;
}

function address() {
  return {
    branchID: "0",
    country: "EG",
    governate: "Cairo",
    regionCity: "Cairo",
    street: "Preprod test",
    buildingNumber: "1",
  };
}

function issuedAt(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}
