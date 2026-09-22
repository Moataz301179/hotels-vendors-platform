"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Package,
  Star,
  MapPin,
  ShieldCheck,
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Check,
  Crown,
  ShoppingBag,
} from "lucide-react";
import { getCategoryById } from "@/lib/marketplace/categories";
import { getProductImage } from "@/lib/marketplace/product-images";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useTranslation } from "@/lib/i18n/hooks/use-translation";
import { useCart } from "@/components/cart/cart-context";
import type { MarketplaceProduct } from "@/lib/marketplace/category-mapper";

function ProductImage({ product }: { product: MarketplaceProduct }) {
  const [error, setError] = useState(false);
  const resolved = getProductImage(product);

  if (resolved.type === "url" && !error) {
    return (
      <img
        src={resolved.src}
        alt={product.name}
        className="w-full h-full object-cover"
        loading="eager"
        onError={() => setError(true)}
      />
    );
  }

  const colors = resolved.type === "gradient" ? resolved.colors : ["#1a1a2e", "#2a2a4a", "#4a4a7a"];
  const initials = resolved.type === "gradient"
    ? resolved.initials
    : product.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)` }}
    >
      <div className="text-center">
        <span className="text-[32px] font-bold text-white/20 tracking-tight">{initials}</span>
        <p className="text-[10px] text-white/15 uppercase tracking-wider mt-1">{product.category.toUpperCase()}</p>
      </div>
    </div>
  );
}

export default function ProductDetailClient({ product }: { product: MarketplaceProduct }) {
  const { t } = useTranslation("marketplace");
  const { t: tc } = useTranslation("common");

  const [qty, setQty] = useState(product.minOrderQty || 1);
  const [added, setAdded] = useState(false);
  const [memberMode, setMemberMode] = useState(false);
  const { addItem, openCart, totalItems } = useCart();

  const memberDiscount = (price: number) => Math.round(price * 0.92);

  const handleAdd = () => {
    const resolved = getProductImage(product);
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: memberMode ? memberDiscount(product.unitPrice) : product.unitPrice,
      unitPrice: memberMode ? memberDiscount(product.unitPrice) : product.unitPrice,
      supplierId: product.supplierId,
      supplierName: product.supplierName,
      image: resolved.type === "url" ? resolved.src : undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const cat = getCategoryById(product.category);
  const inStock = product.stockQuantity > 0;
  const lowStock = product.stockQuantity > 0 && product.stockQuantity < 20;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <MarketingNav />

      {/* Breadcrumb + Actions */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <Link
            href="/marketplace"
            className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("backToMarketplace")}
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button
              onClick={() => setMemberMode(!memberMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                memberMode ? "bg-accent-base text-white" : "text-white/40 hover:text-white/70 border border-white/[0.06]"
              }`}
            >
              <Crown className="w-3 h-3" />
              {t("memberPrices")}
            </button>
            <button onClick={openCart} className="relative flex items-center justify-center px-3 py-1.5 rounded-lg border border-white/[0.06] text-white/50 hover:text-white transition-all">
              <ShoppingBag className="w-4 h-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-base text-white text-[10px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Product Detail */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0a0a0a]">
            <ProductImage product={product} />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-white/40 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06]">
                  {cat?.code || product.category}
                </span>
                {product.supplierTier === "PREMIER" && (
                  <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                    {t("premier")}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{product.name}</h1>
              <p className="text-sm text-white/40 mt-1">{product.description}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-medium text-white/70">{product.supplierRating.toFixed(1)}</span>
                <span className="text-xs text-white/25">({product.supplierReviewCount} reviews)</span>
              </div>
              <span className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1 text-xs text-white/30">
                <MapPin className="w-3 h-3" />
                {product.supplierCity}
              </div>
              <span className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1 text-xs text-white/30">
                <ShieldCheck className="w-3 h-3" />
                {t("verifiedSupplier")}
              </div>
            </div>

            <div className="flex items-baseline gap-3">
              {memberMode ? (
                <>
                  <span className="text-3xl font-bold text-white tracking-tight">
                    EGP {memberDiscount(product.unitPrice).toLocaleString()}
                  </span>
                  <span className="text-sm text-white/25 line-through">
                    EGP {product.unitPrice.toLocaleString()}
                  </span>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    -8% {t("memberPrice")}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-white tracking-tight">
                  EGP {product.unitPrice.toLocaleString()}
                </span>
              )}
              <span className="text-xs text-white/25">/ {product.unitOfMeasure}</span>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {!inStock ? (
                <span className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20">
                  {tc("outOfStock")}
                </span>
              ) : lowStock ? (
                <span className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20">
                  {tc("lowStock")} — {product.stockQuantity} {t("unitsLeft")}
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  {tc("inStock")} — {product.stockQuantity} {t("unitsAvailable")}
                </span>
              )}
              <span className="text-xs text-white/25">{t("moq")}: {product.minOrderQty} {product.unitOfMeasure}</span>
            </div>

            {/* Quantity */}
            {inStock && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-white/50">{t("quantity")}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty(Math.max(product.minOrderQty, qty - 1))}
                    className="w-9 h-9 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-medium text-white">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="w-9 h-9 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAdd}
                disabled={!inStock}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent-base hover:bg-[#6B0000] disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium transition-all"
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" />
                    {t("addedToCart")}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    {t("addToCart")}
                  </>
                )}
              </button>
            </div>

            {/* Supplier */}
            <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-[10px] text-white/20 uppercase tracking-wider mb-2">{t("supplier")}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{product.supplierName}</p>
                  <p className="text-xs text-white/30">{product.supplierCity}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-sm text-white/60">{product.supplierRating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[10px] text-white/20 uppercase">{t("leadTime")}</p>
                <p className="text-sm text-white mt-0.5">{product.leadTimeDays} {t("days")}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[10px] text-white/20 uppercase">{t("sku")}</p>
                <p className="text-sm text-white mt-0.5 font-mono">{product.sku}</p>
              </div>
              {product.shelfLifeDays && (
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[10px] text-white/20 uppercase">{t("shelfLife")}</p>
                  <p className="text-sm text-white mt-0.5">{product.shelfLifeDays} {t("days")}</p>
                </div>
              )}
              {product.temperatureReq && (
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[10px] text-white/20 uppercase">{t("storage")}</p>
                  <p className="text-sm text-white mt-0.5">{product.temperatureReq}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
