"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  ShoppingCart,
  ShoppingBag,
  Package,
  Star,
  MapPin,
  ArrowRight,
  Grid3X3,
  LayoutList,
  ArrowUpDown,
  X,
  SlidersHorizontal,
  ChevronDown,
  Crown,
  Check,
  Loader2,
} from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { HOTEL_CATEGORIES, getCategoryById } from "@/lib/marketplace/categories";
import { getProductImage, getCategoryImage } from "@/lib/marketplace/product-images";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { useTranslation } from "@/lib/i18n/hooks/use-translation";
import type { MarketplaceProduct } from "@/lib/marketplace/category-mapper";

const CAT_IMAGES: Record<string, string> = {
  fb: getCategoryImage("fb"),
  hk: getCategoryImage("hk"),
  lin: getCategoryImage("lin"),
  eng: getCategoryImage("eng"),
  gra: getCategoryImage("gra"),
  ffe: getCategoryImage("ffe"),
  ose: getCategoryImage("ose"),
  spa: getCategoryImage("spa"),
  it: getCategoryImage("it"),
  sec: getCategoryImage("sec"),
};

function ProductImage({ product }: { product: MarketplaceProduct }) {
  const [error, setError] = useState(false);
  const resolved = getProductImage(product);

  if (resolved.type === "url" && !error) {
    return (
      <img
        src={resolved.src}
        alt={product.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
        onError={() => setError(true)}
      />
    );
  }

  const colors = resolved.type === "gradient" ? resolved.colors : ["#1a1a2e", "#2a2a4a", "#4a4a7a"];
  const initials = resolved.type === "gradient"
    ? resolved.initials
    : product.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)` }}
    >
      <div className="text-center">
        <span className="text-[28px] font-bold text-white/20 tracking-tight">{initials}</span>
        <p className="text-[9px] text-white/15 uppercase tracking-wider mt-1">{product.category.toUpperCase()}</p>
      </div>
    </div>
  );
}

const FILTER_OPTIONS = [
  { label: "Price", options: ["Under 100 EGP", "100-500 EGP", "500-1K EGP", "1K+ EGP"] },
  { label: "Rating", options: ["4.5+ Stars", "4.0+ Stars", "3.5+ Stars"] },
  { label: "Delivery", options: ["Same Day", "24 Hours", "48 Hours", "3-5 Days"] },
  { label: "Stock", options: ["In Stock", "Low Stock", "Pre-Order"] },
];

export default function MarketplacePage() {
  const { t } = useTranslation("marketplace");
  const { t: tc } = useTranslation("common");

  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("relevance");
  const [showLoginPrompt, setShowLoginPrompt] = useState<string | null>(null);
  const [memberMode, setMemberMode] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);

  // Real product data from API
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (activeCategory) params.set("category", activeCategory);
      params.set("status", "ACTIVE");
      params.set("limit", "48");
      params.set("page", "1");

      const res = await fetch(`/api/v1/products?${params.toString()}`);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to load products");
      }

      setProducts(json.data.products);
      setTotalProducts(json.data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory]);

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // Category counts from fetched products
  const COUNTS = useMemo(() => {
    return products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (activeFilters.includes("In Stock")) list = list.filter((p) => p.stockQuantity > 0);
    if (activeFilters.includes("Low Stock")) list = list.filter((p) => p.stockQuantity > 0 && p.stockQuantity < 20);
    if (activeFilters.includes("Pre-Order")) list = list.filter((p) => p.stockQuantity === 0);
    if (activeFilters.includes("Under 100 EGP")) list = list.filter((p) => p.unitPrice < 100);
    if (activeFilters.includes("100-500 EGP")) list = list.filter((p) => p.unitPrice >= 100 && p.unitPrice <= 500);
    if (activeFilters.includes("500-1K EGP")) list = list.filter((p) => p.unitPrice > 500 && p.unitPrice <= 1000);
    if (activeFilters.includes("1K+ EGP")) list = list.filter((p) => p.unitPrice > 1000);
    if (activeFilters.includes("4.5+ Stars")) list = list.filter((p) => p.supplierRating >= 4.5);
    if (activeFilters.includes("4.0+ Stars")) list = list.filter((p) => p.supplierRating >= 4.0);
    if (activeFilters.includes("3.5+ Stars")) list = list.filter((p) => p.supplierRating >= 3.5);
    if (activeFilters.includes("Same Day")) list = list.filter((p) => p.leadTimeDays <= 1);
    if (activeFilters.includes("24 Hours")) list = list.filter((p) => p.leadTimeDays <= 1);
    if (activeFilters.includes("48 Hours")) list = list.filter((p) => p.leadTimeDays <= 2);
    if (activeFilters.includes("3-5 Days")) list = list.filter((p) => p.leadTimeDays >= 3 && p.leadTimeDays <= 5);
    if (sortBy === "price_low") list.sort((a, b) => a.unitPrice - b.unitPrice);
    else if (sortBy === "price_high") list.sort((a, b) => b.unitPrice - a.unitPrice);
    else if (sortBy === "rating") list.sort((a, b) => b.supplierRating - a.supplierRating);
    else if (sortBy === "lead") list.sort((a, b) => a.leadTimeDays - b.leadTimeDays);
    return list;
  }, [products, activeFilters, sortBy]);

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const { addItem, openCart, totalItems } = useCart();

  const handleAdd = (product: MarketplaceProduct) => {
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
    setShowLoginPrompt(product.id);
    setTimeout(() => setShowLoginPrompt(null), 2000);
  };

  const formatPrice = (p: number, c: string) =>
    new Intl.NumberFormat("en-EG", { style: "currency", currency: c, minimumFractionDigits: 0 }).format(p);

  const memberDiscount = (price: number) => Math.round(price * 0.92);

  const stockLabel = (qty: number) => {
    if (qty === 0) return tc("outOfStock");
    if (qty < 20) return tc("lowStock");
    return tc("inStock");
  };

  const sortLabel = (key: string) => {
    switch (key) {
      case "relevance": return t("relevance");
      case "price_low": return t("priceLowHigh");
      case "price_high": return t("priceHighLow");
      case "rating": return t("topRated");
      case "lead": return t("fastestDelivery");
      default: return key;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <MarketingNav />

      {/* Toolbar */}
      <div className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#050505]/90 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <div className="flex-1 max-w-2xl">
            <div className="relative flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02] text-sm text-white placeholder:text-white/25 outline-none focus:border-white/[0.12] transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher />

            <button
              onClick={() => setMemberMode(!memberMode)}
              className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium transition-all ${
                memberMode ? "bg-accent-base text-white" : "text-white/40 hover:text-white/70 border border-white/[0.06]"
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{t("memberPrices")}</span>
              {memberMode && <Check className="w-3 h-3" />}
            </button>

            <button onClick={openCart} className="relative flex items-center justify-center px-3 py-2 rounded-xl border border-white/[0.06] text-white/50 hover:text-white hover:border-white/[0.12] transition-all">
              <ShoppingBag className="w-4 h-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-base text-white text-[10px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="border-t border-white/[0.04] bg-white/[0.02]">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-[12px] text-white/60 hover:text-white transition-colors shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {t("categories")}
            </button>

            {FILTER_OPTIONS.map((group) => (
              <div key={group.label} className="relative shrink-0">
                <button
                  onClick={() => setExpandedFilter(expandedFilter === group.label ? null : group.label)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] transition-colors ${
                    activeFilters.some((f) => group.options.includes(f))
                      ? "text-white border-white/[0.16] bg-white/[0.06]"
                      : "text-white/50 border-white/[0.06] hover:text-white/80 hover:border-white/[0.10]"
                  }`}
                >
                  {group.label}
                  <ChevronDown className={`w-3 h-3 transition-transform ${expandedFilter === group.label ? "rotate-180" : ""}`} />
                </button>
                {expandedFilter === group.label && (
                  <div className="absolute top-full left-0 mt-1 z-40 min-w-[160px] p-2 rounded-xl border border-white/[0.08] bg-[#121212] shadow-xl">
                    {group.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => toggleFilter(opt)}
                        className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[12px] transition-colors ${
                          activeFilters.includes(opt) ? "text-white bg-white/[0.06]" : "text-white/50 hover:text-white/80 hover:bg-white/[0.03]"
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border ${activeFilters.includes(opt) ? "bg-white border-white" : "border-white/20"}`}>
                          {activeFilters.includes(opt) && <Check className="w-3 h-3 text-black" />}
                        </div>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {activeFilters.length > 0 && (
              <button onClick={() => setActiveFilters([])} className="px-3 py-1.5 rounded-lg text-[12px] text-white/40 hover:text-white/70 transition-colors shrink-0">
                {t("clearFilters")} ({activeFilters.length})
              </button>
            )}

            <div className="ml-auto flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-[12px] text-white/30">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-white/50 outline-none cursor-pointer">
                  <option value="relevance" className="bg-[#121212]">{sortLabel("relevance")}</option>
                  <option value="price_low" className="bg-[#121212]">{sortLabel("price_low")}</option>
                  <option value="price_high" className="bg-[#121212]">{sortLabel("price_high")}</option>
                  <option value="rating" className="bg-[#121212]">{sortLabel("rating")}</option>
                  <option value="lead" className="bg-[#121212]">{sortLabel("lead")}</option>
                </select>
              </div>
              <div className="flex rounded-lg border border-white/[0.06] overflow-hidden">
                <button onClick={() => setViewMode("grid")} className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-white/[0.08] text-white" : "text-white/30 hover:text-white/60"}`}>
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode("list")} className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-white/[0.08] text-white" : "text-white/30 hover:text-white/60"}`}>
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className={`${mobileSidebarOpen ? "fixed inset-y-0 left-0 z-40 w-64 bg-[#050505] border-r border-white/[0.06] p-4" : "hidden lg:block w-56 shrink-0"}`}>
            {mobileSidebarOpen && (
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <span className="text-sm font-semibold text-white">{t("categories")}</span>
                <button onClick={() => setMobileSidebarOpen(false)} className="p-1 text-white/40 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="space-y-1">
              <button
                onClick={() => { setActiveCategory(""); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all ${
                  !activeCategory ? "text-white bg-white/[0.06] border border-white/[0.08]" : "text-white/50 hover:text-white/80 hover:bg-white/[0.03]"
                }`}
              >
                <Package className="w-4 h-4" />
                {t("allCategories")}
                <span className="ml-auto text-[10px] text-white/25">{totalProducts}</span>
              </button>

              {HOTEL_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                const count = COUNTS[cat.id] || 0;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCategory(isActive ? "" : cat.id); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all ${
                      isActive ? "text-white bg-white/[0.06] border border-white/[0.08]" : "text-white/50 hover:text-white/80 hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/[0.06]">
                      <img src={CAT_IMAGES[cat.id] || CAT_IMAGES.fb} alt={cat.label} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-left">{cat.label}</span>
                    <span className="ml-auto text-[10px] text-white/25">{count}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] text-white/40">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading products...
                  </span>
                ) : (
                  <>
                    {filtered.length} {filtered.length !== 1 ? t("results") : t("result")}
                    {activeCategory && ` ${t("in")} ${getCategoryById(activeCategory)?.label}`}
                  </>
                )}
              </span>
              {memberMode && (
                <span className="flex items-center gap-1.5 text-[11px] text-white/60">
                  <Crown className="w-3 h-3" /> {t("memberPricesActive")}
                </span>
              )}
            </div>

            {error ? (
              <div className="flex flex-col items-center justify-center py-24 text-white/30">
                <div className="w-16 h-16 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center justify-center mb-5">
                  <Package className="w-7 h-7 text-red-400/30" />
                </div>
                <h3 className="text-lg font-semibold text-white/60 mb-1">Failed to load products</h3>
                <p className="text-sm text-white/25 max-w-sm text-center mb-6">{error}</p>
                <button
                  onClick={fetchProducts}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-accent-base hover:bg-[#6B0000] transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : filtered.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-white/30">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
                  <Package className="w-7 h-7 text-white/15" />
                </div>
                <h3 className="text-lg font-semibold text-white/60 mb-1">{t("noResults")}</h3>
                <p className="text-sm text-white/25 max-w-sm text-center mb-6">
                  {t("noResultsDesc")}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setActiveCategory(""); setSearch(""); setActiveFilters([]); }}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-accent-base hover:bg-[#6B0000] transition-colors"
                  >
                    {t("viewAllProducts")}
                  </button>
                  {activeCategory && (
                    <button
                      onClick={() => setActiveCategory("")}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white border border-white/[0.06] hover:border-white/[0.12] transition-all"
                    >
                      {t("clearCategory")}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
                {filtered.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.02 }}
                    className="group relative flex flex-col rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden hover:border-white/[0.10] transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <ProductImage product={product} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${
                            product.stockQuantity === 0
                              ? "text-red-400 bg-red-500/10 border-red-500/20"
                              : product.stockQuantity < 20
                              ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                              : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                          }`}
                        >
                          {stockLabel(product.stockQuantity)}
                        </span>
                        {product.supplierTier === "PREMIER" && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20">
                            {t("premier")}
                          </span>
                        )}
                        {memberMode && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border flex items-center gap-1 bg-white/10 text-white border-white/20">
                            <Crown className="w-2.5 h-2.5" /> -8%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col gap-2 p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-white/40">
                          {getCategoryById(product.category)?.code || product.category}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-[10px] uppercase tracking-wider text-white/25">{product.unitOfMeasure}</span>
                      </div>

                      <h3 className="text-[14px] font-medium text-white leading-snug line-clamp-2 group-hover:text-white/80 transition-colors">
                        {product.name}
                      </h3>

                      <div className="flex items-center gap-2">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-[12px] font-medium text-white/60">{product.supplierRating.toFixed(1)}</span>
                        <span className="text-[10px] text-white/25">({product.supplierReviewCount})</span>
                      </div>

                      <div className="flex items-baseline gap-2 pt-1">
                        {memberMode ? (
                          <>
                            <span className="text-xl font-bold text-white tracking-tight">
                              EGP {memberDiscount(product.unitPrice).toLocaleString()}
                            </span>
                            <span className="text-[12px] text-white/25 line-through">
                              EGP {product.unitPrice.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <span className="text-xl font-bold text-white tracking-tight">
                            {formatPrice(product.unitPrice, product.currency)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-white/25">
                        <span>{t("moq")}: {product.minOrderQty}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span>{product.leadTimeDays} {t("dayDelivery")}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Link
                          href={`/marketplace/${product.id}`}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.06] text-[12px] font-medium text-white/50 hover:text-white hover:border-white/[0.12] transition-all"
                        >
                          <span>{t("viewDetails")}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                        <button
                          onClick={() => handleAdd(product)}
                          className="flex items-center justify-center px-3 py-2.5 rounded-xl bg-accent-base hover:bg-[#6B0000] text-white transition-all"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      </div>

                      {showLoginPrompt === product.id && (
                        <motion.p
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-[11px] text-center text-white/60"
                        >
                          {t("addedToCart")} <button onClick={openCart} className="underline font-medium">{t("viewCart")}</button> {tc("or")} <Link href="/login" className="underline font-medium">{tc("signIn")}</Link> {t("toCheckout")}
                        </motion.p>
                      )}

                      <p className="text-[10px] text-white/15 truncate">
                        {t("by")} <span className="text-white/30">{product.supplierName}</span>
                        <span className="mx-1">·</span>
                        <MapPin className="w-2.5 h-2.5 inline text-white/15" />
                        <span className="text-white/20"> {product.supplierCity}</span>
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
