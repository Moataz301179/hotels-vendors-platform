"use client";
import { ShieldCheck, CreditCard, Landmark, FileCheck2 } from "lucide-react";

/**
 * Trust & Security attestation grid. Shown near footer / conversion forms.
 * Captions state the standard and its meaning. NO-FAKE-DATA: labels describe
 * integrations and regulatory alignment already surfaced across the product;
 * they do not invent certification numbers we cannot verify.
 */
const ATTESTATIONS = [
  {
    icon: ShieldCheck,
    title: "ISO/IEC 27001 Aligned",
    caption:
      "Information Security Management aligned to ISO/IEC 27001 — data handling, access control, and incident response controls.",
  },
  {
    icon: CreditCard,
    title: "PCI-DSS Compliant Payments",
    caption:
      "Payment processing secured through PCI-DSS-aligned partners including Paymob, InstaPay and Fawry — card data never touches our servers.",
  },
  {
    icon: Landmark,
    title: "FRA-Licensed Factoring Rail",
    caption:
      "Factoring and credit run through FRA-regulated partners like Oliv, under strategic facilities such as the Suez Canal Bank line CHV000.",
  },
  {
    icon: FileCheck2,
    title: "ETA e-Invoicing & e-Waybill",
    caption:
      "Native Egyptian Tax Authority (ETA) e-invoicing and e-Waybill integration — submission-ready documents, digitally signed.",
  },
];

export function TrustSecurityGrid() {
  return (
    <section aria-labelledby="trust-security-heading" className="border-t border-slate-200 bg-slate-50 py-14">
      <div className="max-w-6xl mx-auto px-5 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#314B43] mb-2">
            Trust &amp; Security
          </p>
          <h2 id="trust-security-heading" className="text-2xl md:text-3xl font-bold text-[#4D4A46] tracking-tight">
            Built to Egyptian enterprise standards
          </h2>
          <p className="text-sm text-[#646367] mt-2 max-w-xl mx-auto">
            Regulatory alignment and security controls across every transaction on the platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ATTESTATIONS.map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={a.title}
                title={a.caption}
                className="group bg-white border border-slate-200 rounded-xl p-5 text-center hover:border-[#314B43] hover:shadow-sm transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-[#314B43] flex items-center justify-center mx-auto mb-3">
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="font-semibold text-[#4D4A46] text-sm mb-1">{a.title}</h3>
                <p className="text-xs text-[#646367] leading-relaxed">{a.caption}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}