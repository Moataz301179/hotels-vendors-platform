"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth, UserButton } from "@clerk/nextjs";
import { ArrowUpRight } from "lucide-react";

export function Nav() {
  const { isSignedIn } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  return (
    <header className="nav">
      <div className="shell nav-inner">
        <Link href="/" className="brand" aria-label="HotelsVendors home" onClick={closeMenu}>
          <Image src="/logo-white.svg" alt="HotelsVendors" width={154} height={34} priority />
        </Link>
        <nav id="hv-main-navigation" className={`nav-links${menuOpen ? " nav-links-open" : ""}`} aria-label="Main navigation">
          <Link href="/platform" onClick={closeMenu}>Platform</Link>
          <Link href="/marketplace" onClick={closeMenu}>Marketplace</Link>
          <Link href="/#virtual-shadow" onClick={closeMenu}>Virtual Shadow</Link>
          <Link href="/solutions" onClick={closeMenu}>Solutions</Link>
        </nav>
        <div className="nav-actions">
          {isSignedIn ? <><Link href="/dashboard" className="btn btn-blue">Workspace <ArrowUpRight size={13} aria-hidden="true" /></Link><UserButton /></> : <><Link href="/login" className="btn btn-ghost">Sign in</Link><Link href="/register" className="btn btn-blue">Join network</Link></>}
          <button type="button" className="nav-menu-toggle" aria-expanded={menuOpen} aria-controls="hv-main-navigation" aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen(v => !v)}>{menuOpen ? "Close" : "Menu"}</button>
        </div>
      </div>
    </header>
  );
}
