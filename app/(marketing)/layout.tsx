import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SupplierOnboardingBot } from "@/components/ai-assistant/supplier-onboarding-chatbot";

export const metadata: Metadata = {
  title: "HotelsVendors — Hospitality Business Network & Virtual Shadow",
  description:
    "Connect hotels, suppliers, carriers and external funders. HotelsVendors Virtual Shadow surfaces evidence-backed procurement leaks, savings and business opportunities across the hospitality network.",
  keywords: [
    "B2B hospitality procurement Egypt",
    "automated factoring lines Cairo",
    "hotel supply chain management Egypt",
    "ETA e-invoicing compliance",
    "hospitality vendor marketplace",
    " Sharm El-Sheikh hotel suppliers",
    "Hurghada resort procurement",
    "digital invoice Egypt",
    "تجهيزات الفنادق بالجملة",
    "منصة المشتريات الفندقية مصر",
    "الفوترة الإلكترونية هيئة الضرائب",
    "تمويل فندقي مصر",
    "سلسلة التوريد الفندقية",
  ],
  openGraph: {
    title: "HotelsVendors — Hospitality Business Network & Virtual Shadow",
    description:
      "A connected hospitality business network with a Virtual Shadow for evidence-backed procurement, savings and commercial opportunities. External funders retain all financing decisions.",
    type: "website",
    locale: "en_EG",
    alternateLocale: "ar_EG",
  },
  twitter: {
    card: "summary_large_image",
    title: "HotelsVendors — Hospitality Business Network & Virtual Shadow",
    description:
      "Evidence-backed procurement signals, savings opportunities and commercial connections across the hospitality network.",
  },
  alternates: {
    canonical: "https://www.hotelsvendors.com",
    languages: {
      "en": "/",
      "ar": "/ar",
    },
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "HotelsVendors",
  "legalName": "Restaurants for E-Marketing",
  "taxID": "704226146",
  "identifier": {
    "@type": "PropertyValue",
    "name": "Unified Commercial Registry Number",
    "value": "105300900196948"
  },
  "url": "https://hotelsvendors.com",
  "logo": "https://hotelsvendors.com/logo-white.svg",
  "description": "A hospitality business network connecting hotels, suppliers, carriers and external funders, with a Virtual Shadow for evidence-backed commercial opportunities.",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "EG",
    "addressLocality": "Cairo"
  },
  "areaServed": [
    {
      "@type": "City",
      "name": "Sharm El-Sheikh"
    },
    {
      "@type": "City",
      "name": "Hurghada"
    },
    {
      "@type": "City",
      "name": "Cairo"
    },
    {
      "@type": "City",
      "name": "Alexandria"
    }
  ],
  "sameAs": [
    "https://linkedin.com/company/hotelsvendors",
    "https://twitter.com/hotelsvendors"
  ],
  "knowsAbout": [
    "B2B Hospitality Procurement",
    "Egyptian Tax Authority E-Invoicing",
    "Reverse Factoring",
    "Hotel Supply Chain Management",
    "Coastal Logistics Egypt"
  ]
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <SiteNav />
      <main id="main-content">{children}</main>
      <SiteFooter />
      <SupplierOnboardingBot />
    </ThemeProvider>
  );
}
