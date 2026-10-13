import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/privacy") },
  title: "Privacy Policy — HotelsVendors",
  description: "Privacy Policy for HotelsVendors organization access and procurement workflows.",
};

export default function PrivacyPage() {
  return (
    <article className="min-h-screen bg-white text-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-3">Privacy Policy</h1>
        <p className="text-sm text-slate-600 mb-8">Last updated: October 6, 2026</p>
        <div className="space-y-8 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Scope and contact</h2>
            <p>HotelsVendors is a hospitality business network operated by Returants. This policy covers information handled through our website and organization workspaces. Privacy requests and complaints can be sent to moatazceo@hotelsvendors.com.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Information you provide</h2>
            <p>Depending on the features you use, information can include your name, email address, organization, role, business contact details, documents, listings, purchase records, invoices, delivery evidence and support messages. Submit information about other people only when authorized.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Sign-in and technical information</h2>
            <p>We use Clerk for authentication. Google or Apple sign-in supplies identity information according to the permissions displayed during sign-in, such as an account identifier, name and email address. The Google connection requests basic identity, email and profile access, not Gmail messages or Drive files. Authentication uses session information and essential browser storage. Infrastructure providers may process IP addresses, browser information and request logs to operate and protect the service.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. How information is used</h2>
            <p>Information supports authentication, organization access, requested workflows, transaction records, support and investigation of errors or misuse. Automated purchasing analysis depends on the records available; recommendations do not guarantee savings or credit approval.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Access and service providers</h2>
            <p>Organization records are intended for authorized participants according to their assigned access. Suppliers, carriers or funding providers receive information needed for workflows you initiate or authorize. A listing does not by itself mean information has been shared or an integration is active. Infrastructure providers support authentication, hosting and database operation and may process information outside Egypt. External providers have their own privacy terms. HotelsVendors does not sell personal information.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Security and retention</h2>
            <p>Access restrictions and secure connections support protection of information. No online service can guarantee information will never be lost, altered or accessed without authorization. This policy does not assert a security certification or independently audited compliance status. Retention depends on the information, requested service and applicable obligations. Closing an account does not necessarily remove transaction or legal records, and removal from backups may not be immediate. Contact us for retention and deletion details applicable to your records.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Requests about your information</h2>
            <p>Contact us to request access, correction, deletion, a copy of your information or withdrawal of permission for optional processing. We may need to verify your identity and authority over organization records. Requests are subject to applicable law and recordkeeping obligations. Do not email passwords, private keys or identity documents unless a secure submission method has been agreed.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Updates</h2>
            <p>Updates are published on this page with a revised date. Review this policy before providing information for a new workflow.</p>
          </section>
          <p>Contact: <a className="text-sky-800 underline" href="mailto:moatazceo@hotelsvendors.com">moatazceo@hotelsvendors.com</a></p>
          <p><a className="text-sky-800 underline" href="/terms">Terms of Service</a></p>
        </div>
      </div>
    </article>
  );
}
