import { describe, expect, it } from "vitest";
import { normalizeLoopbackRouting } from "../../lib/deployment/normalize-loopback-routing";
describe("loopback transport normalization", () => {
  it("keeps authenticated rewrites internal and preserves verification headers", () => {
    const headers=new Headers({"x-middleware-rewrite":"https://localhost:3029/dashboard?view=orders","x-clerk-auth-status":"signed-in"});
    normalizeLoopbackRouting(headers,"https://hotelsvendors.com","https://localhost:3029/dashboard?view=orders");
    expect(headers.get("x-middleware-rewrite")).toBeNull();
    expect(headers.get("x-middleware-next")).toBe("1");
    expect(headers.get("x-clerk-auth-status")).toBe("signed-in");
  });
  it("maps loopback redirects to the fixed public origin", () => {
    const headers=new Headers({location:"https://localhost:3029/login?redirect_url=%2Fdashboard"});
    normalizeLoopbackRouting(headers,"https://hotelsvendors.com");
    expect(headers.get("location")).toBe("https://hotelsvendors.com/login?redirect_url=%2Fdashboard");
  });
  it("leaves external Clerk redirects and public rewrites unchanged", () => {
    const headers=new Headers({location:"https://clerk.hotelsvendors.com/v1/oauth_callback"});
    normalizeLoopbackRouting(headers,"https://hotelsvendors.com");
    expect(headers.get("location")).toBe("https://clerk.hotelsvendors.com/v1/oauth_callback");
  });
  it("does not turn a different-path rewrite into a resume", () => {
    const headers=new Headers({"x-middleware-rewrite":"https://localhost:3029/invo"});
    normalizeLoopbackRouting(headers,"https://hotelsvendors.com","https://localhost:3029/dashboard");
    expect(headers.get("x-middleware-rewrite")).toBe("https://localhost:3029/invo");
    expect(headers.get("x-middleware-next")).toBeNull();
  });
  it("does not accept an untrusted public origin or protocol-relative paths", () => {
    const headers=new Headers({location:"https://localhost:3029//evil.example"});
    normalizeLoopbackRouting(headers,"https://hotelsvendors.com");
    expect(headers.get("location")).toBe("https://localhost:3029//evil.example");
    normalizeLoopbackRouting(headers,"https://evil.example");
    expect(headers.get("location")).toBe("https://localhost:3029//evil.example");
  });
});
