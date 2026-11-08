"use client";

import Image from "next/image";
import { Building2, Landmark, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

type RegulatoryConnectionNoticeProps = {
  compact?: boolean;
};

const copy = {
  en: {
    eyebrow: "REGULATORY & PROVIDER CONTROLS",
    title: "Activation is organization-specific.",
    etaTitle: "Egyptian Tax Authority e-invoicing",
    etaBody:
      "HotelsVendors supports an organization-authorized connection to the Egyptian Tax Authority e-invoicing ecosystem. Activation requires the relevant taxpayer credentials and authorization to be verified for that organization. The issuer's e-seal belongs to the party that signs the vendor invoice; a hotel buyer needs authorized invoice ingest, not an issuer e-seal.",
    fundingTitle: "Provider-controlled factoring facilities",
    fundingBody:
      "When a licensed factoring provider has approved a facility and its agreed conditions are active, HotelsVendors can display the provider-recorded facility availability, transaction eligibility and payment-protection status. Underwriting, credit decisions, disbursement and payment obligations remain with that provider.",
    boundary:
      "This reference does not constitute ETA endorsement, confirmation of registration for every organization, FRA licensing, a credit offer, or a HotelsVendors payment guarantee.",
  },
  ar: {
    eyebrow: "ضوابط تنظيمية وضوابط مزوّد التمويل",
    title: "التفعيل مرتبط بكل جهة على حدة.",
    etaTitle: "الفوترة الإلكترونية لدى مصلحة الضرائب المصرية",
    etaBody:
      "تدعم HotelsVendors ربطًا مُصرَّحًا به على مستوى الجهة بمنظومة الفاتورة الإلكترونية التابعة لمصلحة الضرائب المصرية. ويتطلب التفعيل التحقق للجهة المعنية من بيانات الممول والتفويض والختم الإلكتروني.",
    fundingTitle: "تسهيلات تخصيم خاضعة لمزوّد التمويل",
    fundingBody:
      "عند اعتماد مزوّد تخصيم مرخّص لتسهيلاته وتفعيل الشروط المتفق عليها، يمكن لـ HotelsVendors عرض الرصيد المتاح وأهلية المعاملة وحالة الحماية أو التغطية المثبتة من المزوّد. وتظل قرارات الائتمان والصرف والتزامات السداد مسؤولية مزوّد التمويل وحده.",
    boundary:
      "لا يُعد هذا المرجع اعتمادًا من مصلحة الضرائب أو إثباتًا لتسجيل جميع الجهات أو ترخيصًا من الهيئة العامة للرقابة المالية أو عرضًا ائتمانيًا أو ضمان سداد صادرًا من HotelsVendors.",
  },
} as const;

export function RegulatoryConnectionNotice({ compact = false }: RegulatoryConnectionNoticeProps) {
  const { locale } = useLanguage();
  const text = copy[locale];

  return (
    <section
      className="card"
      aria-label={text.eyebrow}
      style={{
        marginTop: compact ? 16 : 24,
        padding: compact ? 20 : 24,
        borderColor: "#c6d8e4",
        background: "linear-gradient(135deg, #f8fbfc 0%, #edf5f9 100%)",
      }}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        <div className="flex shrink-0 items-center gap-3">
          <Image
            src="/eta-seal.png"
            alt={locale === "ar" ? "مرجع منظومة الفاتورة الإلكترونية المصرية" : "Egyptian e-invoicing reference"}
            width={56}
            height={56}
            priority={false}
            style={{ width: 56, height: 56, objectFit: "contain" }}
          />
          <div>
            <div className="eyebrow">{text.eyebrow}</div>
            <h2 style={{ margin: "4px 0 0", fontSize: compact ? 20 : 24 }}>{text.title}</h2>
          </div>
        </div>
        <div className="grid flex-1 gap-4 md:grid-cols-2">
          <div>
            <h3 className="flex items-center gap-2 font-semibold"><Building2 size={17} aria-hidden="true" />{text.etaTitle}</h3>
            <p className="muted" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.65 }}>{text.etaBody}</p>
          </div>
          <div>
            <h3 className="flex items-center gap-2 font-semibold"><Landmark size={17} aria-hidden="true" />{text.fundingTitle}</h3>
            <p className="muted" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.65 }}>{text.fundingBody}</p>
          </div>
        </div>
      </div>
      <p className="flex items-start gap-2" style={{ margin: "18px 0 0", fontSize: 12, color: "#566978", lineHeight: 1.55 }}>
        <ShieldCheck size={15} aria-hidden="true" style={{ marginTop: 2, flex: "0 0 auto", color: "#315d8a" }} />
        {text.boundary}
      </p>
    </section>
  );
}
