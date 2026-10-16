"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Brand } from '@/components/v2/brand';
import styles from "./public-nav.module.css";

function PublicDropdown({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  const details = useRef<HTMLDetailsElement>(null);
  return <details ref={details} className={styles.dropdown} onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); details.current?.removeAttribute("open"); details.current?.querySelector("summary")?.focus(); } }} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) details.current?.removeAttribute("open"); }}>
    <summary>{title} <ChevronDown size={14} aria-hidden="true"/></summary>
    <div className={styles.dropdownPanel}>{links.map(link => <Link key={link.href} href={link.href} onClick={() => details.current?.removeAttribute("open")}>{link.label}</Link>)}</div>
  </details>;
}

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const button = useRef<HTMLButtonElement>(null);
  const platform = [
    { href: "/platform", label: "Product overview" },
    { href: "/walkthrough", label: "Procurement workflow" },
    { href: "/marketplace", label: "Supplier catalogue" },
  ];
  const audiences = [
    { href: "/hotels/join", label: "Hotels" },
    { href: "/suppliers/join", label: "Suppliers" },
    { href: "/contact", label: "Partner access" },
  ];
  function closeMenu() { setOpen(false); }
  return <nav className={styles.nav} aria-label="Main navigation" onKeyDown={e => { if (e.key === "Escape") { closeMenu(); button.current?.focus(); } }}>
    <div className={styles.inner}>
      <Link href="/" className={styles.brand} aria-label="HOTELSVENDORS home"><Brand /></Link>
      <div className={styles.desktop}><PublicDropdown title="Platform" links={platform}/><PublicDropdown title="Network" links={audiences}/><Link href="/getting-started">Getting started</Link></div>
      <div className={styles.actions}><Link href="/login" className={styles.signIn}>Sign in</Link><Link href="/register" className={styles.join}>Join the network</Link><button ref={button} type="button" className={styles.toggle} aria-controls={menuId} aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X size={20}/> : <Menu size={20}/>}</button></div>
    </div>
    {open && <div className={styles.mobile} id={menuId}>{[...platform,...audiences,{href:"/getting-started",label:"Getting started"}].map(link => <Link key={link.href} href={link.href} onClick={closeMenu}>{link.label}</Link>)}</div>}
  </nav>;
}

