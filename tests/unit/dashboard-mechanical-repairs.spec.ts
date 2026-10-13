import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import React, { createElement, type ComponentType, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const projectRequire = createRequire(resolve("package.json"));
const primitive = ({ children }: { children?: ReactNode }) => createElement("div", null, children);
// Presentation-only fixtures: no effects, accounts, requests or mutations run.
function emptyPage(route: string) {
  const source = readFileSync(resolve(`app/(dashboard)/${route}/page.tsx`), "utf8");
  const exports: { default?: ComponentType } = {};
  runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText, {
    exports,
    require: (id: string) => {
      if (id === "react") return { ...React, useEffect: () => {}, useState: (value: unknown) => [value === true ? false : value, () => {}] };
      if (id === "next/navigation") return { useRouter: () => ({ push: () => {} }) };
      if (id === "@/components/cart/cart-context") return { useCart: () => ({ items: [], totalItems: 0, totalPrice: 0, subtotal: 0 }) };
      if (id === "@/components/shared/stat-card") return { StatCard: ({ title, value, icon: Icon }: { title: string; value: ReactNode; icon: ComponentType }) => createElement("div", null, title, value, createElement(Icon)) };
      if (id.startsWith("@/")) return new Proxy({}, { get: () => primitive });
      return projectRequire(id);
    },
  });
  if (!exports.default) throw new Error("Missing dashboard renderer");
  return renderToStaticMarkup(createElement(exports.default));
}

describe("Mechanical dashboard repairs", () => {
  for (const [route, label] of [
    ["cart", "Your cart is empty"], ["deliveries", "No shipments yet"],
    ["invoices", "No invoices yet"], ["receiving", "No receiving records"],
    ["financing", "No credit line applications"],
  ]) {
    it(`${route} renders its real empty branch without fabricated records`, () => {
      expect(emptyPage(route)).toContain(label);
      const source = readFileSync(resolve(`app/(dashboard)/${route}/page.tsx`), "utf8");
      expect(source).not.toContain("stubs-export");
      expect(source).not.toContain("@ts-ignore");
    });
  }
  it("uses supported StatCard and native input contracts", () => {
    expect(readFileSync(resolve("app/(dashboard)/deliveries/page.tsx"), "utf8")).toContain('iconColor="text-sky-400"');
    expect(readFileSync(resolve("app/(dashboard)/receiving/page.tsx"), "utf8")).not.toMatch(/<Input\b[^>]*size="sm"/s);
  });
});
