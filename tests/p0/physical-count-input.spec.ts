import { describe, expect, it } from "vitest";
import { validatePhysicalCountSubmission } from "@/lib/inventory/physical-counts";

const now = new Date("2026-10-18T07:00:00.000Z");
const valid = { productId: "product_123", clientSubmissionId: "6b2b78a9-8a3b-4c30-b4bc-1c7edc0a1e27", observedQuantity: 24, barcode: "6281234567890", capturedAt: "2026-10-18T06:58:00.000Z" };

describe("physical inventory count input", () => {
  it("accepts an explicit bounded count tied to an idempotency key", () => expect(validatePhysicalCountSubmission(valid, now)).toMatchObject({ ok: true, value: { observedQuantity: 24 } }));
  it("rejects automatic, fractional, negative, and implausibly large quantities", () => {
    for (const observedQuantity of [-1, 1.5, "24", 1_000_001]) expect(validatePhysicalCountSubmission({ ...valid, observedQuantity }, now)).toMatchObject({ ok: false });
  });
  it("rejects stale captures, malformed ids, and unsafe barcodes", () => {
    expect(validatePhysicalCountSubmission({ ...valid, capturedAt: "2026-10-16T06:58:00.000Z" }, now)).toMatchObject({ ok: false });
    expect(validatePhysicalCountSubmission({ ...valid, clientSubmissionId: "reused" }, now)).toMatchObject({ ok: false });
    expect(validatePhysicalCountSubmission({ ...valid, barcode: "x\nunsafe" }, now)).toMatchObject({ ok: false });
  });
});
