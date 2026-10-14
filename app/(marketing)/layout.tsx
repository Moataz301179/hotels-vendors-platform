import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SupplierOnboardingBot } from "@/components/ai-assistant/supplier-onboarding-chatbot";

export const metadata: Metadata = {
  title: "HotelsVendors — Hotel Procurement in Egypt",
  description:
    "Hotel procurement in Egypt: connect a requirement to supplier terms, purchase approval and receiving evidence in a protected organization workspace.",
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
    title: "HotelsVendors — Hotel Procurement in Egypt",
    description:
      "Connect hotel purchasing with suppliers, compare commercial terms and follow the purchase through delivery.",
    type: "website",
    locale: "en_EG",
    alternateLocale: "ar_EG",
  },
  twitter: {
    card: "summary_large_image",
    title: "HotelsVendors — Hotel Procurement in Egypt",
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

