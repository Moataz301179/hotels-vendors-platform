import { describe, expect, it } from "vitest";
import {
  hovinMotionDistance,
  hovinMotionDuration,
  hovinMotionEase,
} from "../../lib/hovin-motion/tokens";

describe("HotelsVendors motion — web GSAP tokens", () => {
  it("keeps web durations inside the B2B budget (seconds)", () => {
    expect(hovinMotionDuration.feedback).toBeGreaterThanOrEqual(0.16);
    expect(hovinMotionDuration.entryMax).toBeLessThanOrEqual(0.28);
    expect(hovinMotionDuration.enter).toBeLessThanOrEqual(hovinMotionDuration.entryMax);
    expect(hovinMotionDistance.enterY).toBeGreaterThanOrEqual(6);
    expect(hovinMotionDistance.enterY).toBeLessThanOrEqual(12);
  });

  it("uses calm ease-out strings only", () => {
    expect(hovinMotionEase.standard).toMatch(/out/i);
    expect(hovinMotionEase.enter).toMatch(/out/i);
    expect(hovinMotionEase.progress).toMatch(/out/i);
    expect(hovinMotionEase.standard).not.toMatch(/bounce|elastic|back/i);
  });
});
