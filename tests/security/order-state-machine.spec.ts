import { describe, expect, it } from "vitest";
import { getTransitionGate, validateStatusTransition } from "../../lib/auth/state-machine";

describe("order lifecycle transition gates", () => {
  it("does not require ETA validation before dispatch", () => {
    expect(getTransitionGate("CONFIRMED", "IN_TRANSIT")).toMatchObject({ requires: { paymentGuarantee: true } });
    expect(getTransitionGate("CONFIRMED", "IN_TRANSIT")?.requires.etaValidation).not.toBe(true);
  });

  it("keeps delivery transition legal but leaves proof and GRN enforcement to the route", () => {
    expect(validateStatusTransition("IN_TRANSIT", "DELIVERED")).toEqual({ valid: true });
    expect(getTransitionGate("IN_TRANSIT", "DELIVERED")).toMatchObject({ requires: { paymentGuarantee: true } });
  });
});
