"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth, UserButton } from "@clerk/nextjs";

export function Nav() {
  const { isSignedIn } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="nav">
      <div className="shell nav-inner">
        <Link href="/" className="brand" style={{ display: "flex", alignItems: "center" }} aria-label="HotelsVendors home">
          <Image src="/logo-white.svg" alt="HotelsVendors" width={154} height={32} priority />
        </Link>
        <nav className={`nav-links${menuOpen ? " nav-links-open" : ""}`} aria-label="Main navigation">
          <Link href="/platform" onClick={() => setMenuOpen(false)}>Platform</Link>
          <Link href="/marketplace" onClick={() => setMenuOpen(false)}>Marketplace</Link>
          <Link href="/platform#virtual-shadow" onClick={() => setMenuOpen(false)}>Virtual Shadow</Link>
          <Link href="/solutions" onClick={() => setMenuOpen(false)}>Solutions</Link>
        </nav>
        <div className="nav-actions">
          {isSignedIn ? <><Link href="/dashboard" className="btn btn-blue">Workspace</Link><UserButton /></> : <><Link href="/login" className="btn btn-ghost">Sign in</Link><Link href="/register" className="btn btn-blue">Join network</Link></>}
          <button type="button" className="nav-menu-toggle" aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen(v => !v)}>{menuOpen ? "Close" : "Menu"}</button>
        </div>
      </div>
    </header>
  );
}
