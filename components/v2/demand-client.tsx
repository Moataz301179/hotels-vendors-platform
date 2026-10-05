"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type Opportunity = {
  sku: string; productName: string; category: string; unitOfMeasure: string; hotelCount: number;
  requestedQuantity: number; pricedQuantity: number; unpricedQuantity: number; currency: string; currentSpend: number; weightedUnitPrice: number | null; deliveryFrom: string | null; deliveryTo: string | null;
  volumeDealSignal: "HIGH" | "MEDIUM" | "LOW";
};
type Payload = {
  data?: { demand: Opportunity[]; summary: { opportunities: number; aggregatedQuantity: number; spendByCurrency: Array<{currency:string;amount:number}>; highSignal: number } };
  error?: string;
};

export function DemandClient() {
  const [data, setData] = useState<Payload["data"]>();
  const [error, setError] = useState<string>();

  const [days,setDays]=useState(30),[minHotels,setMinHotels]=useState(2),[loading,setLoading]=useState(true);
  async function refresh(event:FormEvent){event.preventDefault();setLoading(true);setError(undefined);try{const response=await fetch(`/api/v2/demand?days=${days}&minHotels=${minHotels}`);const body=await response.json() as Payload;if(!response.ok||body.error)throw new Error(body.error||"Unable to load demand");setData(body.data)}catch(e){setError(e instanceof Error?e.message:"Unable to load demand")}finally{setLoading(false)}}
  useEffect(() => {
    fetch("/api/v2/demand?days=30&minHotels=2")
      .then(async (response) => {
        const body = (await response.json()) as Payload;
        if (!response.ok || body.error) throw new Error(body.error || "Unable to load demand");
        setData(body.data);
      })
      .catch((exception: Error) => setError(exception.message)).finally(()=>setLoading(false));
  }, []);

  return (
    <section className="demand-workspace">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] muted">HV Volume Deals / Organization demand</p>
        <h1 className="text-3xl font-semibold tracking-tight">Prepare your next volume negotiation.</h1>
        <p className="mt-2 max-w-3xl text-sm muted">
          Review recurring purchases across hotels in your organization. Use recorded volume to prepare supplier negotiations. A signal is not a quoted deal or verified saving.
        </p>
      </div>
      <form className="workspace-form" onSubmit={refresh} style={{margin:'24px 0'}}><label>Purchase history window<select value={days} onChange={e=>setDays(Number(e.target.value))}><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={180}>Last 180 days</option></select></label><label>Minimum hotels<input type="number" min={1} max={100} required value={minHotels} onChange={e=>setMinHotels(Number(e.target.value))}/></label><button className="btn btn-blue" disabled={loading}>{loading?'Loading…':'Refresh combined demand'}</button></form><p className="muted">These are historical purchasing volumes, not future commitments or published group deals. Independent organizations’ demand is not pooled by this screen.</p>
      {error && <div className="rounded-lg border p-4 text-sm text-destructive">{error}</div>}
      {!data && !error && <div className="h-32 animate-pulse rounded-lg border bg-muted/30" />}
      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Metric label="Comparable products" value={data.summary.opportunities} />
            <Metric label="Recorded units" value={data.summary.aggregatedQuantity.toLocaleString()} />
            <Metric label="Recorded spend" value={formatSpend(data.summary.spendByCurrency)} />
            <Metric label="High-volume signals" value={data.summary.highSignal} />
          </div>
          <section className="card" style={{marginTop:24,overflow:"auto"}}>
            <div className="border-b p-6"><h2 className="text-lg font-semibold">Demand signals ready for supplier negotiation</h2></div>
            <div className="overflow-x-auto p-2">
              <table className="table">
                <thead><tr className="border-b text-left muted">
                  <th className="px-3 py-3">Product</th><th className="px-3 py-3">Hotels</th><th className="px-3 py-3">Volume</th>
                  <th className="px-3 py-3">Avg. price</th><th className="px-3 py-3">Demand window</th><th className="px-3 py-3">Signal</th><th>Next action</th>
                </tr></thead>
                <tbody>{data.demand.map((item) => (
                  <tr key={item.sku + item.currency} className="border-b last:border-0">
                    <td className="px-3 py-4"><div className="font-medium">{item.productName}</div><div className="text-xs muted">{item.sku} · {item.category}</div></td>
                    <td className="px-3 py-4">{item.hotelCount}</td>
                    <td className="px-3 py-4">{item.requestedQuantity.toLocaleString()} {item.unitOfMeasure}</td>
                    <td className="px-3 py-4">{item.weightedUnitPrice === null ? "Price unavailable" : item.currency + " " + item.weightedUnitPrice.toLocaleString()}{item.unpricedQuantity > 0 && <small className="block muted">Based on {item.pricedQuantity.toLocaleString()} priced units</small>}</td>
                    <td className="px-3 py-4">{formatDate(item.deliveryFrom)}{item.deliveryTo ? " → " + formatDate(item.deliveryTo) : ""}</td>
                    <td className="px-3 py-4"><span className="rounded-full border px-2 py-1 text-xs font-medium">{item.volumeDealSignal}</span></td>
                    <td><Link className="btn btn-ghost" href={`/workspace/marketplace?product=${encodeURIComponent(item.productName)}`}>Compare supplier quotes</Link></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            {!data.demand.length && <p className="py-10 text-center text-sm muted">No shared demand signal yet. At least two hotels in your organization need recorded purchases of the same product. Other organizations’ demand remains private.</p>}
          </section>
        </>
      )}
    </section>
  );
}

function formatSpend(entries: Array<{currency:string;amount:number}>) { if (!entries.length) return "—"; return entries.map(({currency,amount}) => currency + " " + amount.toLocaleString()).join(" · "); }
function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="demand-metric"><div className="text-xs uppercase tracking-wider muted">{label}</div><div className="mt-2 text-2xl font-semibold">{value}</div></div>;
}
function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("en-EG", { day: "2-digit", month: "short" }) : "Flexible";
}
