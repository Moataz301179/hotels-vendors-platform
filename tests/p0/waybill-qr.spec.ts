import { afterEach, describe, expect, it } from "vitest";
import { makeWaybillQr, verifyWaybillQr } from "@/lib/logistics/grn";

const originalSecret = process.env.HOTELSVENDORS_HMAC_SECRET;

afterEach(() => {
  if (originalSecret === undefined) delete process.env.HOTELSVENDORS_HMAC_SECRET;
  else process.env.HOTELSVENDORS_HMAC_SECRET = originalSecret;
});

describe("waybill QR signatures", () => {
  it("refuses to generate or trust a QR code when no signing secret is configured", () => {
    delete process.env.HOTELSVENDORS_HMAC_SECRET;
    expect(() => makeWaybillQr("order", "waybill", "tax", 1)).toThrow("WAYBILL_SIGNING_UNAVAILABLE");
    expect(verifyWaybillQr("HVWB:eyJvcmRlcklkIjoib3JkZXIifQ")).toEqual({ valid: false });
  });

  it("accepts only an intact code signed with the configured secret", () => {
    process.env.HOTELSVENDORS_HMAC_SECRET = "test-waybill-secret";
    const qr = makeWaybillQr("order-1", "waybill-1", "tax-1", 2);
    expect(verifyWaybillQr(qr)).toMatchObject({ valid: true, orderId: "order-1", waybillId: "waybill-1" });

    const payload = JSON.parse(Buffer.from(qr.slice(5), "base64url").toString());
    payload.orderId = "foreign-order";
    const tampered = `HVWB:${Buffer.from(JSON.stringify(payload)).toString("base64url")}`;
    expect(verifyWaybillQr(tampered)).toEqual({ valid: false });
  });
});
