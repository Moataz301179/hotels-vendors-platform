"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight, Star, ShoppingCart, Heart, Scale, Package,
  Truck, ShieldCheck, MapPin, Minus, Plus,
  Clock, Thermometer, Calendar, ArrowLeft,
} from "lucide-react";
import { getCategoryById } from "@/lib/marketplace/categories";
import { useCompare } from "@/components/marketplace/compare-context";
import { ProductCard } from "@/components/marketplace/product-card";
import { useApi } from "@/lib/hooks/use-api";
import { LoadingPage } from "@/components/dashboards/shared/loading-card";
import { EmptyState } from "@/components/dashboards/shared/empty-state";
import { useCart } from "@/components/cart/cart-context";

interface ApiProduct {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  unitPrice: number;
  currency: string;
  stockQuantity: number;
  minOrderQty: number;
  unitOfMeasure: string;
  leadTimeDays: number;
  shelfLifeDays: number | null;
  temperatureReq: string | null;
  images: string[] | null;
  supplier: {
    id: string;
    name: string;
    city: string;
    email: string;
    tier?: string;
    rating?: number;
    reviewCount?: number;
  };
}

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  unitPrice: number;
  currency: string;
  stockQuantity: number;
  minOrderQty: number;
  unitOfMeasure: string;
  leadTimeDays: number;
  shelfLifeDays: number | null;
  temperatureReq: string | null;
  images: string[] | null;
  supplierId: string;
  supplierName: string;
  supplierTier: string;
  supplierRating: number;
  supplierReviewCount: number;
  supplierCity: string;
}

function mapProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    description: p.description,
    category: p.category,
    subcategory: p.subcategory,
    unitPrice: p.unitPrice,
    currency: p.currency,
    stockQuantity: p.stockQuantity,
    minOrderQty: p.minOrderQty,
    unitOfMeasure: p.unitOfMeasure,
    leadTimeDays: p.leadTimeDays,
    shelfLifeDays: p.shelfLifeDays,
    temperatureReq: p.temperatureReq,
    images: p.images,
    supplierId: p.supplier?.id || "",
    supplierName: p.supplier?.name || "Unknown",
    supplierTier: p.supplier?.tier || "STANDARD",
    supplierRating: p.supplier?.rating || 4.0,
    supplierReviewCount: p.supplier?.reviewCount || 0,
    supplierCity: p.supplier?.city || "",
  };
}

