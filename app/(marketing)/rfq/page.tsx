"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Clock3, FileSearch, Loader2, Search, ShieldCheck, X } from "lucide-react";

type ListingKind = "SUPPLIER_OFFER" | "MARKET_REFERENCE" | string;

interface CatalogProduct {
  id: string;
  sku?: string;
  name: string;
  description?: string | null;
  category?: string;
  subcategory?: string | null;
  unitPrice?: number | null;
  pricingMode?: "FIXED" | "RFQ" | "HYBRID" | string;
  rfqThresholdQty?: number | null;
  unitOfMeasure?: string;
  minOrderQty?: number;
  stockQuantity?: number;
  listingKind?: ListingKind;
  sourceCount?: number;
}

interface RfqStatus {
  id: string;
  status: string;
  matchingStatus: string;
  itemName: string | null;
  requestedQty: number;
  unitOfMeasure: string | null;
  deliveryTimeline: string | null;
  deliveryLocation: string | null;
  estimatedResponse: string | null;
  createdAt: string;
}

interface QuoteResponse {
  unitPrice?: number | string;
  price?: number | string;
  deliveryDays?: number;
  leadTimeDays?: number;
  total?: number | string;
}

function formatPrice(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? "Quote required" : `EGP ${value.toLocaleString("en-EG")}`;
}

