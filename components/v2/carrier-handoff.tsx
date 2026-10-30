'use client';
import {useCallback,useEffect,useState} from 'react';
import {requestJson} from '@/lib/v2-http';

type Shipment={id:string;corridor:string;originHub:string;destinationHub:string;status:string;orderCount:number};

export function CarrierHandoff(){
 const [rows,setRows]=useState<Shipment[]|null>(null),[error,setError]=useState('');
 const load=useCallback(async()=>{setError('');setRows((await requestJson<{shipments:Shipment[]}>('/api/v2/shipments')).shipments)},[]);
 useEffect(()=>{let cancelled=false;load().catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:'Unable to load handoff records.')});return()=>{cancelled=true}},[load]);
 return <section className="card workspace-table-wrap" style={{padding:24}}>{error?<div className="workspace-status" role="alert">{error} <button className="btn btn-ghost" onClick={()=>void load().catch(e=>setError(e instanceof Error?e.message:'Unable to load handoff records.'))}>Retry</button></div>:rows===null?<p role="status">Loading handoff records…</p>:rows.length?<table className="table"><thead><tr><th>Corridor</th><th>Pickup</th><th>Destination</th><th>Status</th><th>Linked orders</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{row.corridor}</td><td>{row.originHub}</td><td>{row.destinationHub}</td><td>{row.status.replaceAll('_',' ')}</td><td>{row.orderCount}</td></tr>)}</tbody></table>:<p className="workspace-empty">No handoff records are stored for this carrier.</p>}</section>;
}
