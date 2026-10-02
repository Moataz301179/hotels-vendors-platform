"use client";

import Link from "next/link";
import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Search, Filter, ShoppingCart, FileCheck, Truck, Shield, Clock, Banknote, Upload, BarChart3, Star, Package, X, Loader2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  unitPrice: number;
  unitOfMeasure: string;
  images?: string;
  supplier?: { id: string; name: string; city?: string; tier?: string };
}

const categories = [
  { name: "F&B", desc: "Food, beverages, kitchen equipment", color: "var(--accent-base)", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop" },
  { name: "Consumables", desc: "Housekeeping, chemicals, linens, toiletries", color: "var(--accent-base)", image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&h=300&fit=crop" },
  { name: "Guest Supplies", desc: "Amenities, room accessories, FF&E", color: "#64b5f6", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop" },
  { name: "FF&E", desc: "Furniture, fixtures, capital equipment", color: "var(--orange-base)", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop" },
];

const supplierFeatures = [
  { icon: Upload, title: "Catalog Upload", desc: "Upload your catalog with fixed prices. Set per-hotel or per-group pricing." },
  { icon: ShoppingCart, title: "PO Matching", desc: "Receive purchase orders directly from hotel procurement teams." },
  { icon: Banknote, title: "24-Hour Payment", desc: "Get paid in 24 hours via embedded factoring." },
  { icon: FileCheck, title: "ETA Invoicing", desc: "Every invoice is auto-generated with RSA-2048 signing and UUID tracking." },
  { icon: BarChart3, title: "Sales Analytics", desc: "Track orders, revenue, and buyer behavior across properties." },
  { icon: Shield, title: "Verified Badge", desc: "Complete KYC and get the verified supplier badge." },
];

function formatPrice(price: number): string {
  return "EGP " + price.toLocaleString("en-EG");
}

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/v1/products?limit=100");
        const json = await res.json();
        if (json.success && json.data?.data) {
          setProducts(json.data.data);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const q = query.trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        (p.supplier?.name && p.supplier.name.toLowerCase().includes(q))
    );
  }, [q, products]);

  const filteredCategories = useMemo(() => {
    if (!q) return categories;
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
    );
  }, [q]);

  const hasResults = filteredProducts.length > 0 || filteredCategories.length > 0;

  return (
    <main style={{ backgroundColor: "#0c0c12", color: "#ffffff", minHeight: "100vh" }}>
      {/* Hero */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(var(--accent-base-rgb),0.03) 0%, transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <span className="text-[11px] font-medium text-white/30 uppercase tracking-[0.15em] mb-3 block">Marketplace</span>
          <h1 className="text-[clamp(30px,5vw,52px)] font-medium leading-[1.05] tracking-tight mb-5 text-white">
            {products.length}+ Products. Verified<br />Suppliers. <span className="text-white">Zero Collection Chases.</span>
          </h1>
          <p className="text-[15px] text-white/40 max-w-2xl leading-relaxed mb-8">
            Egypt&apos;s largest hospitality procurement catalog. Fixed-price listings, ETA-compliant invoicing, and 24-hour settlement via embedded factoring. Built for suppliers who are done waiting 90 days to get paid.
          </p>
          <div className="max-w-2xl mb-8">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products, suppliers, or categories..."
                  className="w-full pl-11 pr-10 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-white/20 outline-none focus:border-accent-base/60 transition-all"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            {query && (
              <p className="text-[12px] text-white/40 mt-3">
                {hasResults ? (
                  <>Showing results for <span className="text-accent-base font-medium">&ldquo;{query}&rdquo;</span></>
                ) : (
                  <>No matches for <span className="text-white font-medium">&ldquo;{query}&rdquo;</span></>
                )}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/register?sector=procurement" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:shadow-[0_0_30px_rgba(var(--accent-base-rgb),0.2)]" style={{ backgroundColor: "var(--accent-base)", color: "var(--surface)" }}>Start Selling <ArrowRight size={14} /></Link>
            <Link href="/register?sector=procurement" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:bg-white/[0.04]" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>Register as Buyer</Link>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-8 border-y" style={{ borderColor: "rgba(255,255,255,0.04)", backgroundColor: "#12121a" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { icon: Shield, label: `${products.length}+ Products`, desc: "Live in catalog" },
              { icon: Clock, label: "24-Hour Settlement", desc: "Via embedded factoring" },
              { icon: FileCheck, label: "ETA Compliant", desc: "Auto-generated invoices" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <b.icon size={16} style={{ color: "var(--accent-base)" }} />
                <div>
                  <p className="text-[11px] font-medium text-white/60">{b.label}</p>
                  <p className="text-[9px] text-white/25">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(var(--accent-base-rgb),0.04) 0%, transparent 60%)" }} />
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-[11px] font-medium text-white/30 uppercase tracking-[0.15em] mb-2">Products</h2>
              <p className="text-[13px] text-white/40">Browse our catalog of hospitality products</p>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-base)" }} />
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.slice(0, 24).map((p) => (
                <div key={p.id} className="group rounded-xl overflow-hidden border transition-all hover:border-white/20 hover:scale-[1.02] cursor-pointer" style={{ backgroundColor: "#12121a", borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="relative h-32 overflow-hidden">
                    <img src={(Array.isArray(p.images) ? p.images[0] : p.images) || "https://images.unsplash.com/photo-1585670149967-b4f4da88cc9f?w=400"} alt={p.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500" />
                    <div className="absolute top-2 left-2">
                      <span className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(var(--accent-base-rgb),0.15)", color: "var(--accent-base)" }}>{p.category.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="text-[11px] font-medium text-white mb-1 leading-tight line-clamp-2">{p.name}</h4>
                    <p className="text-[10px] text-white/30 mb-1.5">{p.supplier?.name || "Verified Supplier"}</p>
                    <p className="text-[12px] font-semibold text-accent-base">{formatPrice(p.unitPrice)}/{p.unitOfMeasure}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-white/30 py-8 text-center">No products match your search.</p>
          )}
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-16" style={{ backgroundColor: "#12121a" }}>
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-[11px] font-medium text-white/30 uppercase tracking-[0.15em] mb-6">Product Categories</h2>
          {filteredCategories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredCategories.map((cat) => (
                <div key={cat.name} className="group relative rounded-xl overflow-hidden border cursor-pointer transition-all hover:scale-[1.02] hover:border-white/20" style={{ borderColor: `${cat.color}33` }}>
                  <img src={cat.image} alt={cat.name} className="w-full h-32 object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c12] via-[#0c0c12]/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-[13px] font-semibold mb-0.5" style={{ color: cat.color }}>{cat.name}</h3>
                    <p className="text-[10px] text-white/30 leading-tight">{cat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-white/30 py-8 text-center">No categories match your search.</p>
          )}
        </div>
      </section>

      {/* Supplier Features */}
      <section className="py-16" style={{ backgroundColor: "#12121a" }}>
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-[11px] font-medium text-white/30 uppercase tracking-[0.15em] mb-8 text-center">Why Suppliers Choose HotelsVendors</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supplierFeatures.map((f) => (
              <div key={f.title} className="rounded-xl p-6 transition-all hover:border-accent-base/20" style={{ backgroundColor: "#12121a", border: "1px solid rgba(255,255,255,0.06)" }}>
                <f.icon size={20} className="mb-4" style={{ color: "var(--accent-base)" }} />
                <h3 className="text-[14px] font-medium text-white mb-2">{f.title}</h3>
                <p className="text-[12px] text-white/35 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-[24px] font-medium mb-4 text-white">Ready to Sell to Egypt&apos;s Top Hotels?</h2>
          <p className="text-[13px] text-white/40 mb-8 max-w-lg mx-auto">Join our suppliers already transacting on HotelsVendors. Get paid in 24 hours, not 90.</p>
          <Link href="/register?sector=procurement" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:shadow-[0_0_30px_rgba(var(--accent-base-rgb),0.2)]" style={{ backgroundColor: "var(--accent-base)", color: "var(--surface)" }}>
            Register as Supplier <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function MarketplaceClient() {
  return (
    <Suspense fallback={<div style={{ backgroundColor: "#0c0c12", minHeight: "100vh" }} />}>
      <MarketplaceContent />
    </Suspense>
  );
}