function getBulkTiers(unitPrice: number) {
  return [
    { qty: 1, price: unitPrice, discount: 0 },
    { qty: 10, price: Math.round(unitPrice * 0.95), discount: 5 },
    { qty: 50, price: Math.round(unitPrice * 0.90), discount: 10 },
    { qty: 100, price: Math.round(unitPrice * 0.85), discount: 15 },
    { qty: 500, price: Math.round(unitPrice * 0.80), discount: 20 },
  ];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const { data: productData, loading, error } = useApi<{ data: ApiProduct }>(`/api/v1/products?productId=${productId}`);
  const { data: relatedData } = useApi<{ products: ApiProduct[] }>(`/api/v1/products?page=1&limit=8`);

  const apiProduct = productData?.data;
  const product = apiProduct ? mapProduct(apiProduct) : null;

  const [qty, setQty] = useState(product?.minOrderQty || 1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const { addItem: addToCompare, removeItem: removeFromCompare, isInCompare } = useCompare();
  const { addItem: addToCart, openCart } = useCart();

  // Reset qty when product loads
  const effectiveQty = product ? Math.max(qty, product.minOrderQty) : qty;

  const relatedProducts = useMemo(() => {
    if (!product || !relatedData?.products) return [];
    return relatedData.products
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 4)
      .map(mapProduct);
  }, [product, relatedData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas text-foreground flex items-center justify-center">
        <LoadingPage />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-canvas text-foreground flex flex-col items-center justify-center gap-4">
        <Package className="w-12 h-12 text-foreground-muted" />
        <h1 className="text-xl font-semibold">Product Not Found</h1>
        <p className="text-sm text-foreground-muted">{error || "This product may have been removed or the URL is incorrect."}</p>
        <Link href="/hotel/catalog" className="px-4 py-2 rounded-lg bg-accent-base hover:bg-accent-base/80 text-white text-sm font-medium transition-colors">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const category = getCategoryById(product.category);
  const bulkTiers = getBulkTiers(product.unitPrice);
  const activeTier = bulkTiers.slice().reverse().find((t) => effectiveQty >= t.qty) || bulkTiers[0];
  const unitPrice = activeTier.price;
  const totalPrice = unitPrice * effectiveQty;

  const stockStatus =
    product.stockQuantity === 0
      ? { label: "Out of Stock", color: "text-red-400 bg-red-500/10 border-red-500/20" }
      : product.stockQuantity < product.minOrderQty * 3
      ? { label: "Low Stock", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" }
      : { label: "In Stock", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };

  const inCompare = isInCompare(product.id);

  const addProductToCart = (p: Product, quantity: number) => {
    addToCart(
      {
        id: p.id,
        name: p.name,
        price: p.unitPrice,
        sku: p.sku,
        image: p.images?.[0] || undefined,
      },
      quantity
    );
    openCart();
  };

  const handleAddToCart = () => {
    if (!product) return;
    addProductToCart(product, effectiveQty);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-EG", { style: "currency", currency: product.currency, minimumFractionDigits: 0 }).format(price);

  return (
    <div className="min-h-screen bg-canvas text-foreground">
      {/* Breadcrumb */}
      <div className="border-b border-border-subtle">
        <div className="max-w-[1400px] mx-auto px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <Link href="/hotel" className="hover:text-foreground-secondary transition-colors">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/hotel/catalog" className="hover:text-foreground-secondary transition-colors">Catalog</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground-secondary">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <button onClick={() => router.push("/hotel/catalog")} className="flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground-secondary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Image */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <div className="relative aspect-square rounded-2xl border border-border-subtle bg-surface-1 overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-accent-base/5 to-transparent">
                  <Package className="w-20 h-20 text-foreground-muted mb-4" />
                  <span className="text-sm text-foreground-muted">{product.sku}</span>
                </div>
              )}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${stockStatus.color}`}>{stockStatus.label}</span>
                {product.supplierTier === "PREMIER" && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent-base/20 text-accent-base border border-accent-base/30">Premier Supplier</span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right: Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md bg-accent-base/15 text-accent-base text-xs font-semibold border border-accent-base/25">
                {category?.label || product.category}
              </span>
              <span className="text-xs text-foreground-muted font-mono">{product.sku}</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
            {product.description && <p className="text-sm text-foreground-tertiary leading-relaxed">{product.description}</p>}

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-medium">{product.supplierRating.toFixed(1)}</span>
              </div>
              <span className="text-xs text-foreground-muted">({product.supplierReviewCount} reviews)</span>
              <span className="w-1 h-1 rounded-full bg-surface-2" />
              <span className="text-xs text-foreground-muted">{product.supplierCity}</span>
            </div>

            <div className="p-4 rounded-xl border border-border-subtle bg-surface-1">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-white">{formatPrice(totalPrice)}</span>
                <span className="text-sm text-foreground-muted">for {effectiveQty} {product.unitOfMeasure}</span>
                {activeTier.discount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold border border-emerald-500/30">Save {activeTier.discount}%</span>
                )}
              </div>
              <p className="text-xs text-foreground-muted mt-1">{formatPrice(unitPrice)} / {product.unitOfMeasure} (bulk pricing applied)</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">Bulk Pricing</p>
              <div className="grid grid-cols-5 gap-2">
                {bulkTiers.map((tier) => (
                  <button
                    key={tier.qty}
                    onClick={() => setQty(Math.max(tier.qty, product.minOrderQty))}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      effectiveQty >= tier.qty ? "bg-accent-base/15 border-accent-base/30 text-white" : "bg-surface-1 border-border-subtle text-foreground-muted hover:text-foreground-secondary"
                    }`}
                  >
                    <div className="text-xs font-bold">{tier.qty}+</div>
                    <div className="text-[10px] text-foreground-muted">{formatPrice(tier.price)}</div>
                    {tier.discount > 0 && <div className="text-[9px] text-emerald-400">-{tier.discount}%</div>}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-border-subtle bg-surface-1 overflow-hidden">
                <button onClick={() => setQty(Math.max(product.minOrderQty, effectiveQty - 1))} className="px-4 py-3 text-foreground-secondary hover:text-foreground hover:bg-surface-2 transition-colors"><Minus className="w-4 h-4" /></button>
                <span className="px-4 py-3 text-sm font-medium text-white min-w-[4rem] text-center">{effectiveQty}</span>
                <button onClick={() => setQty(Math.min(product.stockQuantity, effectiveQty + 1))} className="px-4 py-3 text-foreground-secondary hover:text-foreground hover:bg-surface-2 transition-colors"><Plus className="w-4 h-4" /></button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.stockQuantity === 0}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent-base hover:bg-accent-base/80 disabled:bg-surface-2 disabled:text-foreground-muted text-white font-medium transition-all active:scale-[0.98]"
              >
                <><ShoppingCart className="w-5 h-5" /><span>Add to Cart</span></>
              </button>

              <button onClick={() => setIsWishlisted(!isWishlisted)} className={`p-3 rounded-xl border transition-colors ${isWishlisted ? "bg-accent-base border-accent-base text-white" : "border-border-subtle bg-surface-1 text-foreground-muted hover:text-foreground hover:border-border-subtle"}`}>
                <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
              </button>

              <button
                onClick={() => inCompare ? removeFromCompare(product.id) : addToCompare({
                  id: product.id, name: product.name, category: product.category,
                  unitPrice: product.unitPrice, currency: product.currency,
                  supplierName: product.supplierName, supplierRating: product.supplierRating,
                  supplierTier: product.supplierTier, supplierCity: product.supplierCity,
                  stockQuantity: product.stockQuantity, leadTimeDays: product.leadTimeDays,
                  minOrderQty: product.minOrderQty, unitOfMeasure: product.unitOfMeasure,
                })}
                className={`p-3 rounded-xl border transition-colors ${inCompare ? "bg-accent-base border-accent-base text-white" : "border-border-subtle bg-surface-1 text-foreground-muted hover:text-foreground hover:border-border-subtle"}`}
              >
                <Scale className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-foreground-muted">
              Minimum order: <span className="text-foreground-tertiary">{product.minOrderQty} {product.unitOfMeasure}</span>
              {product.stockQuantity > 0 && <span> · Available: <span className="text-foreground-tertiary">{product.stockQuantity} {product.unitOfMeasure}</span></span>}
            </p>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-400">ETA E-Invoicing Compliant</span>
              <span className="text-[10px] text-foreground-muted">· Tax invoice auto-generated on order</span>
            </div>

            <div className="p-4 rounded-xl border border-border-subtle bg-surface-1">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Supplier</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                  product.supplierTier === "PREMIER" ? "bg-accent-base/15 text-accent-base border border-accent-base/25" :
                  product.supplierTier === "CORE" ? "bg-blue-500/15 text-blue-400 border border-blue-500/25" :
                  "bg-surface-2 text-foreground-muted border border-border-subtle"
                }`}>{product.supplierTier}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-base/15 border border-accent-base/25 flex items-center justify-center text-sm font-bold text-accent-base">
                  {product.supplierName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{product.supplierName}</p>
                  <div className="flex items-center gap-2 text-xs text-foreground-muted">
                    <div className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /><span>{product.supplierRating.toFixed(1)}</span></div>
                    <span>({product.supplierReviewCount} reviews)</span>
                    <span className="w-1 h-1 rounded-full bg-surface-2" />
                    <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /><span>{product.supplierCity}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Specs Table */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold mb-4">Product Specifications</h2>
          <div className="rounded-xl border border-border-subtle bg-surface-1 overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {[
                { label: "SKU", value: product.sku, icon: Package },
                { label: "Category", value: category?.label || product.category, icon: Package },
                { label: "Unit of Measure", value: product.unitOfMeasure, icon: Package },
                { label: "Min Order", value: `${product.minOrderQty} ${product.unitOfMeasure}`, icon: Package },
                { label: "Stock", value: `${product.stockQuantity} ${product.unitOfMeasure}`, icon: Package },
                { label: "Lead Time", value: `${product.leadTimeDays} days`, icon: Truck },
                { label: "Shelf Life", value: product.shelfLifeDays ? `${product.shelfLifeDays} days` : "N/A", icon: Calendar },
                { label: "Storage", value: product.temperatureReq || "Room Temperature", icon: Thermometer },
              ].map((spec, i) => (
                <div key={spec.label} className={`p-4 ${i < 4 ? "border-b" : ""} ${i % 4 !== 3 ? "border-r" : ""} border-border-invisible`}>
                  <p className="text-[10px] uppercase tracking-wider text-foreground-muted font-semibold mb-1">{spec.label}</p>
                  <p className="text-sm text-foreground-secondary font-medium">{spec.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Truck, title: "Delivery", desc: `${product.leadTimeDays} business days to Greater Cairo` },
            { icon: ShieldCheck, title: "Payment Guarantee", desc: "Platform-secured payment with factoring option" },
            { icon: Clock, title: "Reorder Alert", desc: "Auto-reminder when stock drops below reorder point" },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl border border-border-subtle bg-surface-1">
              <item.icon className="w-5 h-5 text-accent-base flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-foreground-muted mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold mb-4">More from {category?.label || product.category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
                  <ProductCard
                    id={p.id}
                    name={p.name}
                    description={p.description || undefined}
                    sku={p.sku}
                    category={p.category}
                    unitPrice={p.unitPrice}
                    currency={p.currency}
                    stockQuantity={p.stockQuantity}
                    minOrderQty={p.minOrderQty}
                    unitOfMeasure={p.unitOfMeasure}
                    leadTimeDays={p.leadTimeDays}
                    shelfLifeDays={p.shelfLifeDays || undefined}
                    temperatureReq={p.temperatureReq || undefined}
                    supplierName={p.supplierName}
                    supplierTier={p.supplierTier}
                    supplierRating={p.supplierRating}
                    supplierReviewCount={p.supplierReviewCount}
                    supplierCity={p.supplierCity}
                    onAddToCart={(id, qty) => {
                      const p = relatedProducts.find((rp) => rp.id === id);
                      if (p) addProductToCart(p, qty);
                    }}
                    onViewDetails={(id) => router.push(`/hotel/catalog/${id}`)}
                    compareData={{
                      id: p.id, name: p.name, category: p.category,
                      unitPrice: p.unitPrice, currency: p.currency,
                      supplierName: p.supplierName, supplierRating: p.supplierRating,
                      supplierTier: p.supplierTier, supplierCity: p.supplierCity,
                      stockQuantity: p.stockQuantity, leadTimeDays: p.leadTimeDays,
                      minOrderQty: p.minOrderQty, unitOfMeasure: p.unitOfMeasure,
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
