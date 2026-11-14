import { describe, expect, it } from "vitest";
import { decideHandoff } from "@/lib/auth/handoff";

describe("authentication handoff", () => {
  it("sends a signed-in person without a workspace to organization choice", () => {
    expect(decideHandoff({ signedIn: true, actor: null, publicRoleDeclared: false }).href).toBe("/register?choose=1");
    expect(decideHandoff({ signedIn: true, actor: null, publicRoleDeclared: true }).href).toBe("/register?choose=1&reason=unlinked");
  });

  it("opens onboarding for a pending organization and the workspace for an active one", () => {
    expect(decideHandoff({ signedIn: true, actor: { status: "PENDING_VERIFICATION" }, publicRoleDeclared: true }).href).toBe("/onboarding");
    expect(decideHandoff({ signedIn: true, actor: { status: "ACTIVE" }, publicRoleDeclared: true, returnTo: "/orders?view=approval" }).href).toBe("/orders?view=approval");
  });

  it("sends active hotels without a credit line to credit-line legibility first", () => {
    expect(
      decideHandoff({
        signedIn: true,
        actor: { status: "ACTIVE", platformRole: "HOTEL" },
        publicRoleDeclared: true,
        creditLineActive: false,
      }).href
    ).toBe("/credit-line");
    expect(
      decideHandoff({
        signedIn: true,
        actor: { status: "ACTIVE", platformRole: "HOTEL" },
        publicRoleDeclared: true,
        creditLineActive: true,
      }).href
    ).toBe("/dashboard");
  });

  it("keeps an anonymous session on the sign-in page", () => {
    expect(decideHandoff({ signedIn: false, actor: null, publicRoleDeclared: false }).href).toBe("/login?redirect_url=%2Fauth%2Fcontinue");
  });
});
