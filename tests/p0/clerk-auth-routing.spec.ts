import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { safeReturnPath } from "@/lib/auth/return-path";

const root = process.cwd();

describe("Clerk authentication routing", () => {
  it("keeps post-auth navigation on this origin", () => {
    expect(safeReturnPath("/orders?view=approval")).toBe("/orders?view=approval");
    expect(safeReturnPath("https://example.test")).toBe("/dashboard");
    expect(safeReturnPath("//example.test")).toBe("/dashboard");
    expect(safeReturnPath("/\\example.test")).toBe("/dashboard");
  });

  it("uses Clerk redirect OAuth flows and role-safe completion paths", () => {
    const signup = readFileSync(join(root, "components/v2/actor-signup.tsx"), "utf8");
    const login = readFileSync(join(root, "app/(auth)/login/page.tsx"), "utf8");
    const completion = readFileSync(join(root, "app/(auth)/auth/continue/page.tsx"), "utf8");

    expect(signup).toContain('unsafeMetadata={{platformRole:role}}');
    expect(signup).toContain('forceRedirectUrl="/auth/continue"');
    expect(signup).toContain('oauthFlow="redirect"');
    expect(login).toContain('forceRedirectUrl={continueUrl}');
    expect(login).toContain('transferable={false}');
    expect(login).toContain('withSignUp={false}');
    expect(login).toContain('oauthFlow="redirect"');
    expect(completion).toContain('getOnboardingActor()');
    expect(completion).toContain('user.status === "PENDING_VERIFICATION"');
  });
});
