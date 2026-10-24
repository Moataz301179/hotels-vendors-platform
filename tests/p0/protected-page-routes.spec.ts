import { describe, expect, it } from "vitest";
import { isProtectedPage } from "@/lib/security/protected-page-routes";

describe("protected workspace route classification", () => {
  it("routes ETA compliance through the authenticated browser boundary", () => {
    expect(isProtectedPage("/eta-compliance")).toBe(true);
    expect(isProtectedPage("/eta-compliance/history")).toBe(true);
  });

  it("keeps other protected workspace roots and nested paths protected", () => {
    expect(isProtectedPage("/workspace/marketplace/basket")).toBe(true);
    expect(isProtectedPage("/orders")).toBe(true);
    expect(isProtectedPage("/admin/audit")).toBe(true);
  });

  it("does not overmatch public route names", () => {
    expect(isProtectedPage("/marketplace")).toBe(false);
    expect(isProtectedPage("/eta-compliance-preview")).toBe(false);
    expect(isProtectedPage("/orders-history")).toBe(false);
  });
});
