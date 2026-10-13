import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PrivacyPage from "../../app/(marketing)/privacy/page";
import TermsPage from "../../app/(marketing)/terms/page";

describe("public legal pages", () => {
  it.each([[PrivacyPage, "Privacy Policy", "/terms"], [TermsPage, "Terms of Service", "/privacy"]] as const)(
    "renders an accessible public document with a contact and reciprocal policy link",
    (Page, title, link) => {
      const html = renderToStaticMarkup(React.createElement(Page));
      expect(html).toContain(title);
      expect(html.match(/<h1\b/g)).toHaveLength(1);
      expect(html).not.toContain("<main");
      expect(html).toContain('href="mailto:moatazceo@hotelsvendors.com"');
      expect(html).toContain(`href="${link}"`);
      expect(html).toContain("bg-white text-slate-900");
    },
  );

  it("does not promise unverified certifications, locality or fixed retention", () => {
    const html = renderToStaticMarkup(React.createElement(PrivacyPage));
    expect(html).not.toMatch(/AES-256|TLS 1\.3|SHA-256|10 years|anonymized after 90 days|primarily stored and processed in Egypt|This policy is compliant/);
    expect(html).toContain("may process information outside Egypt");
  });

  it("does not invent partner relationships or universal commercial fees", () => {
    const html = renderToStaticMarkup(React.createElement(TermsPage));
    expect(html).not.toMatch(/EFG Hermes|Oliv Financial|1\.5%|3%|RSA-2048|14 days/);
    expect(html).toContain("does not guarantee approval or a payment date");
  });
});
