"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeModeToggle } from "@/components/theme/mode-toggle";

const links = [
  ["/marketplace", "Procurement"], ["/intelligence", "Virtual Shadow"], ["/solutions", "For Hotels"], ["/suppliers/join", "For Suppliers"], ["/about", "Network"],
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  return <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#232831] shadow-lg shadow-black/10">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
      <Link href="/" className="flex shrink-0 items-center gap-3 text-white" dir="ltr">
        <BrandLogo variant="light" size="md" showText={false} />
        <span className="whitespace-nowrap text-[14px] font-semibold uppercase tracking-[0.18em]">HotelsVendors</span>
      </Link>
      <div className="hidden items-center gap-7 lg:flex">
        {links.map(([href,label]) => <Link key={href} href={href} className="whitespace-nowrap text-sm text-white/65 transition hover:text-[#60a5fa]">{label}</Link>)}
      </div>
      <div className="hidden items-center gap-2 md:flex">
        <LanguageSwitcher /><ThemeModeToggle variant="icon" />
        <Link href="/login" className="px-3 py-2 text-sm text-white/70 hover:text-[#60a5fa]">Sign in</Link>
        <Link href="/register" className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#60a5fa]">Join network</Link>
      </div>
      <button className="p-2 text-white/70 lg:hidden" onClick={()=>setOpen(!open)} aria-label="Toggle navigation">{open?<X size={20}/>:<Menu size={20}/>}</button>
    </div>
    {open && <div className="border-t border-white/10 bg-[#232831] px-5 py-4 lg:hidden">
      <div className="flex flex-col gap-1">{links.map(([href,label])=><Link key={href} href={href} onClick={()=>setOpen(false)} className="rounded-lg px-3 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-[#60a5fa]">{label}</Link>)}</div>
      <div className="mt-3 flex items-center gap-3 border-t border-white/10 pt-3"><LanguageSwitcher/><ThemeModeToggle variant="icon"/><Link href="/login" className="text-sm text-white/70">Sign in</Link><Link href="/register" className="rounded-lg bg-[#3b82f6] px-3 py-2 text-sm font-semibold text-white">Join network</Link></div>
    </div>}
  </nav>;
}
