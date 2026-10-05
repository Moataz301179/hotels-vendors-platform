"use client";

import Link from "next/link";
import { Brand } from "@/components/v2/brand";
import { usePathname } from "next/navigation";
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
          <Brand />
        </Link>
        <nav id="hv-main-navigation" className={`nav-links${menuOpen ? " nav-links-open" : ""}`} aria-label="Main navigation">
          <NavDropdown title="Platform" closeMenu={closeMenu} links={[
            ['/platform','Platform overview'],['/marketplace','Procurement network'],['/#market-compass','Market Compass'],['/security-overview','Security overview'],
          ]}/>
          <NavDropdown title="Who it’s for" closeMenu={closeMenu} links={[
            ['/solutions','All solutions'],['/solutions/hotels','Hotels'],['/solutions/suppliers','Suppliers'],['/solutions/carriers','Carriers'],['/solutions/funders','Funders'],
          ]}/>
          <Link href="/#volume-deals" onClick={closeMenu}>HV Volume Deals</Link>
        </nav>
        <div className="nav-actions">
          {isSignedIn ? <><Link href="/dashboard" className="btn btn-blue">Workspace <ArrowUpRight size={13} aria-hidden="true" /></Link><UserButton /></> : <><Link href="/login" className="btn btn-ghost">Sign in</Link><Link href="/register" className="btn btn-blue">Join network</Link></>}
          <button type="button" className="nav-menu-toggle" aria-expanded={menuOpen} aria-controls="hv-main-navigation" aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen(v => !v)}>{menuOpen ? "Close" : "Menu"}</button>
        </div>
      </div>
    </header>
  );
}

function NavDropdown({title,links,closeMenu}:{title:string;links:Array<[string,string]>;closeMenu:()=>void}) {
 const pathname=usePathname();
 return <details className="nav-dropdown" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))event.currentTarget.open=false}} onKeyDown={event=>{if(event.key==='Escape'){event.currentTarget.open=false;event.currentTarget.querySelector('summary')?.focus();event.stopPropagation()}}}>
  <summary>{title}</summary><div className="nav-dropdown-panel">{links.map(([href,label])=><Link href={href} key={href} aria-current={pathname===href?'page':undefined} onClick={event=>{const details=event.currentTarget.closest('details');if(details)details.open=false;closeMenu()}}>{label}</Link>)}</div>
 </details>;
}
