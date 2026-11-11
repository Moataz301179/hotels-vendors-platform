"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Brand } from '@/components/v2/brand';
import styles from "./public-nav.module.css";

const links = [
  { href: "/platform", label: "How it works" },
  { href: "/marketplace", label: "Catalogue" },
  { href: "/solutions", label: "Market insights" },
  { href: "/eta-connect", label: "E-invoicing" },
  { href: "/solutions", label: "Partners" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const button = useRef<HTMLButtonElement>(null);
  const { isLoaded, isSignedIn } = useAuth();
  const signedIn = isLoaded && isSignedIn;
  function closeMenu() { setOpen(false); }
  const accountLinks = signedIn
    ? [{ href: "/auth/continue", label: "Open workspace" }]
    : [{ href: "/login", label: "Sign in" }, { href: "/register", label: "Join the network" }];
  return <nav className={styles.nav} aria-label="Main navigation" onKeyDown={e => { if (e.key === "Escape") { closeMenu(); button.current?.focus(); } }}>
    <div className={styles.inner}>
      <Link href="/" className={styles.brand} aria-label="HOTELSVENDORS home"><Brand /></Link>
      <div className={styles.desktop}>{links.map(link => <Link key={link.label} href={link.href}>{link.label}</Link>)}</div>
      <div className={styles.actions}>{signedIn ? <Link href="/auth/continue" className={styles.join}>Open workspace</Link> : <><Link href="/login" className={styles.signIn}>Sign in</Link><Link href="/register" className={styles.join}>Join the network</Link></>}<button ref={button} type="button" className={styles.toggle} aria-controls={menuId} aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X size={20}/> : <Menu size={20}/>}</button></div>
    </div>
    {open && <div className={styles.mobile} id={menuId}>{[...links, ...accountLinks].map(link => <Link key={link.href + link.label} href={link.href} onClick={closeMenu}>{link.label}</Link>)}</div>}
  </nav>;
}
