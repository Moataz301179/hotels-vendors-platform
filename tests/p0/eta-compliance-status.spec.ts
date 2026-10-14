import { describe, expect, it } from "vitest";
import { classifyEtaCompliance } from "@/lib/logistics/eta-compliance";

const now = new Date("2026-10-14T12:00:00.000Z");

describe("ETA compliance classification", () => {
  it("marks an active order without a committed ETA as missing instead of guessing", () => {
    expect(classifyEtaCompliance({ status: "CONFIRMED", estimatedDelivery: null }, now)).toBe("MISSING");
  });

  it("raises an overdue delivery commitment", () => {
    expect(classifyEtaCompliance({ status: "IN_TRANSIT", estimatedDelivery: new Date("2026-10-14T11:59:00.000Z") }, now)).toBe("OVERDUE");
  });

  it("identifies a delivery commitment due in the next twenty-four hours", () => {
    expect(classifyEtaCompliance({ status: "CONFIRMED", estimatedDelivery: new Date("2026-10-15T11:00:00.000Z") }, now)).toBe("DUE_SOON");
  });

  it("closes ETA monitoring after a completed order", () => {
    expect(classifyEtaCompliance({ status: "DELIVERED", estimatedDelivery: null }, now)).toBe("CLOSED");
  });
});
