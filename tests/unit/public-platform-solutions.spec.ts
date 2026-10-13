import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { createElement, type ComponentType, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const projectRequire = createRequire(resolve("package.json"));

// Render the actual server-page component with only routing/metadata adapters
// stubbed. No backend/auth behavior is simulated by these presentation tests.
function renderPage(route: string) {
  const source = readFileSync(resolve("app/(marketing)", route, "page.tsx"), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const exports: { default?: ComponentType } = {};
  runInNewContext(compiled, {
    exports,
    require: (id: string) => {
      if (id.endsWith(".css")) return {};
      if (id === "@/lib/seo") return { canonicalUrl: (path: string) => `https://www.hotelsvendors.com${path}` };
      if (id === "next/link") {
        return function TestLink({ children, ...props }: { children: ReactNode; href: string }) {
          return createElement("a", props, children);
        };
      }
      return projectRequire(id);
    },
  });
  if (!exports.default) throw new Error("Page has no default component");
  return renderToStaticMarkup(createElement(exports.default));
}

describe("Public Platform and Solutions presentation", () => {
  for (const route of ["platform", "solutions"]) {
    it(`${route} has one heading and a public Compass destination`, () => {
      const html = renderPage(route);
      expect((html.match(/<h1[ >]/g) || []).length).toBe(1);
      expect(html).toContain('href="/#market-compass"');
      expect(html).toContain('href="/intelligence"');
      expect(html).toContain("Market Compass");
      expect(html).not.toContain("<main");
      expect(html).not.toMatch(/94%|24hr|guaranteed volume|Zero penalty|Competitive bidding/i);
    });
  }

  it("Platform labels its task example and preserves registration entry paths", () => {
    const html = renderPage("platform");
    expect(html).toContain("Start with a real requirement.");
    expect(html).toContain("Use the live catalog when a verified listing exists.");
    expect(html).toContain('href="/register"');
    expect(html).toContain("Choose hotel registration");
    expect(html).toContain("Choose supplier registration");
    expect(html).toContain('href="/contact"');
  });

  it("Solutions keeps each outcome and action in an explicit wrapper", () => {
    const html = renderPage("solutions");
    expect((html.match(/class="hv-maintenance-solution-next"/g) || []).length).toBe(4);
    expect(html).toContain("does not guarantee savings");
    expect(html).toContain("Browse supplier listings");
  });

  it("Responsive CSS places outcomes beside the text, not under the icon", () => {
    const css = readFileSync(resolve("components/marketing/public-pages.css"), "utf8");
    expect(css).toMatch(/@media \(max-width: 960px\)/);
    expect(css).toMatch(/\.hv-maintenance-public \.hv-maintenance-solution-next\s*\{\s*grid-column: 2 \/ -1;/);
    expect(css).toContain("minmax(0, 1fr)");
    expect(css).toContain("a:focus-visible");
    // Styles imported by pages remain scoped even after client-side navigation.
    expect(css).not.toMatch(/(^|\n)(body|main|h1|p|a)\s*\{/);
  });
});
