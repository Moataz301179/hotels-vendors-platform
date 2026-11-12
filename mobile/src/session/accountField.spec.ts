import { describe, expect, it } from "vitest";
import { fieldStateAction } from "./accountField";

describe("account switch", () => {
  it("clears field state when a different account signs in", () => {
    expect(fieldStateAction("user-a", "user-b")).toBe("clear");
  });

  it("keeps field state for the same account and for the first sign-in", () => {
    expect(fieldStateAction("user-a", "user-a")).toBe("keep");
    expect(fieldStateAction(null, "user-a")).toBe("keep");
    expect(fieldStateAction("user-a", null)).toBe("keep");
  });
});
