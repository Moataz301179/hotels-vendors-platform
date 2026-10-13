import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteFooter } from "../../components/marketing/site-footer";

const language = vi.hoisted(() => ({ locale: "en" }));
vi.mock("@/lib/i18n/language-context", () => ({ useLanguage: () => language }));
vi.mock("@/components/layout/brand-logo", () => ({ BrandLogo: () => null }));
vi.mock("next/link", () => ({ default: ({ children, prefetch, ...props }: { children: React.ReactNode; prefetch?: boolean }) => { void prefetch; return createElement("a", props, children); } }));

describe("public footer destinations", () => {
  it("distinguishes the public Compass overview from its sign-in workspace", () => {
    language.locale = "en";
    const html = renderToStaticMarkup(createElement(SiteFooter));
    expect(html).toContain('href="/#market-compass"');
    expect(html).toContain("Market Compass overview");
    expect(html).toContain('href="/login?redirect_url=%2Fintelligence"');
    expect(html).toContain("Market Compass workspace — sign in");
    expect(html).not.toContain('href="/intelligence"');
  });

  it.each(["en", "ar"])("preserves company, support and legal destinations in %s", (locale) => {
    language.locale = locale;
    const html = renderToStaticMarkup(createElement(SiteFooter));
    for (const href of ["/about", "/founder", "/support", "/contact", "/privacy", "/terms"]) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html).toContain('rel="noopener noreferrer"');
  });
});
