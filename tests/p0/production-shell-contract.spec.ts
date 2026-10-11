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
    expect(proxy).toContain("buildClerkContentSecurityPolicy(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)");
    const productionKey = "pk_live_Y2xlcmsuaG90ZWxzdmVuZG9ycy5jb20k";
    const productionCsp = buildClerkContentSecurityPolicy(productionKey);
    expect(productionCsp).toContain("https://clerk.hotelsvendors.com");
    expect(productionCsp).toContain("https://accounts.hotelsvendors.com");
    expect(productionCsp.split("; ").find((directive) => directive.startsWith("script-src"))).toContain("https://accounts.hotelsvendors.com");
    expect(productionCsp).not.toContain("united-treefrog-223");
    const stagingKey = "pk_test_cHJvYmFibGUtbG9jdXN0LTk3NDguY2xlcmsuYWNjb3VudHMuZGV2JA";
    const stagingCsp = buildClerkContentSecurityPolicy(stagingKey);
    expect(stagingCsp).toContain("https://probable-locust-9748.clerk.accounts.dev");
    expect(stagingCsp.split("; ").find((directive) => directive.startsWith("script-src"))).toContain("https://*.clerk.accounts.dev");
    expect(stagingCsp).not.toContain("https://clerk.hotelsvendors.com");
    expect(proxy).toContain("if (isApiPath) return authMiddleware(request, event);");
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
