import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const middlewareSource = readFileSync(resolve("middleware.ts"), "utf8");
const loopbackRoutingSource = readFileSync(resolve("lib/deployment/normalize-loopback-routing.ts"), "utf8");
const configSource = readFileSync(resolve("next.config.ts"), "utf8");
const expectedPublicAdditions = ["/platform", "/terms", "/privacy", "/support", "/founder"];
type RouteProbe = { publicPaths: string[]; publicPrefixes: string[]; isPublicPath: (path: string) => boolean };

function transpile(source: string) {
  return ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
}

function routeProbe(): RouteProbe {
  // Execute only the real allowlist/helper statements, with no auth provider or
  // production credentials loaded. This is not a live authorization check.
  const ast = ts.createSourceFile("middleware.ts", middlewareSource, ts.ScriptTarget.Latest, true);
  const statements = ast.statements.filter(statement =>
    (ts.isVariableStatement(statement) && statement.declarationList.declarations.some(declaration =>
      declaration.name.getText(ast) === "PUBLIC_PATHS" || declaration.name.getText(ast) === "PUBLIC_PREFIXES"
    )) || (ts.isFunctionDeclaration(statement) && statement.name?.text === "isPublicPath")
  ).map(statement => statement.getText(ast)).join("\n");
  const exports = {};
  runInNewContext(transpile(`${statements}\nexports.publicPaths = PUBLIC_PATHS; exports.publicPrefixes = PUBLIC_PREFIXES; exports.isPublicPath = isPublicPath;`), { exports });
  return exports as RouteProbe;
}

type FakeResponse = { status: number; body?: unknown; headers: Headers; cookies: { set: () => void } };
type FakeRequest = { nextUrl: { pathname: string }; headers: Headers; cookies: { get: () => undefined }; method: string; url: string };
type FakeMiddleware = (request: FakeRequest) => Promise<FakeResponse>;

function unauthenticatedMiddleware(): FakeMiddleware {
  const exports: { default?: FakeMiddleware } = {};
  const response = (status: number, body?: unknown): FakeResponse => ({ status, body, headers: new Headers(), cookies: { set: () => undefined } });
  runInNewContext(transpile(middlewareSource), {
    exports, URL, Headers, process: { env: { NODE_ENV: "test" } },
    require: (id: string) => {
      if (id === "@clerk/nextjs/server") return {
        clerkMiddleware: (handler: (auth: () => Promise<{ userId: null; sessionClaims: null }>, request: FakeRequest) => Promise<FakeResponse>) =>
          (request: FakeRequest) => handler(async () => ({ userId: null, sessionClaims: null }), request),
      };
      if (id === "./lib/deployment/normalize-loopback-routing") {
        const moduleExports: { normalizeLoopbackRouting?: (headers: Headers, publicOrigin: string, requestUrl?: string) => void } = {};
        runInNewContext(transpile(loopbackRoutingSource), { exports: moduleExports, URL });
        return moduleExports;
      }
      if (id === "@/lib/security/csrf") return { csrfMiddleware: () => null, generateCsrfToken: () => "synthetic-test-token" };
      if (id === "next/server") return { NextResponse: {
        json: (body: unknown, options: { status: number }) => response(options.status, body),
        next: () => response(200),
        redirect: () => response(307),
        rewrite: () => response(200),
      } };
      throw new Error(`Unexpected import in boundary test: ${id}`);
    },
  });
  if (!exports.default) throw new Error("Middleware export is missing");
  return exports.default;
}

type MaintenanceConfig = { distDir: string; output: string; typescript: { ignoreBuildErrors: boolean } };
function evaluateConfig(env: Record<string, string>) {
  const exports: { default?: MaintenanceConfig } = {};
  runInNewContext(transpile(configSource), {
    exports, process: { env }, console: { warn: () => undefined },
    require: (id: string) => {
      if (id === "@sentry/nextjs") return { withSentryConfig: (config: MaintenanceConfig) => config };
      throw new Error(`Unexpected config import: ${id}`);
    },
  });
  if (!exports.default) throw new Error("Next configuration export is missing");
  return exports.default;
}

describe("Maintenance route/config boundaries", () => {
  it("allows only exact new informational paths, not their descendants", () => {
    const probe = routeProbe();
    for (const path of expectedPublicAdditions) {
      expect(probe.publicPaths.filter(entry => entry === path)).toHaveLength(1);
      expect(probe.publicPrefixes).not.toContain(path);
      expect(probe.isPublicPath(path)).toBe(true);
      expect(probe.isPublicPath(`${path}/private`)).toBe(false);
    }
  });

  it("does not classify purchasing workspaces or provisioning APIs as public", () => {
    const probe = routeProbe();
    for (const path of ["/intelligence", "/hotel", "/hotel/orders", "/orders", "/api/v1/auth/clerk-sync", "/api/v1/orders"]) {
      expect(probe.isPublicPath(path)).toBe(false);
    }
    expect(probe.publicPrefixes).not.toContain("/api");
    expect(probe.publicPrefixes).not.toContain("/api/v1");
    expect(probe.publicPrefixes).not.toContain("/");
  });

  it("returns 401 for unauthenticated protected APIs in the real middleware handler", async () => {
    const middleware = unauthenticatedMiddleware();
    for (const path of ["/api/v1/auth/clerk-sync", "/api/v1/orders"]) {
      const result = await middleware({
        nextUrl: { pathname: path }, headers: new Headers({ host: "www.hotelsvendors.com" }),
        cookies: { get: () => undefined }, method: "POST", url: `https://www.hotelsvendors.com${path}`,
      });
      expect(result.status).toBe(401);
      expect(result.body).toEqual({ success: false, error: "Unauthorized" });
    }
  });

  it("keeps TypeScript build validation enabled and output paths internal", () => {
    for (const [setting, directory] of [["build", ".next-maintenance-build"], ["dev", ".next-maintenance"], ["../../external", ".next"]]) {
      const config = evaluateConfig({ NODE_ENV: "production", SESSION_SECRET: "synthetic-test-secret", HV_MAINTENANCE_OUTPUT: setting });
      expect(config.distDir).toBe(directory);
      expect(config.typescript.ignoreBuildErrors).toBe(false);
      expect(config.output).toBe("standalone");
    }
    expect(evaluateConfig({ NODE_ENV: "test" }).distDir).toBe(".next");
  });

  it("does not invent a production session secret", () => {
    expect(() => evaluateConfig({ NODE_ENV: "production" })).toThrow("SESSION_SECRET environment variable is required in production");
    expect(configSource).not.toMatch(/process\.env\.SESSION_SECRET\s*=(?!=)/);
  });
});
