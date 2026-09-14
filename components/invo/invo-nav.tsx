"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Zap } from "lucide-react";

export function InvoNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "/invo#features" },
    { label: "How It Works", href: "/invo#how-it-works" },
    { label: "Pricing", href: "/invo#pricing" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 nav-border ${
        scrolled
          ? "bg-black/95 backdrop-blur-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link href="/invo" className="flex items-center gap-2.5 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-accent-base flex items-center justify-center">
            <Zap className="w-5 h-5 text-black" />
          </div>
          <span className="text-[17px] font-medium tracking-tight text-white">
            INVO
          </span>
          <span className="hidden sm:inline text-[11px] font-medium text-white/30 px-1.5 py-0.5 rounded border border-white/10 tracking-wider">
            by HotelsVendors
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="px-4 py-2 text-[14px] font-medium text-white/50 hover:text-white rounded-lg transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          <Link
            href="/login"
            className="text-[14px] font-medium text-white/50 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-[13px] py-2 px-5 bg-accent-base text-black font-medium rounded-lg hover:bg-[#b8955c] transition-colors"
          >
            Subscribe
          </Link>
        </div>

        <button
          className="lg:hidden p-2 rounded-lg text-white/50 hover:text-white transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-black/98 border-t border-white/5 backdrop-blur-md">
          <div className="px-6 py-5 space-y-1">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block py-2.5 text-[14px] font-medium text-white/50 hover:text-white transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 flex gap-3">
              <Link
                href="/login"
                className="flex-1 text-center py-2.5 text-[13px] font-medium border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex-1 text-center py-2.5 text-[13px] font-medium bg-accent-base text-black rounded-lg hover:bg-[#b8955c] transition-colors"
              >
                Subscribe
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
