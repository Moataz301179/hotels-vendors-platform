"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, Grid3X3, LayoutList, ArrowUpDown, Package } from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import { CompareProvider } from "@/components/marketplace/compare-context";
import { CompareDrawer } from "@/components/marketplace/compare-drawer";
import { SearchBar, type SearchFilters } from "@/components/marketplace/search-bar";
import { CategoryNav } from "@/components/marketplace/category-nav";
import { ProductCard } from "@/components/marketplace/product-card";
import { getCategoryById } from "@/lib/marketplace/categories";
import { LoadingPage } from "@/components/dashboards/shared/loading-card";
import { EmptyState } from "@/components/dashboards/shared/empty-state";
import { useCart } from "@/components/cart/cart-context";
import { useRouter } from "next/navigation";

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
    tier: string;
    city: string;
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

function mapApiProduct(p: ApiProduct): Product {
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

export default function HotelCatalogPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("relevance");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const { addItem, openCart } = useCart();

  const { data: catalogData, loading, error } = useApi<{ products: ApiProduct[]; pagination: { total: number } }>(
    "/api/v1/hotel/catalog?page=1&limit=100"
  );

  const apiProducts = catalogData?.products ?? [];
  const products = useMemo(() => apiProducts.map(mapApiProduct), [apiProducts]);

  // Compute category counts
  const CATEGORY_COUNTS = useMemo(() => {
    return products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [products]);

  // Apply all filters
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (activeCategory) {
      filtered = filtered.filter((p) => p.category === activeCategory);
    }

    if (searchFilters.category) {
      filtered = filtered.filter((p) => p.category === searchFilters.category);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.supplierName.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (searchFilters.priceMin !== undefined) {
      filtered = filtered.filter((p) => p.unitPrice >= searchFilters.priceMin!);
    }
    if (searchFilters.priceMax !== undefined) {
      filtered = filtered.filter((p) => p.unitPrice <= searchFilters.priceMax!);
    }

    if (searchFilters.minRating !== undefined) {
      filtered = filtered.filter((p) => p.supplierRating >= searchFilters.minRating!);
    }

    if (searchFilters.supplierTier && searchFilters.supplierTier !== "ALL") {
      filtered = filtered.filter((p) => p.supplierTier === searchFilters.supplierTier);
    }

    if (sortBy === "price_low") {
      filtered.sort((a, b) => a.unitPrice - b.unitPrice);
    } else if (sortBy === "price_high") {
      filtered.sort((a, b) => b.unitPrice - a.unitPrice);
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => b.supplierRating - a.supplierRating);
    } else if (sortBy === "lead_time") {
      filtered.sort((a, b) => a.leadTimeDays - b.leadTimeDays);
    }

    return filtered;
  }, [activeCategory, searchQuery, searchFilters, sortBy, products]);

  const handleSearch = (query: string, filters: SearchFilters) => {
    setSearchQuery(query);
    setSearchFilters(filters);
    if (filters.category) {
      setActiveCategory(filters.category);
    }
  };

  const handleAddToCart = (id: string, qty: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.unitPrice,
        sku: product.sku,
        image: product.images?.[0] || undefined,
      },
      qty
    );
    openCart();
  };

  const activeCategoryLabel = activeCategory ? getCategoryById(activeCategory)?.label : null;

  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <EmptyState title="Error loading catalog" description={error} />
      </div>
    );
  }

  return (
    <CompareProvider>
      <div className="min-h-screen bg-black text-white">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-border-subtle">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-base/10 via-transparent to-accent-base/5" />
          <div className="relative max-w-[1600px] mx-auto px-6 py-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-accent-base" />
                <span className="text-xs font-medium text-accent-base uppercase tracking-wider">Procurement Marketplace</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight mb-2">
                {activeCategoryLabel ? `${activeCategoryLabel} Products` : "One-Stop Hotel Procurement"}
              </h1>
              <p className="text-foreground-tertiary text-sm mb-6">
                {activeCategoryLabel
                  ? `Browse ${CATEGORY_COUNTS[activeCategory] ?? 0}+ verified products in ${activeCategoryLabel.toLowerCase()}. Fixed pricing, no bidding, ETA-ready.`
                  : `Browse ${products.length}+ verified products from Egyptian suppliers. Fixed pricing, no bidding, ETA-ready.`}
              </p>
              <SearchBar
                onSearch={handleSearch}
                placeholder="Search products, suppliers, SKUs..."
                suggestions={["Olive Oil", "Bed Sheets", "HVAC Filters", "Cleaning Chemicals"]}
                recentSearches={["Beef Cuts", "Bath Amenities", "Fresh Produce"]}
                trending={["Rice 25kg", "Salmon Fillet", "Deep Fryer", "Kitchen Equipment"]}
              />
            </motion.div>
          </div>
        </div>

        {/* Category Nav */}
        <div className="border-b border-border-subtle bg-surface-2/50 backdrop-blur-sm">
          <div className="max-w-[1600px] mx-auto px-6">
            <CategoryNav
              activeCategory={activeCategory}
              onSelectCategory={(id) => {
                setActiveCategory(id);
                setSearchQuery("");
              }}
              counts={CATEGORY_COUNTS}
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="border-b border-border-subtle">
          <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-foreground-muted">{filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}</span>
              {activeCategoryLabel && (
                <span className="px-2 py-0.5 rounded-md bg-accent-base/15 border border-accent-base/25 text-accent-base text-xs font-medium">{activeCategoryLabel}</span>
              )}

            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-foreground-muted" />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-sm text-foreground-secondary outline-none cursor-pointer">
                  <option value="relevance" className="bg-surface-2">Relevance</option>
                  <option value="price_low" className="bg-surface-2">Price: Low to High</option>
                  <option value="price_high" className="bg-surface-2">Price: High to Low</option>
                  <option value="rating" className="bg-surface-2">Top Rated</option>
                  <option value="lead_time" className="bg-surface-2">Fastest Delivery</option>
                </select>
              </div>
              <div className="flex items-center rounded-lg border border-border-subtle overflow-hidden">
                <button onClick={() => setViewMode("grid")} className={`p-2 transition-colors ${viewMode === "grid" ? "bg-accent-base text-white" : "text-foreground-muted hover:text-foreground-secondary"}`}>
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode("list")} className={`p-2 transition-colors ${viewMode === "list" ? "bg-accent-base text-white" : "text-foreground-muted hover:text-foreground-secondary"}`}>
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <EmptyState
                title="No products found"
                description="Try adjusting your search or filters"
                action={
                  activeCategory && (
                    <button
                      onClick={() => setActiveCategory("")}
                      className="mt-4 px-4 py-2 rounded-lg bg-accent-base text-white text-sm font-medium hover:bg-accent-base/80 transition-colors"
                    >
                      View All Products
                    </button>
                  )
                }
              />
            </div>
          ) : (
            <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
              {filteredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.02 }}
                >
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    description={product.description || undefined}
                    sku={product.sku}
                    category={product.category}
                    subcategory={product.subcategory || undefined}
                    unitPrice={product.unitPrice}
                    currency={product.currency}
                    stockQuantity={product.stockQuantity}
                    minOrderQty={product.minOrderQty}
                    unitOfMeasure={product.unitOfMeasure}
                    leadTimeDays={product.leadTimeDays}
                    shelfLifeDays={product.shelfLifeDays || undefined}
                    temperatureReq={product.temperatureReq || undefined}
                    supplierName={product.supplierName}
                    supplierTier={product.supplierTier}
                    supplierRating={product.supplierRating}
                    supplierReviewCount={product.supplierReviewCount}
                    supplierCity={product.supplierCity}
                    onAddToCart={handleAddToCart}
                    onViewDetails={(id) => router.push(`/hotel/catalog/${id}`)}
                    compareData={{
                      id: product.id,
                      name: product.name,
                      category: product.category,
                      unitPrice: product.unitPrice,
                      currency: product.currency,
                      supplierName: product.supplierName,
                      supplierRating: product.supplierRating,
                      supplierTier: product.supplierTier,
                      supplierCity: product.supplierCity,
                      stockQuantity: product.stockQuantity,
                      leadTimeDays: product.leadTimeDays,
                      minOrderQty: product.minOrderQty,
                      unitOfMeasure: product.unitOfMeasure,
                    }}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
        <CompareDrawer />
      </div>
    </CompareProvider>
  );
}
