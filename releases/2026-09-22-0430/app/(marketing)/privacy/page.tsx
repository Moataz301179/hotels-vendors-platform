import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: canonicalUrl("/privacy") },
  title: "Privacy Policy — HotelsVendors",
  description:
    "Privacy Policy for HotelsVendors B2B procurement platform. Data protection under Egyptian Data Protection Law (Law No. 151 of 2020) and GDPR.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0c0c12] text-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-white/45 text-sm mb-8">
          Last updated: July 14, 2026 &middot; Effective: July 14, 2026
        </p>

        <div className="prose prose-invert max-w-none text-white/70 text-sm leading-relaxed space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              Restaurants for E-Marketing (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;), operating the
              HotelsVendors platform (&quot;Platform&quot;), is committed to protecting your privacy and
              personal data. This Privacy Policy explains how we collect, use, store, and protect
              your information when you use our Services.
            </p>
            <p>
              This policy is compliant with:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Egyptian Data Protection Law (Law No. 151 of 2020)</strong> — Primary applicable law for all data processing activities.</li>
              <li><strong>EU General Data Protection Regulation (GDPR)</strong> — Where applicable to EU-based users or data subjects.</li>
              <li><strong>Egyptian Anti-Money Laundering Law (Law No. 80 of 2002)</strong> — KYC data retention requirements.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Data Controller</h2>
            <p>
              The data controller for your personal data is:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Company:</strong> Restaurants for E-Marketing</li>
              <li><strong>Tax ID:</strong> 704226146</li>
              <li><strong>Commercial Registry:</strong> 105300900196948</li>
              <li><strong>Email:</strong> privacy@hotelsvendors.com</li>
              <li><strong>Address:</strong> Cairo, Arab Republic of Egypt</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Data We Collect</h2>
            <p className="font-semibold text-white">3.1 Account and Identity Data</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Full name, email address, phone number</li>
              <li>Company name, job title, role</li>
              <li>Tax Identification Number (TIN)</li>
              <li>Commercial Registration Number</li>
              <li>Business license documents</li>
            </ul>

            <p className="font-semibold text-white mt-4">3.2 Financial Data</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Bank account numbers (encrypted at rest using AES-256-GCM)</li>
              <li>Bank names</li>
              <li>Transaction history and order data</li>
              <li>Invoice data (ETA-compliant)</li>
              <li>Credit scores and risk assessments</li>
            </ul>

            <p className="font-semibold text-white mt-4">3.3 Usage Data</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>IP address, browser type, device information</li>
              <li>Pages visited, features used, time spent on Platform</li>
              <li>Search queries and product interactions</li>
              <li>AI assistant conversation logs (anonymized after 90 days)</li>
            </ul>

            <p className="font-semibold text-white mt-4">3.4 Document Data</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Uploaded business documents (licenses, certificates)</li>
              <li>ETA-submitted invoices and supporting documents</li>
              <li>Dispute evidence and resolution records</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. How We Use Your Data</h2>
            <p>We process your personal data for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Provision:</strong> To operate the Platform, process orders, and facilitate transactions.</li>
              <li><strong>KYC/AML Compliance:</strong> To verify your identity as required by Egyptian Anti-Money Laundering Law (Law No. 80 of 2002).</li>
              <li><strong>ETA E-Invoicing:</strong> To submit invoices to the Egyptian Tax Authority as required by law.</li>
              <li><strong>Factoring Referral:</strong> To refer eligible transactions to licensed factoring partners.</li>
              <li><strong>Platform Improvement:</strong> To analyze usage patterns and improve our Services.</li>
              <li><strong>Communication:</strong> To send transaction updates, security alerts, and (with consent) marketing communications.</li>
              <li><strong>Legal Obligation:</strong> To comply with applicable laws, regulations, and legal processes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Legal Basis for Processing</h2>
            <p>We process your data based on:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Contract Performance:</strong> Processing necessary to perform our contract with you (Terms of Service).</li>
              <li><strong>Legal Obligation:</strong> Processing required by Egyptian law (ETA e-invoicing, AML/KYC, tax record retention).</li>
              <li><strong>Legitimate Interest:</strong> Processing necessary for our legitimate business interests (platform security, fraud prevention).</li>
              <li><strong>Consent:</strong> Where you have given explicit consent (marketing communications, analytics cookies).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data Sharing</h2>
            <p>We share your data with the following categories of recipients:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Factoring Partners (Oliv, EFG Hermes):</strong> When you initiate a factoring request, relevant transaction and identity data is shared with the selected licensed factoring partner.</li>
              <li><strong>Payment Processors (Paymob, Fawry):</strong> For payment processing. Card data is tokenized and never stored on our servers.</li>
              <li><strong>Egyptian Tax Authority (ETA):</strong> Invoice data is submitted as required by Egyptian e-invoicing regulations.</li>
              <li><strong>Law Enforcement:</strong> When required by valid legal process or to protect the Platform from fraud.</li>
            </ul>
            <p className="mt-3">
              We do NOT sell your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Data Security</h2>
            <p>We implement the following security measures:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Encryption at Rest:</strong> Sensitive fields (tax IDs, bank accounts, phone numbers) are encrypted using AES-256-GCM.</li>
              <li><strong>Encryption in Transit:</strong> All data is transmitted over TLS 1.3.</li>
              <li><strong>Access Control:</strong> Role-based access control (RBAC) with tenant isolation.</li>
              <li><strong>Audit Logging:</strong> Immutable audit trail with SHA-256 hash chain for all data mutations.</li>
              <li><strong>Payment Processing:</strong> Card data is handled exclusively by PCI-DSS compliant partners (Paymob, Fawry). We do not store card numbers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Data Retention</h2>
            <p>We retain your data for the following periods:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Invoices and Tax Records:</strong> 10 years from date of issuance (Egyptian Tax Law requirement).</li>
              <li><strong>Accounting Records:</strong> 10 years from date of transaction (Egyptian Commercial Law).</li>
              <li><strong>KYC Documents:</strong> 5 years from account closure (Egyptian AML Law).</li>
              <li><strong>Transaction Data:</strong> 7 years from date of transaction.</li>
              <li><strong>Account Data:</strong> Duration of account relationship plus 7 years.</li>
              <li><strong>Marketing Consent:</strong> Until withdrawal of consent.</li>
              <li><strong>AI Conversation Logs:</strong> Anonymized after 90 days; deleted after 1 year.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Your Rights</h2>
            <p>Under Egyptian Data Protection Law and GDPR (where applicable), you have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Right of Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your data (subject to legal retention requirements).</li>
              <li><strong>Right to Restrict Processing:</strong> Request that we limit how we use your data.</li>
              <li><strong>Right to Data Portability:</strong> Request your data in a structured, machine-readable format.</li>
              <li><strong>Right to Object:</strong> Object to processing based on legitimate interests.</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for processing at any time.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at privacy@hotelsvendors.com. We will
              respond within 30 days as required by Egyptian Data Protection Law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Cross-Border Data Transfers</h2>
            <p>
              Your data is primarily stored and processed in Egypt. If data is transferred outside
              Egypt, we ensure appropriate safeguards are in place in accordance with Egyptian
              Data Protection Law (Law No. 151 of 2020), including standard contractual clauses
              or adequacy decisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Cookies and Tracking</h2>
            <p>
              The Platform uses essential cookies for authentication and session management.
              Analytics and marketing cookies are used only with your explicit consent. You may
              manage cookie preferences through the Platform&apos;s cookie consent banner.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Children&apos;s Privacy</h2>
            <p>
              The Platform is not intended for individuals under the age of 18. We do not knowingly
              collect personal data from children. If we become aware that we have collected data
              from a child, we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be
              communicated via email or Platform notification at least 30 days before taking effect.
              The &quot;Last updated&quot; date at the top indicates when this policy was last revised.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">14. Contact and Complaints</h2>
            <p>
              For privacy-related inquiries or complaints, contact us at:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Email:</strong> privacy@hotelsvendors.com</li>
              <li><strong>Company:</strong> Restaurants for E-Marketing</li>
              <li><strong>Address:</strong> Cairo, Arab Republic of Egypt</li>
            </ul>
            <p className="mt-3">
              If you are not satisfied with our response, you may file a complaint with the
              Egyptian Data Protection Center (under the Personal Data Protection Agency) or the
              competent courts of Cairo.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
