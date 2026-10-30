'use client';
import {useCallback,useEffect,useState} from 'react';
import {requestJson} from '@/lib/v2-http';

type FundingData={requests:Array<{id:string;status:string;displayStatus?:string;frozen?:boolean;requestedAmount:string|null;requestedAt:string;factoringCompanyId:string}>;companies:Array<{id:string;name:string}>};

export function FundingEvidence(){
 const [data,setData]=useState<FundingData|null>(null),[error,setError]=useState('');
 const load=useCallback(async()=>{setError('');setData(await requestJson<FundingData>('/api/v2/funding'))},[]);
 useEffect(()=>{let cancelled=false;load().catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:'Unable to load evidence.')});return()=>{cancelled=true}},[load]);
 return <section className="card workspace-table-wrap" style={{padding:24}}>{error?<div className="workspace-status" role="alert">{error} <button className="btn btn-ghost" onClick={()=>void load().catch(e=>setError(e instanceof Error?e.message:'Unable to load evidence.'))}>Retry</button></div>:!data?<p role="status">Loading evidence…</p>:data.requests.length?<table className="table"><thead><tr><th>Reference</th><th>Partner</th><th>Requested amount</th><th>Recorded status</th><th>Drawdown status</th></tr></thead><tbody>{data.requests.map(row=><tr key={row.id}><td>{row.id}</td><td>{data.companies.find(company=>company.id===row.factoringCompanyId)?.name??'Not recorded'}</td><td>{row.requestedAmount===null?'Not recorded':`${Number(row.requestedAmount).toLocaleString('en-EG',{maximumFractionDigits:2})} EGP`}</td><td>{row.status.replaceAll('_',' ')}</td><td>{(row.displayStatus??row.status).replaceAll('_',' ')}{row.frozen?' · frozen':''}</td></tr>)}</tbody></table>:<p className="workspace-empty">No funding evidence is stored for this organization.</p>}</section>;
}
