"use client";

import Link from "next/link";
import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Search, ShoppingCart, FileCheck, Shield, Clock, Banknote, Upload, BarChart3, Package, X, Loader2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  unitPrice: number | null;
  basePrice?: number | null;
  pricingMode?: "FIXED" | "RFQ" | "HYBRID" | string;
  rfqThresholdQty?: number | null;
  unitOfMeasure: string;
  images?: string[] | string | null;
  currency?: string;
  stockQuantity?: number;
  minOrderQty?: number;
  supplierName?: string;
  supplierCity?: string;
  supplierTier?: string;
  supplierRating?: number;
  supplierReviewCount?: number;
  listingKind?: "SUPPLIER_OFFER" | "MARKET_REFERENCE" | string;
  sourceCount?: number;
  imageRightsStatus?: string | null;
}

const categories = [
  { name: "F&B", code: "fb", desc: "Food, beverages, kitchen equipment", color: "var(--accent-base)", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop" },
  { name: "Consumables", code: "ose", desc: "Housekeeping, chemicals, linens, toiletries", color: "var(--accent-base)", image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&h=300&fit=crop" },
  { name: "Guest Supplies", code: "gra", desc: "Amenities, room accessories, FF&E", color: "var(--accent-base)", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop" },
  { name: "FF&E", code: "ffe", desc: "Furniture, fixtures, capital equipment", color: "var(--accent-base)", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop" },
];

const supplierFeatures = [
  { icon: Upload, title: "Supplier offers", desc: "Publish verified products with fixed-price or quote-based terms and clear quantities." },
  { icon: ShoppingCart, title: "Hotel quote requests", desc: "Respond to relevant hotel procurement requests and confirm fulfillment directly with the buyer." },
  { icon: Banknote, title: "External finance referrals", desc: "Eligible businesses can connect with independent funders. Each funder decides approval and terms." },
  { icon: FileCheck, title: "Traceable purchasing", desc: "Keep supplier, product and purchasing details connected to the decision." },
  { icon: BarChart3, title: "Opportunity insights", desc: "Understand price, quantity and delivery terms before committing to a purchase." },
  { icon: Shield, title: "Verified Badge", desc: "Complete KYC and get the verified supplier badge." },
];

function formatPrice(price: number | null | undefined): string {
  if (price == null || !Number.isFinite(price)) return "Request quote";
  return "EGP " + price.toLocaleString("en-EG");
}

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const [catalogueCounts, setCatalogueCounts] = useState({ verifiedSupplierListings: 0, marketReferences: 0 });

  useEffect(() => {
    const controller = new AbortController();
    async function fetchProducts() {
      setLoading(true);
      setLoadError(false);
      try {
        const res = await fetch("/api/v1/products?limit=100", { signal: controller.signal });
        if (!res.ok) throw new Error("Catalogue request failed");
        const json = await res.json();
        const rows = json.data?.products ?? json.data?.data;
        if (!json.success || !Array.isArray(rows) || !rows.every((row) =>
          row && typeof row.id === "string" && typeof row.name === "string" && typeof row.category === "string"
        )) throw new Error("Catalogue response unavailable");
        if (!controller.signal.aborted) {
          setProducts(rows);
          setCatalogueCounts({
            verifiedSupplierListings: Number(json.data?.counts?.verifiedSupplierListings ?? 0),
            marketReferences: Number(json.data?.counts?.marketReferences ?? 0),
          });
        }
      } catch {
        if (!controller.signal.aborted) {
          setProducts([]);
          setLoadError(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void fetchProducts();
    return () => controller.abort();
  }, [requestVersion]);

  const q = query.trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        (p.supplierName && p.supplierName.toLowerCase().includes(q))
    );
  }, [q, products]);

  const filteredCategories = useMemo(() => {
    if (!q) return categories;
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.includes(q) || c.desc.toLowerCase().includes(q)
    );
  }, [q]);

  const hasResults = filteredProducts.length > 0 || filteredCategories.length > 0;

  return (
    <div className="marketplace-root" style={{ backgroundColor: "var(--background)", color: "var(--text-primary)", minHeight: "100vh" }}>
      {/* Hero */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(152,214,64,0.05) 0%, transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-[0.15em] mb-3 block">Hospitality opportunity network</span>
          <h1 className="text-[clamp(30px,5vw,52px)] font-medium leading-[1.05] tracking-tight mb-5 text-[var(--text-primary)]">
            Find value before<br />you buy. <span style={{ color: "var(--signal)" }}>Act on evidence.</span>
          </h1>
          <p className="text-[15px] text-[var(--text-secondary)] max-w-2xl leading-relaxed mb-8">
            HotelsVendors&apos; Virtual Shadow helps hotels discover relevant supplier opportunities, compare purchasing terms and identify potential savings. Suppliers remain the sellers; HotelsVendors helps the right opportunity reach the right buyer.
          </p>
          <div className="max-w-2xl mb-8">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products, suppliers, or categories..."
                  aria-label="Search supplier listings"
                  className="w-full pl-11 pr-10 py-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-accent-base/60 transition-all"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            {query && (
              <p className="text-[12px] text-[var(--text-secondary)] mt-3">
                {hasResults ? (
                  <>Showing results for <span className="text-accent-base font-medium">&ldquo;{query}&rdquo;</span></>
                ) : (
                  <>No matches for <span className="text-[var(--text-primary)] font-medium">&ldquo;{query}&rdquo;</span></>
                )}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:shadow-[0_0_30px_rgba(152,214,64,0.18)]" style={{ backgroundColor: "var(--signal)", color: "#1D1D1F" }}>Choose supplier registration <ArrowRight size={14} /></Link>
            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:bg-[var(--surface)]" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>Discuss your hotel&apos;s sourcing needs</Link>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-7 border-y" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { icon: Shield, label: loading ? "Checking supplier listings" : loadError ? "Catalogue temporarily unavailable" : `${catalogueCounts.verifiedSupplierListings || products.filter((product) => product.listingKind !== "MARKET_REFERENCE").length} verified listings`, desc: "Live supplier data only" },
              { icon: Package, label: loading ? "Checking market references" : loadError ? "Market references unavailable" : `${catalogueCounts.marketReferences} market references`, desc: "Real source evidence · quote required" },
              { icon: Clock, label: "Price & quantity terms", desc: "Compare before committing" },
              { icon: FileCheck, label: "Quote-ready purchasing", desc: "Fixed price or RFQ where supported" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <b.icon size={16} style={{ color: "var(--accent-base)" }} />
                <div>
                  <p className="text-[11px] font-medium text-[var(--text-primary)]">{b.label}</p>
                  <p className="text-[9px] text-[var(--text-muted)]">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(152,214,64,0.06) 0%, transparent 60%)" }} />
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-[0.15em] mb-2">Market references and supplier opportunities</h2>
              <p className="text-[13px] text-[var(--text-secondary)]">Verified supplier offers and real market references. A market reference is not an onboarded supplier offer; it remains quote-only until a supplier confirms terms.</p>
            </div>
          </div>
          {loading ? (
            <div role="status" className="flex items-center justify-center gap-3 py-16">
              <Loader2 aria-hidden="true" size={24} className="animate-spin" style={{ color: "var(--accent-base)" }} />
              <span>Loading verified supplier listings…</span>
            </div>
          ) : loadError ? (
            <div role="alert" className="rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-lg font-medium mb-2">We couldn&apos;t load the catalogue.</h3>
              <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>This is a loading problem, not confirmation that no supplier listings exist. Try again or contact us about your sourcing needs.</p>
              <div className="flex flex-wrap gap-4 items-center">
                <button type="button" onClick={() => setRequestVersion((version) => version + 1)} className="rounded-xl px-5 py-3 font-medium" style={{ backgroundColor: "var(--signal)", color: "#1D1D1F" }}>Try again</button>
                <Link href="/contact" className="underline underline-offset-4">Contact HotelsVendors</Link>
              </div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.slice(0, 24).map((p) => (
                <Link key={p.id} href={`/marketplace/${encodeURIComponent(p.id)}`} aria-label={p.listingKind === "MARKET_REFERENCE" ? `View ${p.name} market reference` : `View ${p.name} supplier terms`} className="group rounded-2xl overflow-hidden border transition-all hover:border-[var(--signal)] hover:-translate-y-0.5" style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}>
                  <div className="relative h-32 overflow-hidden">
                    {(Array.isArray(p.images) ? p.images[0] : p.images) ? (
                      <img src={(Array.isArray(p.images) ? p.images[0] : p.images) as string} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--surface), var(--background))" }}><Package size={30} strokeWidth={1.4} style={{ color: "var(--secondary)" }} /></div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: p.listingKind === "MARKET_REFERENCE" ? "rgba(255,255,255,0.12)" : "rgba(152,214,64,0.14)", color: p.listingKind === "MARKET_REFERENCE" ? "var(--text-secondary)" : "var(--accent-base)" }}>{p.listingKind === "MARKET_REFERENCE" ? "Market reference" : p.category.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="text-[13px] font-medium text-[var(--text-primary)] mb-1 leading-tight line-clamp-2">{p.name}</h4>
                    <p className="text-[11px] text-[var(--text-secondary)] mb-1.5">{p.listingKind === "MARKET_REFERENCE" ? "Supplier not onboarded" : (p.supplierName || "Supplier name unavailable")}{p.supplierCity ? ` · ${p.supplierCity}` : ""}</p>
                    <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>{p.unitPrice != null && p.pricingMode !== "RFQ" ? `${formatPrice(p.unitPrice)}/${p.unitOfMeasure}` : p.listingKind === "MARKET_REFERENCE" ? "RFQ required · price not published" : "Request supplier quote"}</p>
                    {p.listingKind === "MARKET_REFERENCE" && p.sourceCount ? <p className="mt-2 text-[10px] text-[var(--text-muted)]">{p.sourceCount} source observation{p.sourceCount === 1 ? "" : "s"} · image review pending</p> : null}
                    {p.basePrice != null && p.unitPrice != null && p.basePrice > p.unitPrice && <p className="mt-1 text-[10px] text-[var(--text-secondary)]">Below supplier reference price</p>}
                    {typeof p.stockQuantity === "number" && p.stockQuantity > 0 && <p className="mt-2 text-[10px] text-[var(--text-muted)]">{p.stockQuantity} reported available · minimum {p.minOrderQty ?? 1} {p.unitOfMeasure}</p>}
                    <p className="mt-3 text-[10px] font-medium" style={{ color: "var(--text-secondary)" }}>{p.listingKind === "MARKET_REFERENCE" ? "View market reference" : "View supplier terms"} <ArrowRight size={11} className="inline" /></p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div role="status" className="rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-lg font-medium mb-2">{products.length > 0 ? "No listings match your search." : "No verified supplier listings are published yet."}</h3>
              <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>{products.length > 0 ? "Try another product, supplier or category, or clear your search." : "Only eligible, verified supplier listings appear here. Hotel buyers can contact us about sourcing needs; suppliers can start registration for review."}</p>
              <div className="flex flex-wrap gap-4 items-center">
                {query && <button type="button" onClick={() => setQuery("")} className="rounded-xl border px-5 py-3 font-medium" style={{ borderColor: "var(--border)" }}>Clear search</button>}
                <Link href="/contact" className="underline underline-offset-4">Discuss hotel sourcing needs</Link>
                <Link href="/register" className="underline underline-offset-4">Choose supplier registration</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-14" style={{ backgroundColor: "var(--surface)" }}>
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-[0.15em] mb-6">Browse by category</h2>
          {filteredCategories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredCategories.map((cat) => (
                <button type="button" key={cat.name} onClick={() => setQuery(cat.code)} className="w-full text-left group relative rounded-2xl overflow-hidden border transition-all hover:-translate-y-0.5 hover:border-[var(--signal)]" style={{ borderColor: "color-mix(in srgb, var(--signal) 35%, transparent)" }}>
                  <img src={cat.image} alt={cat.name} className="w-full h-32 object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--background), color-mix(in srgb, var(--background) 72%, transparent), transparent)" }} />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-[13px] font-semibold mb-0.5" style={{ color: cat.color }}>{cat.name}</h3>
                    <p className="text-[10px] text-[var(--text-secondary)] leading-tight">{cat.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[var(--text-muted)] py-8 text-center">No categories match your search.</p>
          )}
        </div>
      </section>

      {/* Supplier Features */}
      <section className="py-14" style={{ backgroundColor: "var(--surface)" }}>
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-[0.15em] mb-8 text-center">Built for better procurement decisions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supplierFeatures.map((f) => (
              <div key={f.title} className="rounded-2xl p-5 border transition-all hover:border-[var(--signal)]" style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}>
                <f.icon size={20} className="mb-4" style={{ color: "var(--accent-base)" }} />
                <h3 className="text-[14px] font-medium text-[var(--text-primary)] mb-2">{f.title}</h3>
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-[24px] font-medium mb-4 text-[var(--text-primary)]">Make your offer visible to the right hotels.</h2>
          <p className="text-[13px] text-[var(--text-secondary)] mb-8 max-w-lg mx-auto">Join the supplier network and reach hospitality buyers through relevant procurement opportunities.</p>
          <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-xl transition-all hover:shadow-[0_0_30px_rgba(152,214,64,0.18)]" style={{ backgroundColor: "var(--signal)", color: "#1D1D1F" }}>
            Choose supplier registration <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function MarketplaceClient() {
  return (
    <Suspense fallback={<div style={{ backgroundColor: "var(--background)", minHeight: "100vh" }} />}>
      <MarketplaceContent />
    </Suspense>
  );
}
