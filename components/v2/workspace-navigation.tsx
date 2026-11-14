'use client';
import Link from 'next/link';
import {usePathname, useSearchParams} from 'next/navigation';
import { BarChart3, BriefcaseBusiness, Building2, ChartNoAxesCombined, ClipboardCheck, FileCheck2, Handshake, House, Landmark, PackageCheck, Route, ScanSearch, Search, ShieldCheck, SlidersHorizontal, type LucideIcon } from 'lucide-react';
import { navigationForRole, type NavigationIcon } from '@/lib/dashboard/role-navigation';

const icons: Record<NavigationIcon, LucideIcon> = { home: House, search: Search, approval: ClipboardCheck, receipt: PackageCheck, insights: ChartNoAxesCombined, planning: BarChart3, funding: Landmark, catalogue: ScanSearch, fulfilment: Handshake, invoice: FileCheck2, carrier: Route, handoff: BriefcaseBusiness, evidence: FileCheck2, governance: SlidersHorizontal, audit: ShieldCheck, security: ShieldCheck, profile: Building2 };

export function isWorkspaceNavigationActive(href: string, pathname: string, search: string) {
 const target = new URL(href, 'https://workspace.invalid');
 if (target.pathname !== pathname && !(target.search === '' && pathname.startsWith(`${target.pathname}/`))) return false;
 return target.search === '' || target.search === search;
}

export function WorkspaceNavigation({role}:{role:string}) {
 const pathname=usePathname();
 const search = useSearchParams().toString();
 const currentSearch = search ? `?${search}` : '';
 return <nav className="side" aria-label="Workspace navigation">{navigationForRole(role).map((group)=><div className="side-group" key={group.label}><span className="side-label">{group.label}</span>{group.items.map((item)=>{const Icon=icons[item.icon];return <Link key={item.href} href={item.href} aria-current={isWorkspaceNavigationActive(item.href, pathname, currentSearch)?'page':undefined}><Icon aria-hidden="true"/>{item.label}</Link>})}</div>)}</nav>;
}
