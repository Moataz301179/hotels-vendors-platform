'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { requestJson } from '@/lib/v2-http';
import { WorkspaceAlerts } from '@/components/v2/workspace-alerts';
import { ProcurementWorkflow } from '@/components/v2/procurement-workflow';
import { roleWorkspace } from '@/lib/dashboard/role-workspace';
type Metrics = { potentialSavings:number|string; verifiedSavings:number|string; rfqs:number; opportunities:number; orders:number; activeProducts:number; shipments:number; fundingRequests:number };
type Data = { role:string; organizationRole:string; metrics:Metrics };
const actions:Record<string,Array<[string,string,string]>>={
 HOTEL:[['Procurement','Search verified supply, request quotes and review supplier responses.','/workspace/marketplace'],['Market Compass','Scan purchase history and review evidence before acting.','/intelligence'],['HV Volume Deals','Understand repeated demand across your hotel properties.','/demand-aggregation'],['Orders','Follow recorded purchase orders and their approval status.','/orders']],
 SUPPLIER:[['Supplier workspace','Respond to assigned hotel requests and manage your catalog.','/suppliers'],['Orders','Follow orders placed with your supplier account.','/orders']],
 SHIPPING:[['Carrier operations','Record shipment plans and review your fulfillment activity.','/carrier']],
 FACTORING:[['Funding records','Review authorized funding records. Decisions stay with your organization.','/funding']],
 ADMIN:[['Control center','Review network access and audit evidence.','/admin'],['Market Compass','Review evidence-backed procurement findings.','/intelligence']]
};
export default function Dashboard(){
 const [data,setData]=useState<Data|null>(null),[error,setError]=useState(''),[profile,setProfile]=useState<{complete:boolean}|null>(null);
 useEffect(()=>{let active=true;Promise.all([requestJson<Data>('/api/v2/dashboard'),requestJson<{complete:boolean}>('/api/v2/onboarding')]).then(([d,p])=>{if(active){setData(d);setProfile(p)}}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[]);
 const role=data?.role,m=data?.metrics,workspace=roleWorkspace(data?.role,data?.organizationRole);
 const metrics:Array<[string,string|number,string]>=role==='SUPPLIER'?[['Assigned RFQs',m?.rfqs??'—','/suppliers'],['Orders',m?.orders??'—','/orders'],['Active catalog items',m?.activeProducts??'—','/suppliers']]:role==='SHIPPING'?[['Shipment plans',m?.shipments??'—','/carrier']]:role==='FACTORING'?[['Funding records',m?.fundingRequests??'—','/funding']]:[['Potential savings',m?.potentialSavings??'—','/intelligence'],['Verified savings',m?.verifiedSavings??'—','/intelligence'],['Open RFQs',m?.rfqs??'—','/workspace/marketplace'],['Orders',m?.orders??'—','/orders']];
 return <><div className="eyebrow">{role||'Workspace'}</div><h1>Move from evidence to action.</h1><p className="muted">Your overview reflects recorded activity for your organization and its authorized relationships.</p>{error?<div className="workspace-status" role="alert">{error} <button className="btn btn-ghost" onClick={()=>window.location.reload()}>Retry</button></div>:!data?<p role="status">Loading your workspace…</p>:<>{profile&&!profile.complete&&<div className="workspace-status"><strong>Start with your organization.</strong> Complete your operating profile before purchasing or responding to requests. <Link href="/onboarding" className="btn btn-blue">Complete profile</Link></div>}<div className="grid4" style={{marginTop:28}}>{metrics.map(([label,value,href])=><Link href={href} className="card" style={{padding:22}} key={label}><div className="eyebrow">{label}</div><div className="metric" style={{marginTop:12}}>{value}</div>{label.includes('savings')&&<small>EGP · {label==='Potential savings'?'estimate, subject to review':'recorded verified outcomes'}</small>}</Link>)}</div>{workspace&&<section className="card" style={{padding:24,marginTop:20}}><div className="eyebrow">Role workspace</div><h2>{workspace.title}</h2><p className="muted">{workspace.description}</p><div className="grid3" style={{marginTop:18}}>{workspace.actions.map(action=><Link href={action.href} className="card" style={{padding:20}} key={action.title}><h3>{action.title}</h3><p className="muted">{action.description}</p></Link>)}</div></section>}<ProcurementWorkflow /><WorkspaceAlerts /><div className="grid2" style={{marginTop:20}}>{(actions[role!]||[]).map(([title,description,href])=><Link href={href} className="card" style={{padding:26}} key={title}><h2>{title}</h2><p className="muted">{description}</p></Link>)}</div></>}</>;
}
