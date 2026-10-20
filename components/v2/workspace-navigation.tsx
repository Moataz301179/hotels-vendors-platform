'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import { navigationForRole } from '@/lib/dashboard/role-navigation';
export function WorkspaceNavigation({role}:{role:string}) {
 const pathname=usePathname();
 return <nav className="side" aria-label="Workspace navigation">{navigationForRole(role).map((group)=><div className="side-group" key={group.label}><span className="side-label">{group.label}</span>{group.items.map((item)=><Link key={item.href} href={item.href} aria-current={pathname===item.href?'page':undefined}>{item.label}</Link>)}</div>)}</nav>;
}
