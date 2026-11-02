'use client';
import Link from 'next/link';
import {usePathname, useSearchParams} from 'next/navigation';
import { navigationForRole } from '@/lib/dashboard/role-navigation';

export function isWorkspaceNavigationActive(href: string, pathname: string, search: string) {
 const target = new URL(href, 'https://workspace.invalid');
 if (target.pathname !== pathname && !(target.search === '' && pathname.startsWith(`${target.pathname}/`))) return false;
 return target.search === '' || target.search === search;
}

export function WorkspaceNavigation({role}:{role:string}) {
 const pathname=usePathname();
 const search = useSearchParams().toString();
 const currentSearch = search ? `?${search}` : '';
 return <nav className="side" aria-label="Workspace navigation">{navigationForRole(role).map((group)=><div className="side-group" key={group.label}><span className="side-label">{group.label}</span>{group.items.map((item)=><Link key={item.href} href={item.href} aria-current={isWorkspaceNavigationActive(item.href, pathname, currentSearch)?'page':undefined}>{item.label}</Link>)}</div>)}</nav>;
}
