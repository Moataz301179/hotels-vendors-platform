// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { act, createElement, type ComponentType, type MouseEvent, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";
import { APPROVED_COVERS, groupLabel } from "@/lib/directory/listing-visual";
import { OPERATING_GROUPS } from "@/lib/directory/operating-category";
import { PUBLIC_NAV_LINKS, PROCUREMENT_JOURNEY, marketplaceCategoryHref } from "@/lib/marketing/procurement-journey";

const projectRequire = createRequire(resolve("package.json"));
type PageExports = { default?: ComponentType; SiteNav?: ComponentType };
const mounted: { root: Root; container: HTMLDivElement }[] = [];

function loadComponent(path: string): PageExports {
  const source = readFileSync(resolve(path), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const exports: PageExports = {};
  runInNewContext(compiled, {
    exports,
    require: (id: string) => {
      if (id.endsWith(".module.css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
      if (id === "@/components/marketing/hovin-receiving-preview") {
        return { HovinReceivingPreview: () => createElement("section", { "aria-label": "Interactive HOVIN mobile workflow preview" }, "HOVIN preview") };
      }
      if (id === "@/components/marketing/hero-carousel") {
        return { HeroCarousel: () => createElement("div", {}, "Hero carousel") };
      }
      if (id === "@/lib/directory/listing-visual") {
        return { APPROVED_COVERS, groupLabel };
      }
      if (id === "@/lib/directory/operating-category") {
        return { OPERATING_GROUPS };
      }
      if (id === "@/lib/marketing/procurement-journey") {
        return { PROCUREMENT_JOURNEY, PUBLIC_NAV_LINKS, marketplaceCategoryHref };
      }
      if (id === "@/components/v2/brand") return { Brand: () => createElement("span", {}, "HV") };
      if (id === "@clerk/nextjs") return { useAuth: () => ({ isLoaded: true, isSignedIn: false }) };
      if (id === "next/link") return function TestLink({ children, onClick, ...props }: { children: ReactNode; href: string; onClick?: (event: MouseEvent<HTMLAnchorElement>) => void }) {
        return createElement("a", { ...props, onClick: (event: MouseEvent<HTMLAnchorElement>) => { event.preventDefault(); onClick?.(event); } }, children);
      };
      if (id === "next/image") return function TestImage({ src, alt }: { src: string; alt: string }) { return createElement("img", { src, alt }); };
      if (id === "lucide-react") {
        return new Proxy({}, { get: () => () => createElement("svg") });
      }
      return projectRequire(id);
    },
  });
  return exports;
}

function mount(component?: ComponentType) {
  if (!component) throw new Error("Requested component export is absent");
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  mounted.push({ root, container });
  act(() => root.render(createElement(component)));
  return container;
}

function click(element: Element | null) {
  if (!(element instanceof HTMLElement)) throw new Error("Clickable element is absent");
  act(() => element.click());
}

afterEach(() => {
  for (const { root, container } of mounted.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

describe("Reconciled homepage", () => {
  it("renders one procurement path from catalogue through HOVIN receiving", () => {
    const page = loadComponent("app/(marketing)/page.tsx").default;
    if (!page) throw new Error("Homepage export is absent");
    const html = renderToStaticMarkup(createElement(page));
    expect((html.match(/<h1[ >]/g) || []).length).toBe(1);
    expect(html).toContain("hotel procurement");
    expect(html).toContain("Egypt");
    expect(html).toContain(`href="${PROCUREMENT_JOURNEY.catalogue.href}"`);
    expect(html).toContain(`href="${PROCUREMENT_JOURNEY.hovin.href}"`);
    expect(html).toContain(`href="${PROCUREMENT_JOURNEY.hotelSignup.href}"`);
    expect(html).toContain("Interactive HOVIN mobile workflow preview");
    expect(html).toContain("Safety &amp; compliance");
    expect(html).toContain("Hotel technology");
    expect(html).toContain("Uniforms &amp; workwear");
    expect(html).not.toMatch(/94%|24hr|Zero penalty|Guaranteed volume/i);
    expect(html).not.toContain("<main");
  });
});

describe("Public navigation", () => {
  it("offers the shared public journey destinations", () => {
    const container = mount(loadComponent("components/marketing/site-nav.tsx").SiteNav);
    expect(container.querySelector("nav")?.getAttribute("aria-label")).toBe("Main navigation");
    for (const link of PUBLIC_NAV_LINKS) {
      expect(container.querySelector(`a[href="${link.href}"]`)?.textContent).toContain(link.label);
    }
    expect(container.querySelector('a[href="/intelligence"]')).toBeNull();
  });

  it("opens mobile links, closes on selection and restores menu focus on Escape", () => {
    const container = mount(loadComponent("components/marketing/site-nav.tsx").SiteNav);
    const toggle = container.querySelector<HTMLButtonElement>("button[aria-controls]");
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    click(toggle);
    expect(toggle?.getAttribute("aria-expanded")).toBe("true");
    const panelId = toggle?.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;
    expect(panel?.querySelectorAll("a").length).toBe(PUBLIC_NAV_LINKS.length + 2);
    click(panel?.querySelector('a[href="/platform"]') ?? null);
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    click(toggle);
    act(() => toggle?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle);
  });
});
