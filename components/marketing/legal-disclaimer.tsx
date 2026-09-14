import Link from "next/link";

/**
 * Standardized financial/legal disclaimer shown beneath financing sections.
 * NO-FAKE-DATA: text describes the regulatory structure without inventing
 * guarantees or figures.
 */
export function LegalDisclaimer() {
  return (
    <div
      aria-label="Regulatory disclaimer"
      className="border-t border-slate-200 mt-10 pt-6 text-[11px] leading-relaxed text-[#646367] space-y-2"
    >
      <p>
        Factoring and credit facilities are subject to terms, credit approval, and
        non-recourse limits via FRA-regulated partners such as Oliv under strategic
        facilities like the Suez Canal Bank line (CHV000). Availability depends on
        underwriting, eligibility, and approved limits. Nothing on this page
        constitutes an offer, guarantee, or financial advice.
      </p>
      <p className="flex flex-wrap gap-x-4 gap-y-1">
        <Link href="/terms" className="text-[#314B43] hover:underline">Terms of Service</Link>
        <Link href="/privacy" className="text-[#314B43] hover:underline">Privacy Policy</Link>
        <Link href="/compliance" className="text-[#314B43] hover:underline">AML/KYC &amp; Compliance</Link>
      </p>
    </div>
  );
}