function RfqContent() {
  const { isLoaded: authLoaded, isSignedIn } = useUser();
  const searchParams = useSearchParams();
  const requestedProductId = searchParams.get("productId") || "";
  const requestedCatalogItemId = searchParams.get("catalogItemId") || "";
  const requestedListingId = requestedProductId || requestedCatalogItemId;

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(requestedListingId);
  const [requestAnything, setRequestAnything] = useState(false);
  const [itemName, setItemName] = useState("");
  const [qty, setQty] = useState(1);
  const [unitOfMeasure, setUnitOfMeasure] = useState("unit");
  const [deliveryTimeline, setDeliveryTimeline] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [specialReq, setSpecialReq] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "submitted" | "error">("idle");
  const [statusError, setStatusError] = useState("");
  const [submitted, setSubmitted] = useState<RfqStatus | null>(null);
  const [quoteResponses, setQuoteResponses] = useState<QuoteResponse[]>([]);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/v1/products?limit=100", { cache: "no-store" });
      const json = await response.json();
      const list = json?.success && Array.isArray(json.data?.products) ? json.data.products : [];
      if (!response.ok || !json?.success) throw new Error(json?.error || "Catalogue unavailable");
      setProducts(list);
      const requested = list.find((item: CatalogProduct) => item.id === requestedListingId);
      if (requested) {
        setSelectedId(requested.id);
        setRequestAnything(false);
        setUnitOfMeasure(requested.unitOfMeasure || "unit");
        setQty(Math.max(1, requested.minOrderQty || 1));
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load the catalogue right now.");
    } finally {
      setLoading(false);
    }
  }, [requestedListingId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadCatalog(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCatalog]);

  const product = products.find((entry) => entry.id === selectedId) || null;
  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((entry) =>
      [entry.name, entry.description, entry.category, entry.subcategory]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized)),
    );
  }, [products, query]);

  const productNeedsRfq = !!product && (product.listingKind === "MARKET_REFERENCE" || product.pricingMode === "RFQ" || product.unitPrice == null || (product.pricingMode === "HYBRID" && product.rfqThresholdQty != null && qty >= product.rfqThresholdQty));
  const canSubmit = requestAnything ? itemName.trim().length >= 2 && qty > 0 : !!product && productNeedsRfq && qty > 0;

  function selectProduct(next: CatalogProduct) {
    setSelectedId(next.id);
    setRequestAnything(false);
    setStatus("idle");
    setSubmitted(null);
    setStatusError("");
    setQuoteResponses([]);
    setUnitOfMeasure(next.unitOfMeasure || "unit");
    setQty(Math.max(1, next.minOrderQty || 1));
  }

  async function submit() {
    if (!canSubmit || status === "submitting") return;
    if (!authLoaded) return;
    if (!isSignedIn) {
      const next = requestAnything
        ? "/rfq"
        : `/rfq?${product?.listingKind === "MARKET_REFERENCE" ? "catalogItemId" : "productId"}=${encodeURIComponent(selectedId)}`;
      window.location.assign(`/login?redirect_url=${encodeURIComponent(next)}`);
      return;
    }

    setStatus("submitting");
    setStatusError("");
    try {
      const response = await fetch("/api/v1/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(requestAnything
            ? { itemName: itemName.trim() }
            : product?.listingKind === "MARKET_REFERENCE"
              ? { catalogItemId: product.id }
              : { productId: product?.id }),
          requestedQty: qty,
          unitOfMeasure: unitOfMeasure.trim() || undefined,
          deliveryTimeline: deliveryTimeline.trim() || undefined,
          deliveryLocation: deliveryLocation.trim() || undefined,
          specialReq: specialReq.trim() || undefined,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json?.success) throw new Error(json?.error || "The request could not be submitted");
      setSubmitted(json.data?.rfq || null);
      const returnedQuotes = Array.isArray(json.data?.quotes) ? json.data.quotes : [];
      setQuoteResponses(returnedQuotes);
      setStatus("submitted");
    } catch (error) {
      setStatus("error");
      setStatusError(error instanceof Error ? error.message : "The request could not be submitted.");
    }
  }

  return (
    <main className="min-h-screen pt-20 pb-16" style={{ backgroundColor: "var(--background)", color: "var(--text-primary)" }}>
      <div className="mx-auto max-w-6xl px-5 lg:px-8 py-10">
        <header className="mb-8 max-w-3xl">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-secondary)" }}>
            <FileSearch size={14} /> Hotel sourcing request
          </div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Tell us what the hotel needs.</h1>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Choose a real market reference, or describe anything that is missing. We route the request to relevant sources and return real supplier responses—no invented prices and no supplier contact details at this stage.
          </p>
        </header>

        {loadError && (
          <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <span>Catalogue search is unavailable, but you can still request anything.</span>
            <button type="button" onClick={() => void loadCatalog()} className="inline-flex items-center gap-2 font-semibold underline underline-offset-4">Retry catalogue</button>
          </div>
        )}

        {status === "submitted" && submitted ? (
          <section aria-live="polite" className="rounded-2xl border p-7" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: "var(--border)", color: "var(--accent-base)" }}>
                  <CheckCircle2 size={14} /> Request received
                </div>
                <h2 className="text-2xl font-semibold">We are matching sources for {submitted.itemName || "your requirement"}.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Your request is queued for relevant verified offers and approved market sources. Supplier identity stays private until the permitted fulfillment stage.
                </p>
              </div>
              <div className="rounded-xl border px-4 py-3 text-right" style={{ borderColor: "var(--border)" }}>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Request</p>
                <p className="font-mono text-sm">{submitted.id}</p>
              </div>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                ["Status", "Matching in progress"],
                ["Quantity", `${submitted.requestedQty} ${submitted.unitOfMeasure || "unit"}`],
                ["Expected response", submitted.estimatedResponse || "When suppliers respond"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--border)" }}>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</p>
                  <p className="mt-1 text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>
            {quoteResponses.length > 0 && (
              <div className="mt-7 rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                <p className="mb-3 text-sm font-semibold">Real responses received</p>
                <div className="space-y-2">
                  {quoteResponses.map((quote, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg border px-3 py-2" style={{ borderColor: "var(--border)" }}>
                      <span className="text-sm">Offer {index + 1}</span>
                      <span className="text-sm font-semibold">{formatPrice(Number(quote.unitPrice ?? quote.price ?? NaN))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={() => { setStatus("idle"); setSubmitted(null); setItemName(""); setSpecialReq(""); }} className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold" style={{ backgroundColor: "var(--signal)", color: "#1D1D1F" }}>Start another request <ArrowRight size={15} /></button>
              <Link href="/marketplace" className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>Back to catalogue</Link>
            </div>
          </section>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr_0.85fr]">
            <section className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">1. Find an item</h2>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{loading ? "Loading" : `${products.length} available`}</span>
              </div>
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product or category" aria-label="Search products" className="w-full rounded-xl border py-3 pl-9 pr-9 text-sm outline-none" style={{ borderColor: "var(--border)", backgroundColor: "var(--background)", color: "var(--text-primary)" }} />
                {query && <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Clear search"><X size={14} /></button>}
              </div>
              <button type="button" onClick={() => { setRequestAnything(true); setSelectedId(""); setStatus("idle"); }} className={`mb-3 w-full rounded-xl border p-3 text-left transition-colors ${requestAnything ? "ring-2 ring-[var(--signal)]" : ""}`} style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}>
                <div className="flex items-center gap-2 text-sm font-semibold"><Search size={15} /> Request anything</div>
                <p className="mt-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>Not listed? Describe it and we will source it.</p>
              </button>
              <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
                {loading ? (
                  <div role="status" className="flex items-center justify-center gap-2 py-10 text-sm" style={{ color: "var(--text-muted)" }}><Loader2 size={16} className="animate-spin" /> Loading real catalogue…</div>
                ) : visibleProducts.length === 0 ? (
                  <div className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>No matching item. Use Request anything above.</div>
                ) : visibleProducts.slice(0, 60).map((entry) => (
                  <button key={entry.id} type="button" onClick={() => selectProduct(entry)} className={`w-full rounded-xl border p-3 text-left transition-colors ${selectedId === entry.id && !requestAnything ? "ring-2 ring-[var(--signal)]" : ""}`} style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold leading-tight">{entry.name}</span>
                      {entry.listingKind === "SUPPLIER_OFFER" ? <ShieldCheck size={14} style={{ color: "var(--accent-base)" }} aria-label="Verified supplier offer" /> : <FileSearch size={14} style={{ color: "var(--text-muted)" }} aria-label="Market reference" />}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
                      <span>{entry.category || "Hotel supply"}</span>
                      <span>·</span>
                      <span>{entry.listingKind === "SUPPLIER_OFFER" ? "Verified offer" : "Market reference · quote required"}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
              <h2 className="mb-3 text-sm font-semibold">2. Set the requirement</h2>
              {requestAnything ? (
                <label className="mb-4 block text-xs" style={{ color: "var(--text-secondary)" }}>
                  What do you need?
                  <input value={itemName} onChange={(event) => setItemName(event.target.value)} placeholder="e.g. 20 kg butter, hotel grade" className="mt-1.5 w-full rounded-xl border px-3 py-3 text-sm outline-none" style={{ borderColor: "var(--border)", backgroundColor: "var(--background)", color: "var(--text-primary)" }} />
                </label>
              ) : product ? (
                <div className="mb-4 rounded-xl border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}>
                  <p className="text-sm font-semibold">{product.name}</p>
                  <p className="mt-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>{product.listingKind === "MARKET_REFERENCE" ? "Real market reference · public price not published" : productNeedsRfq ? "Supplier quote required for this quantity or listing" : `Published supplier price: ${formatPrice(product.unitPrice)}`}</p>
                </div>
              ) : (
                <div className="mb-4 rounded-xl border border-dashed p-5 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>Choose an item or request anything.</div>
              )}

              <div className="grid grid-cols-[1fr_110px] gap-3">
                <label className="block text-xs" style={{ color: "var(--text-secondary)" }}>Quantity<input type="number" min={1} max={1000000} value={qty} onChange={(event) => setQty(Math.max(1, Number(event.target.value) || 1))} className="mt-1.5 w-full rounded-xl border px-3 py-3 text-sm outline-none" style={{ borderColor: "var(--border)", backgroundColor: "var(--background)", color: "var(--text-primary)" }} /></label>
                <label className="block text-xs" style={{ color: "var(--text-secondary)" }}>Unit<input value={unitOfMeasure} onChange={(event) => setUnitOfMeasure(event.target.value)} placeholder="unit" className="mt-1.5 w-full rounded-xl border px-3 py-3 text-sm outline-none" style={{ borderColor: "var(--border)", backgroundColor: "var(--background)", color: "var(--text-primary)" }} /></label>
              </div>
              <label className="mt-4 block text-xs" style={{ color: "var(--text-secondary)" }}>Delivery timing<input value={deliveryTimeline} onChange={(event) => setDeliveryTimeline(event.target.value)} placeholder="e.g. within 7 days" className="mt-1.5 w-full rounded-xl border px-3 py-3 text-sm outline-none" style={{ borderColor: "var(--border)", backgroundColor: "var(--background)", color: "var(--text-primary)" }} /></label>
              <label className="mt-4 block text-xs" style={{ color: "var(--text-secondary)" }}>Delivery location<input value={deliveryLocation} onChange={(event) => setDeliveryLocation(event.target.value)} placeholder="Hotel/property or city" className="mt-1.5 w-full rounded-xl border px-3 py-3 text-sm outline-none" style={{ borderColor: "var(--border)", backgroundColor: "var(--background)", color: "var(--text-primary)" }} /></label>
              <label className="mt-4 block text-xs" style={{ color: "var(--text-secondary)" }}>Specifications or notes<span className="ml-1 text-[10px]" style={{ color: "var(--text-muted)" }}>(optional)</span><textarea value={specialReq} onChange={(event) => setSpecialReq(event.target.value)} rows={3} placeholder="Brand, pack size, quality, or substitution rules" className="mt-1.5 w-full resize-none rounded-xl border px-3 py-3 text-sm outline-none" style={{ borderColor: "var(--border)", backgroundColor: "var(--background)", color: "var(--text-primary)" }} /></label>
            </section>

            <section className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
              <h2 className="mb-3 text-sm font-semibold">3. Send the request</h2>
              <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}>
                <div className="flex items-start gap-3"><Clock3 size={17} style={{ color: "var(--accent-base)" }} /><div><p className="text-sm font-semibold">No price will be invented</p><p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{requestAnything || product?.listingKind === "MARKET_REFERENCE" ? "The matching engine will seek real supplier quotes and approved source responses." : "The supplier will confirm the price, quantity and lead time before any purchase order is created."}</p></div></div>
              </div>
              <div className="mt-4 space-y-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                <p className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-base)" }} /> Supplier identity stays private during comparison.</p>
                <p className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-base)" }} /> Real responses appear here when received.</p>
                <p className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-base)" }} /> No order is created until you approve a quote.</p>
              </div>
              {product && !productNeedsRfq && !requestAnything ? (
                <Link href={`/marketplace/${encodeURIComponent(product.id)}`} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>Open published supplier terms <ArrowRight size={15} /></Link>
              ) : (
                <button type="button" onClick={() => void submit()} disabled={!canSubmit || status === "submitting" || !authLoaded} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: "var(--signal)", color: "#1D1D1F" }}>
                  {status === "submitting" ? <><Loader2 size={15} className="animate-spin" /> Sending request…</> : <>Request real quotes <ArrowRight size={15} /></>}
                </button>
              )}
              {status === "error" && <p role="alert" className="mt-3 text-xs" style={{ color: "var(--error)" }}>{statusError}</p>}
              {!isSignedIn && authLoaded && <p className="mt-3 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>You will sign in before the request is sent.</p>}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

export default function RfqPage() {
  return <Suspense fallback={<main className="min-h-screen" style={{ backgroundColor: "var(--background)" }} />}><RfqContent /></Suspense>;
}
