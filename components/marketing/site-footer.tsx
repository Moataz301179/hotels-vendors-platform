"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { useLanguage } from "@/lib/i18n/language-context";

/* ── Real brand glyphs (inline SVG paths, official marks) ── */
function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.026 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.668.072 4.948c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ── Official app-store style badges ── */
function AppleStoreBadge() {
  return (
    <a
      href="https://apps.apple.com"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-1.5 transition hover:opacity-90"
      style={{ border: "1px solid rgba(255,255,255,0.25)" }}
      aria-label="Download on the App Store"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#000" aria-hidden>
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
      <span className="leading-tight">
        <span className="block text-[8px] uppercase tracking-wide text-black/60">Download on the</span>
        <span className="block text-[13px] font-bold text-black">App Store</span>
      </span>
    </a>
  );
}

function GooglePlayBadge() {
  return (
    <a
      href="https://play.google.com"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-1.5 transition hover:opacity-90"
      style={{ border: "1px solid rgba(255,255,255,0.25)" }}
      aria-label="Get it on Google Play"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <path fill="#00D544" d="M3.6 1.8L13.9 12 3.6 22.2c-.4-.3-.6-.7-.6-1.2V3c0-.5.2-.9.6-1.2z" />
        <path fill="#00A0FF" d="M17.2 15.5L13.9 12l3.3-3.5 3.6 2.1c1 .6 1 1.7 0 2.3l-3.6 2.6z" />
        <path fill="#FFB300" d="M3.6 1.8c.2-.2.4-.3.7-.3 1 .2 1 .2 11.2 6.4L13.9 12 3.6 1.8z" />
        <path fill="#FF3C00" d="M3.6 22.2c.2.2.4.3.7.3 1-.2 1-.2 11.2-6.4L13.9 12l3.3 3.5-11.2 6.4z" />
      </svg>
      <span className="leading-tight">
        <span className="block text-[8px] uppercase tracking-wide text-black/60">Get it on</span>
        <span className="block text-[13px] font-bold text-black">Google Play</span>
      </span>
    </a>
  );
}

export function SiteFooter() {
  const { locale } = useLanguage();
  const ar = locale === "ar";

  const socials = [
    { label: "Facebook", href: "https://facebook.com/hotelsvendors", Icon: FacebookIcon },
    { label: "Instagram", href: "https://instagram.com/hotelsvendors", Icon: InstagramIcon },
    { label: "WhatsApp", href: "https://wa.me/201111111111", Icon: WhatsAppIcon },
  ];

  return (
    <footer className={`border-t py-12 px-6 ${ar ? "font-cairo" : ""}`} style={{ borderColor: "#8a6d3b33", backgroundColor: "#0c0c12" }}>
      <div className="max-w-6xl mx-auto">
        {/* Top: brand + about + socials + store badges */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand + About + Founder */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3" dir="ltr">
              <BrandLogo variant="dark" size="md" showText={false} />
              <span className="font-semibold text-white uppercase text-[15px]" style={{ letterSpacing: "0.2em" }}>
                Hotels Vendors
              </span>
            </div>
            <p className="text-white/55 text-sm leading-relaxed mb-4">
              {ar
                ? "أول منصة مشتريات فندقية B2B بالذكاء الاصطناعي في مصر. متوافقة مع الهيئة الضريبية وهيئة الرقابة المالية. مجانية للبدء."
                : "The world's first AI-driven B2B procurement platform for hospitality. ETA & FRA compliant. Free to start."}
            </p>
            <div className="mb-4">
              <p className="text-[11px] text-white/40 uppercase tracking-widest mb-1">{ar ? "عن الشركة" : "About"}</p>
              <p className="text-sm text-white/70">
                {ar
                  ? " مطور بواسطة Restaurants for E-Marketing، القاهرة، مصر. تأسست لتحرير سلسلة توريد الضيافة المصرية."
                  : "Built by Restaurants for E-Marketing, Cairo, Egypt — founded to unbundle the Egyptian hospitality supply chain."}
              </p>
              <p className="text-sm text-white/70 mt-1">
                <span className="text-[#8a6d3b] font-semibold">{ar ? "المؤسس :" : "Founder: "}</span>
                {ar ? "معتز إبراهيم" : "Moataz Ibrahim"}
              </p>
            </div>
            {/* Real brand socials */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[11px] text-white/40 uppercase tracking-widest">{ar ? "تابعنا" : "Follow us"}</span>
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-colors"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  <Icon size={17} />
                </a>
              ))}
            </div>
            {/* Real store badges */}
            <div className="flex items-center gap-3">
              <AppleStoreBadge />
              <GooglePlayBadge />
            </div>
          </div>

          {/* Platform links */}
          <div>
            <div className="font-semibold mb-3 text-white">{ar ? "المنتج" : "Platform"}</div>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link href="/marketplace" className="text-white/50 hover:text-white transition-colors">HotelsVendors</Link></li>
              <li><Link href="/sandbox" className="text-white/50 hover:text-white transition-colors">{ar ? "تجربة المنصة" : "Sandbox"}</Link></li>
              <li><Link href="/financing" className="text-white/50 hover:text-white transition-colors">Oliv {ar ? "التمويل" : "Financing"}</Link></li>
              <li><Link href="/suppliers/join" className="text-white/50 hover:text-white transition-colors">{ar ? "للموردين" : "For Suppliers"}</Link></li>
              <li><Link href="/hotels/join" className="text-white/50 hover:text-white transition-colors">{ar ? "للفنادق" : "For Hotels"}</Link></li>
              <li><Link href="/eta-compliance" className="text-white/50 hover:text-white transition-colors">{ar ? "الامتثال الضريبي" : "ETA Compliance"}</Link></li>
            </ul>
          </div>

          {/* Company + Legal */}
          <div>
            <div className="font-semibold mb-3 text-white">{ar ? "الشركة" : "Company"}</div>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link href="/about" className="text-white/50 hover:text-white transition-colors">{ar ? "عنّا" : "About"}</Link></li>
              <li><Link href="/founder" className="text-white/50 hover:text-white transition-colors">{ar ? "رسالة المؤسس" : "Founder's Message"}</Link></li>
              <li><Link href="/support" className="text-white/50 hover:text-white transition-colors">{ar ? "الدعم" : "Support"}</Link></li>
              <li><Link href="/contact" className="text-white/50 hover:text-white transition-colors">{ar ? "تواصل معنا" : "Contact"}</Link></li>
              <li><Link href="/privacy" className="text-white/50 hover:text-white transition-colors">{ar ? "الخصوصية" : "Privacy"}</Link></li>
              <li><Link href="/terms" className="text-white/50 hover:text-white transition-colors">{ar ? "الشروط" : "Terms"}</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar — real trust badges as small chips */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t text-xs text-white/35" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <span>&copy; {new Date().getFullYear()} {ar ? " Restaurants for E-Marketing. جميع الحقوق محفوظة." : "Restaurants for E-Marketing. All rights reserved."}</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-full border text-[10px] font-semibold bg-white/5" style={{ borderColor: "#8a6d3b55", color: "#8a6d3b" }}>ETA e-Invoicing</span>
            <span className="px-2.5 py-1 rounded-full border text-[10px] font-semibold bg-white/5" style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.55)" }}>FRA</span>
            <span className="px-2.5 py-1 rounded-full border text-[10px] font-semibold bg-white/5" style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.55)" }}>AML/KYC</span>
            <span className="px-2.5 py-1 rounded-full border text-[10px] font-semibold bg-white/5" style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.55)" }}>{ar ? "المدفوعات عبر PCI-DSS" : "PCI-DSS Payments"}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
