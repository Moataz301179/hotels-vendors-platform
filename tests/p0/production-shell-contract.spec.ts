import { describe, expect, it } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

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

  it("allows Clerk blob workers while keeping the script policy explicit", () => {
    const proxy = readFileSync(join(root, "proxy.ts"), "utf8");
    expect(proxy).toContain("worker-src 'self' blob:");
    expect(proxy).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
  });

  it("allows Clerk API connections in the response CSP", () => {
    const proxy = readFileSync(join(root, "proxy.ts"), "utf8");
    expect(proxy).toContain("connect-src");
    expect(proxy).toContain("https://united-treefrog-223.clerk.accounts.dev");
    expect(proxy).toContain("https://*.clerk.accounts.dev");
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
