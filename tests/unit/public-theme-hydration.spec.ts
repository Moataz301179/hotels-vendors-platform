// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { act, createElement, type ComponentType, type ReactNode } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import ts from "typescript";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

type Preferences = { theme: "light" | "dark"; toggleTheme: () => void };
type PreferencesModule = { PrefsProvider: ComponentType<{ children: ReactNode }>; usePrefs: () => Preferences };
const projectRequire = createRequire(resolve("package.json"));
const mounted: { root: Root; container: HTMLDivElement }[] = [];

function loadPreferences(): PreferencesModule {
  const source = readFileSync(resolve("i18n/provider.tsx"), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const exports = {};
  runInNewContext(compiled, {
    exports, document, window, localStorage,
    require: (id: string) => id === "./dictionaries" ? { ar: {}, en: {} } : projectRequire(id),
  });
  return exports as PreferencesModule;
}

function hydratePreferences() {
  const preferencesModule = loadPreferences();
  function ThemeButton() {
    const prefs = preferencesModule.usePrefs();
    return createElement("button", { onClick: prefs.toggleTheme }, prefs.theme);
  }
  const element = createElement(preferencesModule.PrefsProvider, null, createElement(ThemeButton));
  const container = document.createElement("div");
  container.innerHTML = renderToString(element);
  document.body.append(container);
  const errors: unknown[] = [];
  let root: Root | undefined;
  act(() => { root = hydrateRoot(container, element, { onRecoverableError: error => errors.push(error) }); });
  if (!root) throw new Error("Hydration did not create a root");
  mounted.push({ root, container });
  return { container, errors };
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "h-full";
  document.documentElement.removeAttribute("data-theme");
  document.head.insertAdjacentHTML("beforeend", '<meta id="theme-color-meta" name="theme-color" content="#FFFFFF">');
});

afterEach(() => {
  for (const { root, container } of mounted.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  document.getElementById("theme-color-meta")?.remove();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.className = "";
  localStorage.clear();
});

describe("Theme preference hydration", () => {
  for (const theme of ["dark", "light"] as const) {
    it(`applies saved ${theme} preference after hydration without recoverable mismatch`, () => {
      localStorage.setItem("hv:theme", theme);
      expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
      const { container, errors } = hydratePreferences();
      expect(errors).toEqual([]);
      expect(container.querySelector("button")?.textContent).toBe(theme);
      expect(document.documentElement.getAttribute("data-theme")).toBe(theme);
      expect(document.documentElement.classList.contains("dark")).toBe(theme === "dark");
      expect(document.documentElement.classList.contains("h-full")).toBe(true);
      expect(document.getElementById("theme-color-meta")?.getAttribute("content")).toBe(theme === "dark" ? "#000000" : "#FFFFFF");
      expect(localStorage.getItem("hv-theme-mode")).toBe(theme);
    });
  }

  it("keeps theme toggling and browser chrome synchronized after hydration", () => {
    localStorage.setItem("hv:theme", "dark");
    const { container } = hydratePreferences();
    act(() => container.querySelector<HTMLButtonElement>("button")?.click());
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.getElementById("theme-color-meta")?.getAttribute("content")).toBe("#FFFFFF");
    expect(localStorage.getItem("hv:theme")).toBe("light");
    expect(localStorage.getItem("hv-theme-mode")).toBe("light");
  });

  it("does not bypass hydration warnings or mutate theme from the root inline script", () => {
    const rootSource = readFileSync(resolve("app/layout.tsx"), "utf8");
    expect(rootSource).not.toContain("suppressHydrationWarning");
    expect(rootSource).not.toMatch(/document\.documentElement\.(?:classList|setAttribute|className)/);
    expect(rootSource).toContain("<PrefsProvider>");
    expect(rootSource).toContain("navigator.serviceWorker.getRegistrations()");
    expect(rootSource).toContain('id="theme-color-meta"');
  });
});
