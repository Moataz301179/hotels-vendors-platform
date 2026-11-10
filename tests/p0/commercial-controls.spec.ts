import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { supplierEarlyPaymentAllowed } from "@/lib/procurement/commercial-controls";

describe("commercial controls", () => {
  it("refuses a 48-hour supplier referral before delivery, guarantee, receipt, and an accepted invoice", () => {
    expect(supplierEarlyPaymentAllowed({ status: "APPROVED", paymentGuaranteed: true, receiptAccepted: true, invoiceAccepted: true })).toBe(false);
    expect(supplierEarlyPaymentAllowed({ status: "DELIVERED", paymentGuaranteed: false, receiptAccepted: true, invoiceAccepted: true })).toBe(false);
    expect(supplierEarlyPaymentAllowed({ status: "DELIVERED", paymentGuaranteed: true, receiptAccepted: false, invoiceAccepted: true })).toBe(false);
    expect(supplierEarlyPaymentAllowed({ status: "DELIVERED", paymentGuaranteed: true, receiptAccepted: true, invoiceAccepted: false })).toBe(false);
    expect(supplierEarlyPaymentAllowed({ status: "DELIVERED", paymentGuaranteed: true, receiptAccepted: true, invoiceAccepted: true })).toBe(true);
  });

  it("keeps the public directory on approved category covers", () => {
    const directory = readFileSync(resolve(process.cwd(), "components/marketing/marketplace-directory.tsx"), "utf8");
    expect(directory).not.toContain("getProductImage");
    expect(directory).not.toContain("wikimedia");
    expect(directory).not.toContain("unsplash");
  });
});
