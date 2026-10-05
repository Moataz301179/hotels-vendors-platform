'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
export function WorkspaceNavigation({role}:{role:string}) {
 const pathname=usePathname();
 const links=[{href:'/dashboard',label:'Overview'},{href:'/onboarding',label:'Organization profile'}];
 if(['HOTEL','ADMIN'].includes(role))links.push({href:'/intelligence',label:'Market Compass'},{href:'/demand-aggregation',label:'HV Volume Deals'},{href:'/workspace/marketplace',label:'Procurement'});
 if(['SUPPLIER','ADMIN'].includes(role))links.push({href:'/suppliers',label:'Supplier demand'});
 if(['HOTEL','SUPPLIER','ADMIN'].includes(role))links.push({href:'/orders',label:'Orders'});
 if(['SHIPPING','ADMIN'].includes(role))links.push({href:'/carrier',label:'Carrier operations'});
 if(['HOTEL','SUPPLIER','FACTORING','ADMIN'].includes(role))links.push({href:'/funding',label:'Funding records'});
 if(role==='ADMIN')links.push({href:'/admin',label:'Admin control center'},{href:'/audit',label:'Audit logs'});
 links.push({href:'/security',label:'Security & access'});
 return <nav className="side" aria-label="Workspace navigation"><span className="side-label">YOUR WORKSPACE</span>{links.map(x=><Link key={x.href} href={x.href} aria-current={pathname===x.href?'page':undefined}>{x.label}</Link>)}</nav>;
}
