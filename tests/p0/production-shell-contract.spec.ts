import { describe, expect, it } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { buildClerkContentSecurityPolicy } from "@/lib/security/clerk-csp";

const root = process.cwd();
function filesUnder(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}
function routeFromPage(path: string): string {
  const relativePath = relative(join(root, "app"), path).replace(/\\/g, "/");
  const route = relativePath
    .replace(/(^|\/)(\([^/]+\)\/)/g, "$1")
    .replace(/(^|\/)page\.(tsx|ts|jsx|js)$/, "$1")
    .replace(/\/layout\.(tsx|ts|jsx|js)$/, "")
    .replace(/\[\[\.\.\.[^\]]+\]\]/g, "")
    .replace(/\[\.\.\.[^\]]+\]/g, "")
    .replace(/\[([^\]]+)\]/g, "[$1]")
    .replace(/\/+/g, "/");
  return `/${route}`.replace(/\/$/, "") || "/";
}

describe("production shell and authorization contracts", () => {
  it("renders the shared black footer in marketing, workspace, auth, and 404 layouts", () => {
    for (const path of [
      "app/(marketing)/layout.tsx",
      "app/(app)/layout.tsx",
      "app/(auth)/layout.tsx",
      "app/not-found.tsx",
    ]) {
      expect(readFileSync(join(root, path), "utf8"), path).toContain("SiteFooter");
    }
  });

  it("allows Clerk API connections in the response CSP", () => {
    const proxy = readFileSync(join(root, "proxy.ts"), "utf8");
    expect(proxy).toContain("buildClerkContentSecurityPolicy(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, nonce)");
    const productionKey = "pk_live_Y2xlcmsuaG90ZWxzdmVuZG9ycy5jb20k";
    const productionCsp = buildClerkContentSecurityPolicy(productionKey, "test-nonce");
    expect(productionCsp).toContain("https://clerk.hotelsvendors.com");
    expect(productionCsp).toContain("https://accounts.hotelsvendors.com");
    expect(productionCsp.split("; ").find((directive) => directive.startsWith("script-src"))).toContain("https://accounts.hotelsvendors.com");
    expect(productionCsp).toContain("worker-src 'self' blob:");
    expect(productionCsp).not.toContain("united-treefrog-223");
    const stagingKey = "pk_test_dW5pdGVkLXRyZWVmcm9nLTIyMy5jbGVyay5hY2NvdW50cy5kZXYk";
    const stagingCsp = buildClerkContentSecurityPolicy(stagingKey, "test-nonce");
    expect(stagingCsp).toContain("https://united-treefrog-223.clerk.accounts.dev");
    expect(stagingCsp.split("; ").find((directive) => directive.startsWith("script-src"))).toContain("https://*.clerk.accounts.dev");
    expect(stagingCsp).toContain("worker-src 'self' blob:");
    expect(stagingCsp).not.toContain("https://clerk.hotelsvendors.com");
    expect(proxy).toContain("return clerkSecurityMiddleware(security.csp)(securedRequest, event);");
    expect(productionCsp).not.toContain("unsafe-inline");
    expect(productionCsp).not.toContain("unsafe-eval");
  });

  it("uses Clerk's dynamic renderer so its bootstrap receives the CSP nonce", () => {
    const layout = readFileSync(join(root, "app/layout.tsx"), "utf8");
    expect(layout).toContain("<ClerkProvider dynamic");
  });

  it("reconciles and verifies the live Nginx CSP instead of allowing a stale override", () => {
    const deploy = readFileSync(join(root, ".github/workflows/deploy-production.yml"), "utf8");
    expect(deploy).toContain("scripts/reconcile-nginx-csp.mjs");
    expect(deploy).toContain("restore_nginx_csp");
    expect(deploy).toContain("Candidate application CSP contains an unsafe directive");
    expect(deploy).toContain("Public CSP still contains an unsafe directive");
    expect(deploy).toContain("Public CSP is missing the application nonce");
    expect(deploy).toContain("verify_public_csp()");
    expect(deploy).toContain('if verify_public_csp "$candidate_csp_headers" >/dev/null 2>&1; then');
    expect(deploy).toContain('if ! verify_public_csp "$csp_headers"; then');
  });

  it("restores an immutable release identity when activation rolls back", () => {
    const deploy = readFileSync(join(root, ".github/workflows/deploy-production.yml"), "utf8");
    expect(deploy).toContain('ACTIVE_RELEASE_ID="$(basename "$ACTIVE_RELEASE")"');
    expect(deploy).toContain('ACTIVE_SOURCE_SHA="${ACTIVE_RELEASE_ID#github-}"');
    expect(deploy).toContain('HV_RELEASE_ID="$ACTIVE_RELEASE_ID" HV_SOURCE_SHA="$ACTIVE_SOURCE_SHA" PORT=3008');
    expect(deploy).toContain("Rollback did not restore the prior production release identity");
    expect(deploy).toContain("Active production process is unhealthy; restoring its immutable release before activation");
    expect(deploy).toContain("Active production process did not recover before activation");
  });

  it("runs Clerk context for every matched route, including public auth completion", () => {
    const proxy = readFileSync(join(root, "proxy.ts"), "utf8");
    expect(proxy).toContain("const clerkSecurityMiddleware");
    expect(proxy).toContain('pathname === "/api/v2/assistant"');
    expect(proxy).toContain('pathname === "/api/health"');
    expect(proxy).toContain("return clerkSecurityMiddleware(security.csp)(securedRequest, event);");
    expect(proxy).not.toContain('cookies.get("__session")');
  });

  it("keeps /register on the role-selection entry flow rather than a raw Clerk widget", () => {
    const page = readFileSync(join(root, "app/(auth)/register/page.tsx"), "utf8");
    expect(page).toContain("Start with your role in procurement");
    expect(page).toContain("/hotels/signup");
    expect(page).toContain("/suppliers/signup");
    expect(page).not.toContain("<SignUp");
  });

  it("keeps role-specific workspace pages behind server-side role gates", () => {
    for (const path of [
      "app/(app)/admin/page.tsx",
      "app/(app)/funding/page.tsx",
      "app/(app)/intelligence/page.tsx",
      "app/(app)/orders/page.tsx",
      "app/(app)/carrier/page.tsx",
      "app/(app)/suppliers/page.tsx",
      "app/(app)/workspace/marketplace/page.tsx",
    ]) {
      expect(readFileSync(join(root, path), "utf8"), path).toContain("requireActorRole");
    }
  });

  it("uses only implemented destinations in the shared footer", () => {
    const appPages = filesUnder(join(root, "app")).filter((path) => /\/page\.(tsx|ts|jsx|js)$/.test(path));
    const routes = new Set(appPages.map(routeFromPage));
    const footer = readFileSync(join(root, "components/marketing/site-footer.tsx"), "utf8");
    for (const [, href] of footer.matchAll(/href:\s*"(\/[^"]*)"/g)) {
      const pathname = href.split("#")[0];
      expect(routes.has(pathname), `Footer destination ${pathname} must have a page route`).toBe(true);
    }
  });
});
