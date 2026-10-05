"use client";

import Link from "next/link";
import { Brand } from "@/components/v2/brand";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth, UserButton } from "@clerk/nextjs";
import { ArrowUpRight } from "lucide-react";

export function Nav() {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  return (
    <header className="nav">
      <div className="shell nav-inner">
        <Link href="/" className="brand" aria-label="HotelsVendors home" onClick={closeMenu}>
          <Brand />
        </Link>
        <nav id="hv-main-navigation" className={`nav-links${menuOpen ? " nav-links-open" : ""}`} aria-label="Main navigation">
          <Link href="/platform" aria-current={pathname === "/platform" ? "page" : undefined} onClick={closeMenu}>Platform</Link>
          <Link href="/marketplace" aria-current={pathname === "/marketplace" ? "page" : undefined} onClick={closeMenu}>Procurement network</Link>
          <Link href="/#volume-deals" onClick={closeMenu}>HV Volume Deals</Link><Link href="/#market-compass" onClick={closeMenu}>Market Compass</Link>
          <Link href="/solutions" aria-current={pathname === "/solutions" ? "page" : undefined} onClick={closeMenu}>Solutions</Link>
        </nav>
        <div className="nav-actions">
          {isSignedIn ? <><Link href="/dashboard" className="btn btn-blue">Workspace <ArrowUpRight size={13} aria-hidden="true" /></Link><UserButton /></> : <><Link href="/login" className="btn btn-ghost">Sign in</Link><Link href="/register" className="btn btn-blue">Join network</Link></>}
          <button type="button" className="nav-menu-toggle" aria-expanded={menuOpen} aria-controls="hv-main-navigation" aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen(v => !v)}>{menuOpen ? "Close" : "Menu"}</button>
        </div>
      </div>
    </header>
  );
}
