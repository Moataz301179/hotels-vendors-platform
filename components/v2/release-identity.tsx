'use client';
import { useEffect, useState } from 'react';

type Health={ok?:boolean;sourceCommit?:string|null;releaseId?:string|null};

export function ReleaseIdentity(){
 const [health,setHealth]=useState<Health|null>(null),[failed,setFailed]=useState(false);
 useEffect(()=>{let cancelled=false;fetch('/api/health').then(response=>response.json()).then(body=>{if(!cancelled)setHealth(body as Health)}).catch(()=>{if(!cancelled)setFailed(true)});return()=>{cancelled=true}},[]);
 const commit=health?.sourceCommit||null;
 return <section className="card" style={{padding:24,marginTop:24}}><h2>Deployed release</h2><p className="muted">The commit reported by this running process. It does not show funder status or database drift.</p>{failed?<p role="status">Not recorded. The health check did not respond.</p>:!health?<p role="status">Loading the running commit…</p>:<p><strong>{commit??'Not recorded in this process.'}</strong></p>}{health?.releaseId?<p className="muted">{health.releaseId}</p>:null}</section>;
}
