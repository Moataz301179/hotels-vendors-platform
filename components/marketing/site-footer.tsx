"use client";
import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
export function SiteFooter() {
  return <footer className="border-t border-white/10 bg-black px-5 py-12 text-white sm:px-8">
    <div className="mx-auto max-w-7xl">
      <div className="grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2"><div className="flex items-center gap-3" dir="ltr"><BrandLogo variant="light" size="md" showText={false}/><span className="whitespace-nowrap text-sm font-semibold uppercase tracking-[0.18em]">HotelsVendors</span></div><p className="mt-5 max-w-md text-sm leading-6 text-white/50">Your Virtual Shadow for smarter procurement — connecting Hotels, Suppliers, Carriers and Funders around evidence, action and measurable outcomes.</p></div>
        <div><h3 className="text-sm font-semibold">Platform</h3><div className="mt-4 flex flex-col gap-3 text-sm text-white/50"><Link href="/marketplace" className="hover:text-[#60a5fa]">Procurement network</Link><Link href="/intelligence" className="hover:text-[#60a5fa]">Virtual Shadow</Link><Link href="/solutions" className="hover:text-[#60a5fa]">Solutions</Link><Link href="/compliance" className="hover:text-[#60a5fa]">Security & compliance</Link></div></div>
        <div><h3 className="text-sm font-semibold">Company</h3><div className="mt-4 flex flex-col gap-3 text-sm text-white/50"><Link href="/about" className="hover:text-[#60a5fa]">About</Link><Link href="/support" className="hover:text-[#60a5fa]">Support</Link><Link href="/contact" className="hover:text-[#60a5fa]">Contact</Link><Link href="/privacy" className="hover:text-[#60a5fa]">Privacy</Link><Link href="/terms" className="hover:text-[#60a5fa]">Terms</Link></div></div>
      </div>
      <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} HotelsVendors. Evidence over assumptions.</span><span>Funding decisions remain with external funders.</span></div>
    </div>
  </footer>;
}
