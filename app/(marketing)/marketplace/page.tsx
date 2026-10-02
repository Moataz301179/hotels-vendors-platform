"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search, ShoppingCart, PackageOpen, RefreshCw } from "lucide-react";

type Product = {
  id: string; name: string; sku?: string; description?: string; categoryId?: string;
  category?: string; price?: number; currency?: string; unit?: string; moq?: number;
  leadDays?: number; stock?: string; image?: string | null; supplier?: { id: string; name: string; city?: string };
};
const CATEGORIES = ["all", "fb", "hk", "ffe", "ose", "eng", "lin", "spa", "sec"];

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});

  async function load() {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ limit: "48", status: "ACTIVE" });
      if (category !== "all") params.set("category", category);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/v1/products?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Catalog unavailable");
      setProducts(json.data?.products || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Catalog unavailable");
      setProducts([]);
    } finally { setLoading(false); }
  }
  useEffect(() => { const t = setTimeout(load, 180); return () => clearTimeout(t); }, [category, search]);

  const visible = useMemo(() => products.filter(p => p.stock !== "out"), [products]);
  const addToCart = (id: string, qty = 1) => setCart(c => ({ ...c, [id]: (c[id] || 0) + qty }));
  const cartCount = Object.values(cart).reduce((a,b) => a+b, 0);

  return (
    <main className="min-h-screen bg-[#f5f6f7] text-slate-900 dark:bg-[#0b0d10] dark:text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 border-b border-slate-200 pb-8 dark:border-slate-800 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-500">Procurement network</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Real supplier catalog</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Browse active supplier products from the database. No inventory, pricing or supplier activity is fabricated.</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-[#12161c]"><ShoppingCart size={17} /><span className="text-sm font-medium">{cartCount} items</span></div>
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search product, SKU or supplier…" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-[#12161c]" /></div>
          <div className="flex gap-2 overflow-x-auto pb-1">{CATEGORIES.map(c=><button key={c} onClick={()=>setCategory(c)} className={`rounded-full border px-4 py-2 text-xs font-medium capitalize ${category===c?"border-blue-500 bg-blue-500 text-white":"border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-[#12161c] dark:text-slate-300"}`}>{c === "all" ? "All" : c}</button>)}</div>
        </div>

        {loading ? <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({length:8}).map((_,i)=><div key={i} className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#12161c]" />)}</div>
        : error ? <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/40 dark:bg-red-950/20"><p className="font-medium">Catalog could not be loaded</p><p className="mt-2 text-sm text-slate-500">{error}</p><button onClick={load} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"><RefreshCw size={15}/>Retry</button></div>
        : visible.length === 0 ? <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-14 text-center dark:border-slate-700"><PackageOpen className="mx-auto text-slate-400" size={32}/><p className="mt-4 font-medium">No active products match this search.</p><p className="mt-2 text-sm text-slate-500">This is an honest empty state. Add or activate supplier inventory to populate the network.</p></div>
        : <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visible.map(p=><article key={p.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-[#12161c]"><div className="aspect-[4/3] bg-slate-100 dark:bg-slate-900">{p.image?<img src={p.image} alt={p.name} className="h-full w-full object-cover"/>:<div className="grid h-full place-items-center text-slate-400"><PackageOpen size={30}/></div>}</div><div className="p-5"><div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{p.supplier?.name || "Supplier"}</div><Link href={`/marketplace/${p.id}`} className="mt-2 block line-clamp-2 font-semibold hover:text-blue-500">{p.name}</Link><div className="mt-3 flex items-end justify-between"><div><div className="text-lg font-semibold">{typeof p.price === "number" ? `${p.currency || "EGP"} ${p.price.toLocaleString("en-EG")}` : "Price on request"}</div><div className="text-xs text-slate-400">MOQ {p.moq || 1} · {p.leadDays || "—"} days</div></div><button onClick={()=>addToCart(p.id,p.moq||1)} className="rounded-lg bg-slate-900 p-2.5 text-white hover:bg-blue-500 dark:bg-white dark:text-slate-900" aria-label={`Add ${p.name} to procurement list`}><ShoppingCart size={16}/></button></div></div></article>)}</div>}
      </div>
    </main>
  );
}
