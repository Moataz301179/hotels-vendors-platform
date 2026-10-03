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


/* ── Official app-store style badges ── */


export function SiteFooter() {
  const { locale } = useLanguage();
  const ar = locale === "ar";

  const socials = [
    { label: "Facebook", href: "https://facebook.com/hotelsvendors", Icon: FacebookIcon },
    { label: "Instagram", href: "https://instagram.com/hotelsvendors", Icon: InstagramIcon },
  ];

  return (
    <footer className={`border-t py-12 px-6 bg-black text-white ${ar ? "font-cairo" : ""}`} style={{ borderColor: "rgba(255,255,255,0.10)", backgroundColor: "#000000" }}>
      <div className="max-w-6xl mx-auto">
        {/* Top: brand + about + socials + store badges */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand + About + Founder */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3" dir="ltr">
              <BrandLogo variant="light" size="md" showText={false} />
              <span className="font-semibold text-white uppercase text-[15px]" style={{ letterSpacing: "0.2em" }}>
                Hotels Vendors
              </span>
            </div>
            <p className="text-white/55 text-sm leading-relaxed mb-4">
              {ar
                ? "شبكة أعمال مترابطة للمشتريات الفندقية والموردين والخدمات اللوجستية والفرص التجارية المدعومة بالأدلة."
                : "A connected business network for hospitality procurement, suppliers, logistics and evidence-backed commercial opportunities."}
            </p>
            <div className="mb-4">
              <p className="text-[11px] text-white/40 uppercase tracking-widest mb-1">{ar ? "عن الشركة" : "About"}</p>
              <p className="text-sm text-white/70">
                {ar
                  ? " مطور بواسطة Restaurants for E-Marketing، القاهرة، مصر. تأسست لتحرير سلسلة توريد الضيافة المصرية."
                  : "Built by Restaurants for E-Marketing, Cairo, Egypt — founded to unbundle the Egyptian hospitality supply chain."}
              </p>
              <p className="text-sm text-white/70 mt-1">
                <span className="text-[var(--accent-base)] font-semibold">{ar ? "المؤسس :" : "Founder: "}</span>
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
                  className="hv-hover-accent w-9 h-9 rounded-lg flex items-center justify-center text-white/70 hover:text-[var(--accent-base)] transition-colors"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  <Icon size={17} />
                </a>
              ))}
            </div>
          </div>

          {/* Platform links */}
          <div>
            <div className="font-semibold mb-3 text-white">{ar ? "المنتج" : "Platform"}</div>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link href="/marketplace" className="text-white/50 hover:text-white transition-colors">HotelsVendors</Link></li>
              <li><Link href="/sandbox" className="text-white/50 hover:text-white transition-colors">{ar ? "تجربة المنصة" : "Sandbox"}</Link></li>
              <li><Link href="/financing" className="text-white/50 hover:text-white transition-colors"> {ar ? "التمويل" : "Financing"}</Link></li>
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
            <span className="px-2.5 py-1 rounded-full border text-[10px] font-medium bg-white/5" style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.55)" }}>{ar ? "صلاحيات حسب المؤسسة" : "Organization-scoped access"}</span>
            <span className="px-2.5 py-1 rounded-full border text-[10px] font-medium bg-white/5" style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.55)" }}>{ar ? "إحالات لممولين خارجيين" : "External funding referrals"}</span>
            <span className="px-2.5 py-1 rounded-full border text-[10px] font-medium bg-white/5" style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.55)" }}>{ar ? "سجل تدقيق" : "Auditable workflows"}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
