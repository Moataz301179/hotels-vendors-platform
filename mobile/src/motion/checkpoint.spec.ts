import { describe, expect, it } from "vitest";
import {
  checkpointProgress,
  checkpointVisualState,
  procurementStageFromStatus,
  staggerDelayMs,
} from "./checkpoint";
import { motionDuration, motionDistance, motionStagger } from "./tokens";
import type { PhoneCheckpoint } from "../api/hovin";

const sample: PhoneCheckpoint[] = [
  { key: "assigned", at: "2026-11-12T08:00:00.000Z", state: "done" },
  { key: "accepted", at: "2026-11-12T09:00:00.000Z", state: "done" },
  { key: "picked-up", at: "2026-11-12T10:00:00.000Z", state: "done" },
  { key: "in-transit", at: "2026-11-12T11:00:00.000Z", state: "current" },
  { key: "delivered", at: null, state: "waiting" },
];

describe("HotelsVendors motion — checkpoint helpers", () => {
  it("keeps entry motion within the B2B duration and distance budget", () => {
    expect(motionDuration.feedback).toBeGreaterThanOrEqual(160);
    expect(motionDuration.entryMax).toBeLessThanOrEqual(280);
    expect(motionDuration.enter).toBeLessThanOrEqual(motionDuration.entryMax);
    expect(motionDistance.enterY).toBeGreaterThanOrEqual(6);
    expect(motionDistance.enterY).toBeLessThanOrEqual(12);
  });

  it("computes progress only from known checkpoint states", () => {
    expect(checkpointProgress([])).toBe(0);
    expect(checkpointProgress(sample)).toBeCloseTo((3 + 0.5) / 5, 5);
  });

  it("maps delayed and exception from order status without inventing ETA", () => {
    const current = sample.find((step) => step.state === "current")!;
    expect(checkpointVisualState(current, "IN_TRANSIT")).toBe("current");
    expect(checkpointVisualState(current, "DELAYED")).toBe("delayed");
    expect(checkpointVisualState(current, "EXCEPTION")).toBe("exception");
    expect(checkpointVisualState(sample[0], "EXCEPTION")).toBe("done");
  });

  it("derives procurement stages for workflow rails", () => {
    expect(procurementStageFromStatus("PENDING")).toBe("request");
    expect(procurementStageFromStatus("QUOTE_REVIEW")).toBe("review");
    expect(procurementStageFromStatus("APPROVED")).toBe("approval");
    expect(procurementStageFromStatus("PAYMENT_GUARANTEE")).toBe("payment-guarantee");
    expect(procurementStageFromStatus("CONFIRMED")).toBe("fulfilment");
    expect(procurementStageFromStatus("IN_TRANSIT")).toBe("fulfilment");
    expect(procurementStageFromStatus("DELIVERED")).toBe("delivery");
  });

  it("caps list stagger so dense tables stay snappy", () => {
    expect(staggerDelayMs(0, motionStagger.stepMs, motionStagger.maxItems)).toBe(0);
    expect(staggerDelayMs(99, motionStagger.stepMs, motionStagger.maxItems)).toBe(
      (motionStagger.maxItems - 1) * motionStagger.stepMs,
    );
  });
});
