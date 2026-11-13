import { describe, expect, it } from "vitest";
import { PUBLIC_ASSISTANT_SYSTEM, resolvePublicActions } from "@/lib/ai/public-assistant";

describe("public AI Assistant grounding", () => {
  it("keeps the system prompt specific to HotelsVendors and sealed procurement", () => {
    expect(PUBLIC_ASSISTANT_SYSTEM).toContain("HOTELSVENDORS AI Assistant");
    expect(PUBLIC_ASSISTANT_SYSTEM).toContain("sealed");
    expect(PUBLIC_ASSISTANT_SYSTEM).toMatch(/never invent supplier names/i);
  });

  it("returns supplier registration actions for supplier questions", () => {
    const actions = resolvePublicActions("How do I register as a supplier?");
    expect(actions.some((action) => action.href.includes("/register"))).toBe(true);
    expect(actions.some((action) => action.href.includes("/solutions/suppliers"))).toBe(true);
  });

  it("returns HOVIN and sign-in actions for tracking questions", () => {
    const actions = resolvePublicActions("Where do I track a HOVIN delivery code?");
    expect(actions.some((action) => action.href === "/hovin")).toBe(true);
  });
});
