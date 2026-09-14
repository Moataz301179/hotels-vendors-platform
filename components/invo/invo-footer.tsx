import Link from "next/link";
import { Zap } from "lucide-react";

export function InvoFooter() {
  return (
    <footer className="border-t border-white/5 bg-black">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-md bg-accent-base flex items-center justify-center">
                <Zap className="w-4 h-4 text-surface" />
              </div>
              <span className="text-[16px] font-medium text-white">INVO</span>
              <span className="text-[11px] text-white/30">by HotelsVendors</span>
            </div>
            <p className="text-[14px] text-white/40 max-w-sm leading-relaxed">
              The financial layer for suppliers on Egypt's largest hospitality
              procurement network. Subscribe. List. Get paid.
            </p>
          </div>

          <div>
            <h4 className="text-[12px] font-medium uppercase tracking-wider text-white/25 mb-4">Product</h4>
            <ul className="space-y-3">
              <li><Link href="/invo#features" className="text-[14px] text-white/40 hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/invo#pricing" className="text-[14px] text-white/40 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/invo#how-it-works" className="text-[14px] text-white/40 hover:text-white transition-colors">How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[12px] font-medium uppercase tracking-wider text-white/25 mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-[14px] text-white/40 hover:text-white transition-colors">HotelsVendors</Link></li>
              <li><Link href="/register" className="text-[14px] text-white/40 hover:text-white transition-colors">Subscribe</Link></li>
              <li><Link href="/login" className="text-[14px] text-white/40 hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-white/30">
            © {new Date().getFullYear()} INVO by HotelsVendors. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-[13px] text-white/30 hover:text-white/60">Privacy</Link>
            <Link href="/" className="text-[13px] text-white/30 hover:text-white/60">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
