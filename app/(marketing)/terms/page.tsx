import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/terms") },
  title: "Terms of Service — HotelsVendors",
  description: "Terms of Service for HotelsVendors organization access and procurement workflows.",
};

export default function TermsPage() {
  return (
    <article className="min-h-screen bg-white text-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-3">Terms of Service</h1>
        <p className="text-sm text-slate-600 mb-8">Last updated: October 6, 2026</p>
        <div className="space-y-8 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. The service</h2>
            <p>HotelsVendors, operated by Returants, provides a hospitality business network for hotels, suppliers, carriers and external funding providers. These terms govern the website and available workspaces. Use the service only if authorized to act for the organization you represent.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Accounts and organization access</h2>
            <p>Provide accurate registration information, protect your sign-in credentials and use only assigned permissions. Do not access another organization’s private records, misrepresent approval authority or share credentials. Report suspected unauthorized access to moatazceo@hotelsvendors.com.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Orders and commercial terms</h2>
            <p>Confirm specifications, quantity, price, taxes, delivery conditions, payment terms and approval authority before committing to an order. Supplier and carrier obligations are determined by the agreements for the transaction. A listing or recommendation does not guarantee availability or performance. Any platform charge must be disclosed in the applicable offer or agreement before you commit. This page does not establish a universal commission, subscription or invoice-processing fee.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Financing and external services</h2>
            <p>HotelsVendors is not a lender, insurer or payment wallet. External providers make their own eligibility, credit-limit, pricing and funding decisions under their own agreements. Registration, referral or an uploaded invoice does not guarantee approval or a payment date. Only expressly available connections can be used. References to a provider, tax workflow or future connector do not establish an active partnership or completed regulatory submission.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Recommendations and records</h2>
            <p>Automated analysis may be incomplete or incorrect. Verify sources, assumptions and proposed actions before relying on it for procurement, financial or operational decisions. Participants remain responsible for reviewing documents and maintaining records required for their own business and tax obligations.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Cancellations, returns and disputes</h2>
            <p>Confirm cancellation, return and dispute conditions with the relevant provider before ordering. Mandatory legal rights remain unaffected. Contact us with the order reference and relevant evidence for help identifying the appropriate participant; do not assume a fixed resolution time or an automatic refund.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Content and acceptable use</h2>
            <p>Submit only information and content you are entitled to share. You retain your rights in your content and permit its use to provide requested workflows. Do not upload malicious code, unlawful content, misleading listings or confidential information without authority. Do not interfere with security or impersonate another participant.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Availability and changes</h2>
            <p>Service availability and feature access can change; this page establishes no uninterrupted-service or guaranteed-savings commitment. These terms do not exclude rights or responsibilities that cannot legally be excluded. Revisions are published with a revised date. Questions can be sent to moatazceo@hotelsvendors.com.</p>
          </section>
          <p>Contact: <a className="text-sky-800 underline" href="mailto:moatazceo@hotelsvendors.com">moatazceo@hotelsvendors.com</a></p>
          <p><a className="text-sky-800 underline" href="/privacy">Privacy Policy</a></p>
        </div>
      </div>
    </article>
  );
}
