import { describe, expect, it } from "vitest";
import { canonicalizeEtaPayload } from "@/lib/eta/canonicalizer";

describe("ETA document canonicalization", () => {
  it("uses ETA field order and array-name repetition rather than sorting keys", () => {
    const result = canonicalizeEtaPayload({
      documentType: "I",
      invoiceLines: [
        { itemCode: "EGS-001", quantity: "1.00" },
        { itemCode: "EGS-002", quantity: "2.50" },
      ],
      internalId: "HV-1001",
    });

    expect(result.canonicalString).toBe(
      '"DOCUMENTTYPE""I""INVOICELINES""INVOICELINES""ITEMCODE""EGS-001""QUANTITY""1.00""INVOICELINES""ITEMCODE""EGS-002""QUANTITY""2.50""INTERNALID""HV-1001"',
    );
    expect(result.sha256Digest).toMatch(/^[a-f0-9]{64}$/);
  });

  it("refuses a document that already contains its signature", () => {
    expect(() => canonicalizeEtaPayload({
      internalId: "HV-1002",
      signatures: [{ signatureType: "I", value: "not-a-real-signature" }],
    })).toThrow("ETA_CANONICALIZATION_REQUIRES_UNSIGNED_DOCUMENT");
  });
});
