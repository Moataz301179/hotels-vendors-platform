"use client";
import Link from "next/link";
import { Brand } from '@/components/v2/brand';
const linkClass = "text-[#c9d2d8] hover:text-white transition-colors";
const headClass = "text-[11px] uppercase tracking-[.12em] text-[#8b979e] mb-3";
function Social({ kind }: { kind: "facebook" | "instagram" | "linkedin" }) {
  const label = kind === "facebook" ? "f" : kind === "instagram" ? "◎" : "in";
  return <span aria-hidden className={kind === "linkedin" ? "text-[13px] font-extrabold tracking-[-.06em]" : "text-sm font-semibold"}>{label}</span>;
}
export function SiteFooter() {
  return <footer className="hv-site-footer border-t py-12 px-6 text-white" style={{ borderColor: "rgba(255,255,255,.16)", backgroundColor: "var(--chrome)" }}><div className="max-w-6xl mx-auto">
    <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-10">
      <div className="md:col-span-2"><div className="flex items-center gap-2.5 mb-3"><Brand /></div><p className="text-white/80 text-sm leading-relaxed mb-4">The operating network for hotel requirements, reviewed supply capacity, controlled decisions and accountable receiving evidence.</p><div className="flex items-center gap-3 mt-5"><span className="text-white/70 text-[11px] uppercase tracking-widest">Follow us</span><a href="https://facebook.com/hotelsvendors" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid #59636d" }}><Social kind="facebook" /></a><a href="https://instagram.com/hotelsvendors" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid #59636d" }}><Social kind="instagram" /></a><a href="https://linkedin.com/company/hotelsvendors" target="_blank" rel="noopener noreferrer" aria-label="HOTELSVENDORS on LinkedIn" className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid #59636d" }}><Social kind="linkedin" /></a></div></div>
      <div><div className={headClass}>Platform</div><ul className="flex flex-col gap-2 text-sm"><li><Link href="/platform" className={linkClass}>How it works</Link></li><li><Link href="/marketplace" className={linkClass}>Catalogue</Link></li><li><Link href="/solutions" className={linkClass}>Market insights</Link></li><li><Link href="/eta-connect" className={linkClass}>E-invoicing</Link></li><li><Link href="/login" className={linkClass}>Sign in</Link></li></ul></div>
      <div><div className={headClass}>Partners</div><ul className="flex flex-col gap-2 text-sm"><li><Link href="/solutions/suppliers" className={linkClass}>Vendors</Link></li><li><Link href="/solutions/carriers" className={linkClass}>Logistics</Link></li><li><Link href="/solutions/funders" className={linkClass}>Finance</Link></li><li><Link href="/contact" className={linkClass}>Partner enquiries</Link></li></ul></div>
      <div><div className={headClass}>Company</div><ul className="flex flex-col gap-2 text-sm"><li><Link href="/about" className={linkClass}>About</Link></li><li><Link href="/investors" className={linkClass}>Investors</Link></li><li><Link href="/support" className={linkClass}>Support</Link></li><li><Link href="/contact" className={linkClass}>Contact</Link></li></ul></div>
      <div><div className={headClass}>Legal</div><ul className="flex flex-col gap-2 text-sm"><li><Link href="/privacy" className={linkClass}>Privacy policy</Link></li><li><Link href="/terms" className={linkClass}>Terms of use</Link></li></ul></div>
    </div><div className="pt-6 border-t text-xs text-[#7d8890]" style={{ borderColor: "#2a3238" }}>&copy; {new Date().getFullYear()} Restaurants for E-Marketing. All rights reserved.</div>
  </div></footer>;
}
