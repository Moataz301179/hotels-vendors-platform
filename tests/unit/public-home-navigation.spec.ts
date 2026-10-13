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

const projectRequire = createRequire(resolve("package.json"));
type PageExports = { default?: ComponentType; SignalFolio?: ComponentType; SiteNav?: ComponentType };
const mounted: { root: Root; container: HTMLDivElement }[] = [];

function loadComponent(path: string, locale = "en"): PageExports {
  const source = readFileSync(resolve(path), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const exports: PageExports = {};
  runInNewContext(compiled, {
    exports,
    require: (id: string) => {
      if (id.endsWith(".module.css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
      if (id === "@/lib/i18n/language-context") return { useLanguage: () => ({ locale }) };
      if (id === "@/components/layout/brand-logo") return { BrandLogo: () => createElement("span", {}, "HV") };
      if (id === "@/components/shared/language-switcher") return { LanguageSwitcher: () => createElement("button", {}, "Language") };
      if (id === "next/link") return function TestLink({ children, onClick, ...props }: { children: ReactNode; href: string; onClick?: (event: MouseEvent<HTMLAnchorElement>) => void }) {
        return createElement("a", { ...props, onClick: (event: MouseEvent<HTMLAnchorElement>) => { event.preventDefault(); onClick?.(event); } }, children);
      };
      if (id === "next/image") return function TestImage({ src, alt }: { src: string; alt: string }) { return createElement("img", { src, alt }); };
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
  it("renders one heading, public anchors and honest sample/volume disclosures", () => {
    const page = loadComponent("app/(marketing)/page.tsx").default;
    if (!page) throw new Error("Homepage export is absent");
    const html = renderToStaticMarkup(createElement(page));
    expect((html.match(/<h1[ >]/g) || []).length).toBe(1);
    expect(html).toContain("Hotel procurement");
    expect(html).toContain("Egypt");
    expect(html).toContain('id="market-compass"');
    expect(html).toContain('id="volume-deals"');
    expect(html).toContain("not live listings, customer records or guaranteed savings");
    expect(html).toContain("negotiated group deals are not currently available");
    expect(html).toContain('href="/login?redirect_url=%2Fintelligence"');
    expect(html).toContain("View the workspace");
    expect(html).not.toMatch(/94%|24hr|Zero penalty|Guaranteed volume/i);
    expect(html).not.toContain("<main");
  });

  it("SignalFolio changes the real displayed comparison when buttons are pressed", () => {
    const container = mount(loadComponent("app/(marketing)/page.tsx").SignalFolio);
    const buttons = [...container.querySelectorAll<HTMLButtonElement>("button")];
    expect(buttons).toHaveLength(4);
    expect(buttons[2].getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain("EGP 240 versus EGP 264");
    click(buttons[1]);
    expect(buttons[1].getAttribute("aria-pressed")).toBe("true");
    expect(buttons[2].getAttribute("aria-pressed")).toBe("false");
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain("20 units at one property + 30");
    click(buttons[3]);
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain("50 ordered, 48 received");
  });
});

describe("Public navigation", () => {
  it("offers native dropdowns and consistent public Compass/volume destinations", () => {
    const container = mount(loadComponent("components/marketing/site-nav.tsx").SiteNav);
    expect(container.querySelector("nav")?.getAttribute("aria-label")).toBe("Main navigation");
    expect(container.querySelectorAll("details summary")).toHaveLength(2);
    expect(container.querySelector('a[href="/#market-compass"]')?.textContent).toBe("Market Compass overview");
    expect(container.querySelector('a[href="/#volume-deals"]')?.textContent).toBe("Purchasing volume");
    expect(container.querySelector('a[href="/intelligence"]')).toBeNull();
  });

  it("opens mobile links, closes on selection and restores menu focus on Escape", () => {
    const container = mount(loadComponent("components/marketing/site-nav.tsx").SiteNav);
    const toggle = container.querySelector<HTMLButtonElement>('button[aria-controls]');
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    click(toggle);
    expect(toggle?.getAttribute("aria-expanded")).toBe("true");
    const panelId = toggle?.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;
    expect(panel?.querySelectorAll("a")).toHaveLength(7);
    click(panel?.querySelector('a[href="/platform"]') ?? null);
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    click(toggle);
    act(() => toggle?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle);
  });

  it("Escape closes a desktop dropdown and preserves focus on its summary", () => {
    const container = mount(loadComponent("components/marketing/site-nav.tsx").SiteNav);
    const details = container.querySelector<HTMLDetailsElement>("details");
    const summary = details?.querySelector<HTMLElement>("summary");
    details?.setAttribute("open", "");
    summary?.focus();
    act(() => summary?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    expect(details?.hasAttribute("open")).toBe(false);
    expect(document.activeElement).toBe(summary);
  });

  it("leaving a dropdown closes it without changing the destination focus", () => {
    const container = mount(loadComponent("components/marketing/site-nav.tsx").SiteNav);
    const details = container.querySelector<HTMLDetailsElement>("details");
    const summary = details?.querySelector<HTMLElement>("summary");
    const login = container.querySelector<HTMLAnchorElement>('a[href="/login"]');
    details?.setAttribute("open", "");
    act(() => summary?.focus());
    act(() => login?.focus());
    expect(details?.hasAttribute("open")).toBe(false);
    expect(document.activeElement).toBe(login);
  });

  it("renders Arabic destinations through the existing language context", () => {
    const container = mount(loadComponent("components/marketing/site-nav.tsx", "ar").SiteNav);
    expect(container.querySelector("nav")?.getAttribute("aria-label")).toBe("التنقل الرئيسي");
    expect(container.querySelector('a[href="/#market-compass"]')?.textContent).toBe("دليل المشتريات");
  });
});
