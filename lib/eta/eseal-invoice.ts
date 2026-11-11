import { canonicalizeEtaPayload } from "@/lib/eta/canonicalizer";
import { signWithToken, type TokenConnection } from "@/lib/eta/eseal-provider";

export const LOCAL_SIGNING_INVOICE = {
  documentType: "I",
  documentTypeVersion: "0.9",
  internalId: "HV-LOCAL-SIGNING-TEST",
  invoiceLines: [{
    description: "Local signing test line",
    itemType: "GS1",
    itemCode: "1000000000000",
    unitType: "EA",
    quantity: "1",
  }],
} as const;

export type LocalInvoiceSignature = {
  internalId: string;
  canonicalSha256: string;
  algorithm: string;
  certificateFingerprint: string;
  submitted: false;
};

export async function signLocalInvoice(connection: TokenConnection, pin: string): Promise<LocalInvoiceSignature> {
  const canonical = canonicalizeEtaPayload({ ...LOCAL_SIGNING_INVOICE, invoiceLines: LOCAL_SIGNING_INVOICE.invoiceLines.map((line) => ({ ...line })) });
  const signed = await signWithToken(Buffer.from(canonical.canonicalString, "utf8"), pin, connection);
  return {
    internalId: LOCAL_SIGNING_INVOICE.internalId,
    canonicalSha256: canonical.sha256Digest,
    algorithm: signed.algorithm,
    certificateFingerprint: signed.certificateFingerprint,
    submitted: false,
  };
}
