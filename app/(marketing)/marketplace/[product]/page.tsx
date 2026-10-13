"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, Package, ShieldCheck, Loader2 } from "lucide-react";

interface MarketplaceProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  unitPrice: number | null;
  basePrice: number | null;
  pricingMode: "FIXED" | "RFQ" | "HYBRID" | string;
  rfqThresholdQty: number | null;
  currency: string;
  stockQuantity: number;
  minOrderQty: number;
  unitOfMeasure: string;
  leadTimeDays: number;
  images: string[] | null;
  supplierName: string;
  supplierCity: string;
  supplierTier: string;
  listingKind?: "SUPPLIER_OFFER" | "MARKET_REFERENCE" | string;
  sourceCount?: number;
  imageRightsStatus?: string | null;
}

function formatPrice(value: number | null | undefined, currency = "EGP") {
  if (value == null || !Number.isFinite(value)) return "Request supplier quote";
  return new Intl.NumberFormat("en-EG", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

export default function MarketplaceProductPage() {
  const params = useParams<{ product: string }>();
  const productId = Array.isArray(params.product) ? params.product[0] : params.product;
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        const response = await fetch(`/api/v1/products?productId=${encodeURIComponent(productId)}`);
        const json = await response.json();
        if (cancelled) return;
        const row = json?.success ? json.data?.data : null;
        setProduct(row || null);
        setNotFound(!row);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (productId) void load();
    return () => { cancelled = true; };
  }, [productId]);

  const savingsPercent = useMemo(() => {
    if (!product || product.basePrice == null || product.unitPrice == null || product.basePrice <= product.unitPrice) return null;
    return Math.round(((product.basePrice - product.unitPrice) / product.basePrice) * 100);
  }, [product]);

  return (
    <main className="min-h-screen pt-24 pb-16" style={{ backgroundColor: "var(--background)", color: "var(--text-primary)" }}>
      <div className="mx-auto max-w-6xl px-6">
        <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft size={15} /> Back to opportunities
        </Link>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="animate-spin" size={26} style={{ color: "var(--signal)" }} />
          </div>
        ) : notFound || !product ? (
          <section className="mx-auto max-w-xl rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <Package size={34} className="mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
            <h1 className="text-2xl font-semibold mb-3">Opportunity unavailable</h1>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>This listing may have expired, been removed, or is not currently available from a verified supplier.</p>
            <Link href="/marketplace" className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold" style={{ backgroundColor: "var(--signal)", color: "#1D1D1F" }}>Browse opportunities <ArrowRight size={15} /></Link>
          </section>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="overflow-hidden rounded-3xl border min-h-[320px] lg:min-h-[480px]" style={{ borderColor: "var(--border)", background: "linear-gradient(135deg, var(--surface), var(--background))" }}>
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} className="w-full h-full min-h-[320px] lg:min-h-[480px] object-cover" />
              ) : (
                <div className="min-h-[320px] lg:min-h-[480px] flex flex-col items-center justify-center gap-3" style={{ color: "var(--text-muted)" }}>
                  <Package size={54} strokeWidth={1.2} />
                  <span className="text-xs">Supplier image not provided</span>
                </div>
              )}
            </div>

            <div className="py-2">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="rounded-full px-3 py-1 text-[11px] font-semibold" style={{ backgroundColor: "rgba(152,214,64,0.14)", color: "var(--text-primary)" }}>{product.category.replace(/_/g, " ")}</span>
                {product.listingKind === "MARKET_REFERENCE" ? (
                  <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px]" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>Market reference · supplier not onboarded</span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px]" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}><ShieldCheck size={13} /> Verified supplier</span>
                )}
                <span className="rounded-full border px-3 py-1 text-[11px]" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{product.pricingMode === "RFQ" ? "Quote required" : product.pricingMode === "HYBRID" ? "Fixed price + bulk quote" : "Supplier fixed price"}</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight mb-4">{product.name}</h1>
              {product.description && <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>{product.description}</p>}

              <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
                <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{product.listingKind === "MARKET_REFERENCE" ? "Market price status" : "Supplier price"}</p>
                <p className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>{product.listingKind === "MARKET_REFERENCE" ? "Price not published · RFQ required" : product.pricingMode === "RFQ" ? "Request supplier quote" : formatPrice(product.unitPrice, product.currency)}{product.unitPrice != null && product.pricingMode !== "RFQ" ? <span className="text-sm font-normal" style={{ color: "var(--text-secondary)" }}> / {product.unitOfMeasure}</span> : null}</p>
                {savingsPercent != null && <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>Supplier reference price is {savingsPercent}% higher; confirm final terms with the supplier.</p>}
                <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                  <div><p className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>Minimum order</p><p className="text-sm font-medium">{product.minOrderQty} {product.unitOfMeasure}</p></div>
                  <div><p className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>Lead time</p><p className="text-sm font-medium inline-flex items-center gap-1"><Clock size={13} /> {product.leadTimeDays} days</p></div>
                  {product.stockQuantity > 0 && <div><p className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>Reported availability</p><p className="text-sm font-medium">{product.stockQuantity} {product.unitOfMeasure}</p></div>}
                  {product.rfqThresholdQty != null && <div><p className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>Bulk quote threshold</p><p className="text-sm font-medium">{product.rfqThresholdQty} {product.unitOfMeasure}</p></div>}
                </div>
              </div>

              <div className="mb-7">
                <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{product.listingKind === "MARKET_REFERENCE" ? "Source status" : "Supplied by"}</p>
                <p className="text-base font-semibold">{product.listingKind === "MARKET_REFERENCE" ? "Public market reference" : product.supplierName}</p>
                {product.supplierCity && <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{product.supplierCity}</p>}
                {product.listingKind === "MARKET_REFERENCE" && product.sourceCount ? <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{product.sourceCount} source observation{product.sourceCount === 1 ? "" : "s"} recorded</p> : null}
              </div>

              <Link href={`/rfq?${product.listingKind === "MARKET_REFERENCE" ? "catalogItemId" : "productId"}=${encodeURIComponent(product.id)}`} className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition-opacity hover:opacity-90" style={{ backgroundColor: "var(--signal)", color: "#1D1D1F" }}>
                Request supplier quote <ArrowRight size={16} />
              </Link>
              <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>The supplier remains the seller. HotelsVendors helps coordinate the opportunity and compare terms; final price, quality, availability and delivery are confirmed with the supplier.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
