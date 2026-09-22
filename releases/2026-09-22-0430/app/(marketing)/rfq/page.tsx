"use client";

/* RFQ Engine — dynamic. Loads REAL products from the catalog API.
   No hardcoded SAMPLE_PRODUCTS, no fake bids. When no real supplier catalog is
   connected, shows an honest empty state with a path to connect sources. */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Gavel, Search, ArrowRight, Package, RefreshCw } from "lucide-react";

interface CatalogProduct {
  id: string; sku?: string; name: string; category?: string;
  unitPrice?: number; supplier?: { id?: string; name?: string } | null;
  minOrderQuantity?: number;
}

interface RealBid {
  supplier: string; unitPrice: number; deliveryDays: number; total: number;
}

interface BidPayload {
  supplier?: string; supplierName?: string; partnerName?: string;
  unitPrice?: number | string; price?: number | string;
  deliveryDays?: number; leadTimeDays?: number; total?: number | string;
}

export default function RfqPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [selectedId, setSelectedId] = useState("");
  const [qty, setQty] = useState(10);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [bids, setBids] = useState<RealBid[]>([]);
  const [msg, setMsg] = useState("");

  const loadCatalog = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/products?limit=50");
      const d: { data?: { products?: CatalogProduct[] } } = await res.json();
      const list: CatalogProduct[] = d?.data?.products ?? [];
      setProducts(list);
      if (list.length > 0) setSelectedId((prev) => prev || list[0].id);
    } catch {
      setError("Could not load the catalog right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/v1/products?limit=50");
        const d: { data?: { products?: CatalogProduct[] } } = await res.json();
        if (cancelled) return;
        const list: CatalogProduct[] = d?.data?.products ?? [];
        setProducts(list);
        if (list.length > 0) setSelectedId((prev) => prev || list[0].id);
      } catch {
        if (!cancelled) setError("Could not load the catalog right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const product = products.find((p) => p.id === selectedId) || null;
  const q = query.trim().toLowerCase();
  const visible = q ? products.filter((p) => p.name.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q) || (p.supplier?.name || "").toLowerCase().includes(q)) : products;

  // Hybrid mode: MOQ/stock-driven — above a bulk threshold we auction.
  const threshold = product?.minOrderQuantity && product.minOrderQuantity > 1 ? Math.max(20, product.minOrderQuantity * 2) : 50;
  const isRfq = !!product && qty >= threshold;

  async function submit() {
    if (!product) return;
    setStatus("submitting"); setMsg("");
    try {
      const res = await fetch("/api/v1/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          supplierId: product.supplier?.id || "",
          requestedQty: qty,
          supplierName: product.supplier?.name || "",
        }),
      });
      const d = await res.json();
      if (d.success) {
        // Only present bids actually returned by the engine (real auction flow).
        // If none returned, show the queued state rather than inventing prices.
        const returned = d?.data?.bids ?? d?.data?.quotes ?? [];
        if (Array.isArray(returned) && returned.length > 0) {
          setBids(returned.map((b: BidPayload) => ({
            supplier: b.supplier || b.supplierName || "Supplier",
            unitPrice: Number(b.unitPrice ?? b.price ?? 0),
            deliveryDays: Number(b.deliveryDays ?? b.leadTimeDays ?? 0),
            total: Number(b.total ?? 0),
          })).sort((a: RealBid, b: RealBid) => a.unitPrice - b.unitPrice));
        } else {
          setBids([]);
        }
        setStatus("done");
        setMsg(d.success === true ? d.data?.message || "RFQ created — suppliers notified." : "");
      } else {
        setStatus("error"); setMsg(d.error || "RFQ submission failed.");
      }
    } catch {
      setStatus("error"); setMsg("Network error — could not reach the RFQ API.");
    }
  }

  return (
    <main className="bg-slate-50 min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
        <header className="mb-8">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[#8a6d3b] flex items-center gap-1.5">
            <Gavel size={13} /> Hybrid RFQ Engine
          </div>
          <h1 className="text-3xl font-bold text-[#111827] mt-1">Buy fixed, or auction a bulk quote</h1>
          <p className="text-slate-600 text-sm mt-2 max-w-2xl">
            Browse real supplier catalog. Below the bulk threshold you get instant checkout pricing; above it, the request is auctioned to suppliers and their real bids return here.
          </p>
        </header>

        {/* Feedback banner */}
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Could not load the catalog. <button onClick={loadCatalog} className="inline-flex items-center gap-1 font-semibold underline"><RefreshCw size={12} /> Retry</button></div>}

        {/* Empty / dynamic state */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-400 text-sm">Loading real catalog…</div>
        ) : products.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center">
            <Package size={30} className="mx-auto text-slate-300 mb-3" />
            <h2 className="text-lg font-bold text-[#111827]">No supplier catalog connected yet</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              The RFQ engine needs real supplier stock to quote against. This page shows live catalog only — connect a supplier portal or API key, or onboard as a vendor, to activate bulk auctioning.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/register?type=supplier" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#314B43] text-white text-sm font-semibold rounded-lg hover:bg-[#3a544a]">
                Join as Supplier <ArrowRight size={14} />
              </Link>
              <Link href="/marketplace" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50">
                Browse marketplace
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Product select (real) */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-[#111827] mb-3">1. Select product</h2>
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search real catalog…"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#314B43] outline-none" />
              </div>
              <div className="space-y-2 max-h-80 overflow-auto">
                {visible.slice(0, 30).map((p) => (
                  <button key={p.id} onClick={() => { setSelectedId(p.id); setStatus("idle"); setBids([]); }}
                    className={`w-full text-left p-3 rounded border transition-colors ${selectedId === p.id ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                    <div className="text-sm font-medium text-slate-900">{p.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{p.category || "Catalog"} · {p.supplier?.name || "Verified Supplier"}</div>
                  </button>
                ))}
                {visible.length === 0 && <div className="text-xs text-slate-400 text-center py-6">No items match {`"${query}"`}.</div>}
              </div>
            </div>

            {/* Configure */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-[#111827] mb-3">2. Configure order</h2>
              {product ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1.5">Quantity</label>
                    <input type="number" min={1} value={qty} onChange={(e) => { setQty(Number(e.target.value) || 0); setStatus("idle"); }}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#314B43] outline-none" />
                  </div>
                  <div className="text-xs text-slate-500">Unit pricing: <span className="font-semibold text-[#111827]">EGP {product.unitPrice ?? "—"}</span> · Bulk auction at qty ≥ {threshold}</div>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${isRfq ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"}`}>
                    {isRfq ? "RFQ auction mode" : "Instant fixed checkout"}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-400">Select a product to configure.</div>
              )}
              <button onClick={submit} disabled={!product || status === "submitting"}
                className="w-full mt-5 py-3 rounded-lg bg-[#314B43] text-white text-sm font-semibold hover:bg-[#3a544a] disabled:opacity-40 transition-colors">
                {status === "submitting" ? "Sending…" : isRfq ? "Auction Request →" : "Request Quote"}
              </button>
              {msg && <div className="mt-2 text-xs text-emerald-700">{msg}</div>}
              {status === "error" && <div className="mt-2 text-xs text-red-600">{msg}</div>}
            </div>

            {/* Real bids */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-[#111827] mb-3">3. Supplier bids</h2>
              {status === "done" && bids.length > 0 ? (
                <div className="space-y-2">
                  {bids.map((b, i) => (
                    <div key={i} className="border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{b.supplier}</div>
                        <div className="text-[11px] text-slate-500">{b.deliveryDays} day delivery</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-[#111827] tabular-nums">EGP {b.unitPrice.toLocaleString()}</div>
                        <div className="text-[11px] text-slate-400">total EGP {b.total.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : status === "done" ? (
                <div className="text-sm text-slate-500 py-6 text-center">RFQ created. Suppliers are being notified — real bids will appear here as they respond.</div>
              ) : (
                <div className="text-sm text-slate-400 py-6 text-center">Bids from the live auction appear here.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
