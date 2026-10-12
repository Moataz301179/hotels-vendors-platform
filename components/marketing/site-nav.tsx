"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useLanguage } from "@/lib/i18n/language-context";
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
  const { locale } = useLanguage();
  const ar = locale === "ar";
  const platform = [
    { href: "/platform", label: ar ? "عن المنصة" : "Platform overview" },
    { href: "/marketplace", label: ar ? "كتالوج الموردين" : "Supplier catalogue" },
    { href: "/#market-compass", label: ar ? "دليل المشتريات" : "Market Compass overview" },
  ];
  const audiences = [
    { href: "/solutions", label: ar ? "الحلول" : "Solutions" },
    { href: "/register", label: ar ? "الفنادق والموردون" : "Hotels and suppliers" },
    { href: "/contact", label: ar ? "شركاء النقل والتمويل" : "Delivery and funding partners" },
  ];
  function closeMenu() { setOpen(false); }
  return <nav className={styles.nav} aria-label={ar ? "التنقل الرئيسي" : "Main navigation"} onKeyDown={e => { if (e.key === "Escape") { closeMenu(); button.current?.focus(); } }}>
    <div className={styles.inner}>
      <Link href="/" className={styles.brand} aria-label="HotelsVendors home"><Image src="/logo-nav-dark.svg" alt="HotelsVendors" width={165} height={38} className={styles.wordmark} unoptimized /></Link>
      <div className={styles.desktop}><PublicDropdown title={ar ? "المنصة" : "Platform"} links={platform}/><PublicDropdown title={ar ? "لمن المنصة" : "Who it's for"} links={audiences}/><Link href="/#volume-deals">{ar ? "حجم المشتريات" : "Purchasing volume"}</Link></div>
      <div className={styles.actions}><span className={styles.language}><LanguageSwitcher/></span><Link href="/login" className={styles.signIn}>{ar ? "تسجيل الدخول" : "Sign in"}</Link><Link href="/register" className={styles.join}>{ar ? "انضم للشبكة" : "Join network"}</Link><button ref={button} type="button" className={styles.toggle} aria-controls={menuId} aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X size={20}/> : <Menu size={20}/>}</button></div>
    </div>
    {open && <div className={styles.mobile} id={menuId}><LanguageSwitcher/>{[...platform,...audiences,{href:"/#volume-deals",label:ar ? "حجم المشتريات" : "Purchasing volume"}].map(link => <Link key={link.href} href={link.href} onClick={closeMenu}>{link.label}</Link>)}</div>}
  </nav>;
}

