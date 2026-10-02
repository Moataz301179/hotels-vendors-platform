import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/terms") },
  title: "Terms of Service — HotelsVendors",
  description:
    "Terms of Service governing the use of HotelsVendors B2B procurement platform for Egyptian hospitality.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0c0c12] text-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-white/45 text-sm mb-8">
          Last updated: July 14, 2026 &middot; Effective: July 14, 2026
        </p>

        <div className="prose prose-invert max-w-none text-white/70 text-sm leading-relaxed space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              Welcome to HotelsVendors (&quot;Platform&quot;), operated by Restaurants for E-Marketing
              (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;), a company registered in the Arab Republic of Egypt
              under Tax ID 704226146 and Unified Commercial Registry Number 105300900196948.
            </p>
            <p>
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of the HotelsVendors
              platform, including the INVO vendor marketplace, AI-powered procurement tools, factoring
              referral services, and all related applications and APIs (collectively, the &quot;Services&quot;).
            </p>
            <p>
              By accessing or using the Services, you agree to be bound by these Terms. If you do not
              agree to these Terms, you may not access or use the Services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Definitions</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>&quot;Hotel&quot;</strong> — A hotel group or property registered on the Platform as a buyer of goods and services.</li>
              <li><strong>&quot;Supplier&quot;</strong> — A vendor or seller registered on the Platform to list products and fulfill orders.</li>
              <li><strong>&quot;Factoring Partner&quot;</strong> — A licensed financial institution (e.g., Oliv Financial, EFG Hermes) that provides reverse factoring services through the Platform.</li>
              <li><strong>&quot;INVO&quot;</strong> — The vendor marketplace sub-layer of the Platform where suppliers list catalogs and hotels discover products.</li>
              <li><strong>&quot;ETA&quot;</strong> — The Egyptian Tax Authority, responsible for e-invoicing compliance.</li>
              <li><strong>&quot;FRA&quot;</strong> — The Financial Regulatory Authority of Egypt.</li>
              <li><strong>&quot;User&quot;</strong> — Any individual or entity accessing the Platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Platform Nature and Limitations</h2>
            <p className="font-semibold text-white">3.1 Referral-Only Model</p>
            <p>
              HotelsVendors is a <strong>B2B procurement marketplace and referral platform</strong>. The
              Platform does NOT:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Hold, transfer, or custody any cash or funds;</li>
              <li>Provide lending, credit, or financing services directly;</li>
              <li>Conduct factoring operations — all factoring is performed by licensed third-party partners;</li>
              <li>Set factoring rates or make credit decisions on behalf of factoring partners;</li>
              <li>Act as a payment service provider or electronic wallet operator.</li>
            </ul>
            <p className="mt-3">
              All financial services (factoring, credit, payments) are operated by licensed third-party
              partners regulated by the FRA. The Platform acts solely as a technology intermediary
              connecting hotels with suppliers and licensed financial service providers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Account Registration and KYC</h2>
            <p>
              4.1. To use the Services, you must register an account and provide accurate, complete
              information as required by our Know Your Customer (KYC) procedures.
            </p>
            <p>
              4.2. The Platform implements a three-tier KYC verification process in compliance with
              Egyptian Anti-Money Laundering Law (Law No. 80 of 2002, as amended 2020):
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Level 1:</strong> Email and phone verification.</li>
              <li><strong>Level 2:</strong> Tax ID and business license verification.</li>
              <li><strong>Level 3:</strong> Bank account verification.</li>
            </ul>
            <p className="mt-3">
              4.3. Failure to complete required KYC levels may restrict your access to certain
              Platform features, including factoring referral services.
            </p>
            <p>
              4.4. You are responsible for maintaining the confidentiality of your account credentials
              and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Orders and Transactions</h2>
            <p>
              5.1. All orders placed through the Platform are direct agreements between the Hotel
              (buyer) and the Supplier (seller). The Platform facilitates but is not a party to these
              transactions.
            </p>
            <p>
              5.2. The Platform charges the following fees:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Marketplace Commission:</strong> 1.5%–3% on completed transactions.</li>
              <li><strong>Document Processing Fee:</strong> Per ETA invoice submission.</li>
              <li><strong>Supplier SaaS Fee:</strong> Subscription for INVO marketplace listing plans.</li>
            </ul>
            <p className="mt-3">
              5.3. The Platform does NOT charge factoring fees, interest, or financial spreads.
              Factoring fees are charged exclusively by licensed factoring partners.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Dispute Resolution</h2>
            <p>
              6.1. The Platform provides a dispute resolution mechanism for transactions conducted
              through the Platform. Disputes may be initiated by either party (Hotel or Supplier)
              within 30 days of the transaction date.
            </p>
            <p>
              6.2. Dispute resolution process:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Step 1 — Direct Negotiation:</strong> Parties attempt to resolve the dispute directly through Platform messaging.</li>
              <li><strong>Step 2 — Platform Mediation:</strong> If unresolved, the Platform mediates between parties within 5 business days.</li>
              <li><strong>Step 3 — CPA Escalation:</strong> For disputes exceeding EGP 50,000 or involving quality/safety issues, the matter may be escalated to the Egyptian Consumer Protection Agency (CPA).</li>
            </ul>
            <p className="mt-3">
              6.3. The Platform reserves the right to assign liability (Hotel, Supplier, Logistics
              Provider, Platform, or Split Liability) based on evidence and investigation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Return Policy</h2>
            <p>
              7.1. Suppliers may set their own return policies, with a minimum of 14 days for most
              product categories as required by Egyptian Consumer Protection Law (Law No. 181 of 2018).
            </p>
            <p>
              7.2. Return requests must be submitted through the Platform&apos;s return merchandise
              authorization (RMA) workflow.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Intellectual Property</h2>
            <p>
              8.1. All content, trademarks, logos, and intellectual property on the Platform are owned
              by Restaurants for E-Marketing or its licensors. You may not reproduce, distribute, or
              create derivative works without our prior written consent.
            </p>
            <p>
              8.2. Suppliers retain ownership of their product listings, images, and descriptions.
              By listing on the Platform, Suppliers grant the Platform a non-exclusive license to
              display, promote, and distribute their listings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Data Protection and Privacy</h2>
            <p>
              9.1. The Platform collects and processes personal data in accordance with Egyptian Data
              Protection Law (Law No. 151 of 2020) and, where applicable, the EU General Data
              Protection Regulation (GDPR).
            </p>
            <p>
              9.2. For details on data collection, processing, storage, and your rights, please
              refer to our <a href="/privacy" className="underline" style={{ color: "var(--accent-base)" }}>Privacy Policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Electronic Signature Compliance</h2>
            <p>
              10.1. The Platform uses digital signatures for ETA e-invoicing compliance in accordance
              with the Egyptian Electronic Signature Law (Law No. 175 of 2002).
            </p>
            <p>
              10.2. In production environments, digital signatures are executed using RSA-2048
              PKCS#11 hardware tokens issued by the Egyptian Information Assurance Service (EIAS),
              a licensed Certificate Service Provider (CSP).
            </p>
            <p>
              10.3. The Platform attaches the following metadata to all digitally signed documents:
              signing authority, certificate information, timestamp from a trusted Time Stamping
              Authority (TSA), and applicable law reference.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Limitation of Liability</h2>
            <p>
              11.1. To the maximum extent permitted by applicable law, the Platform shall not be
              liable for any indirect, incidental, special, consequential, or punitive damages
              arising out of or related to your use of the Services.
            </p>
            <p>
              11.2. The Platform is not liable for the quality, safety, legality, or availability
              of products listed by Suppliers, or the ability of Hotels to complete purchases.
            </p>
            <p>
              11.3. The Platform is not a party to, and assumes no liability for, any factoring
              agreements between Hotels, Suppliers, and licensed Factoring Partners.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Governing Law and Jurisdiction</h2>
            <p>
              12.1. These Terms are governed by the laws of the Arab Republic of Egypt, including
              but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Egyptian Civil Code (Law No. 131 of 1948)</li>
              <li>Egyptian Consumer Protection Law (Law No. 181 of 2018)</li>
              <li>Egyptian Electronic Signature Law (Law No. 175 of 2002)</li>
              <li>Egyptian Data Protection Law (Law No. 151 of 2020)</li>
              <li>Egyptian Anti-Money Laundering Law (Law No. 80 of 2002, as amended 2020)</li>
            </ul>
            <p className="mt-3">
              12.2. Any disputes arising out of or relating to these Terms shall be subject to the
              exclusive jurisdiction of the competent courts of Cairo, Arab Republic of Egypt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Amendments</h2>
            <p>
              We reserve the right to modify these Terms at any time. Material changes will be
              communicated via email or Platform notification at least 30 days before taking effect.
              Continued use of the Services after changes take effect constitutes acceptance of
              the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">14. Contact Information</h2>
            <p>
              For questions about these Terms, contact us at:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Company:</strong> Restaurants for E-Marketing</li>
              <li><strong>Email:</strong> legal@hotelsvendors.com</li>
              <li><strong>Address:</strong> Cairo, Arab Republic of Egypt</li>
              <li><strong>Tax ID:</strong> 704226146</li>
              <li><strong>Commercial Registry:</strong> 105300900196948</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
