"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, ShoppingCart, Loader2, AlertCircle, Package } from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import AppShell, { RequireAuth } from "@/components/AppShell";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currency: string;
  stockQuantity: number;
  status: string;
  supplier: { id: string; name: string; tier: string; rating: number; reviewCount: number; city: string };
}

interface ProductsResponse {
  data: Product[];
  pagination: { page: number; limit: number; total: number };
}

export default function MarketplacePage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState("name");

  const queryParams = new URLSearchParams();
  if (q.trim()) queryParams.set("search", q.trim());
  if (cat !== "all") queryParams.set("category", cat);
  queryParams.set("limit", "50");

  const { data, loading, error, refetch } = useApi<ProductsResponse>(
    `/api/v1/products?${queryParams.toString()}`
  );

  const products = data?.data || [];

  const sorted = useMemo(() => {
    const list = [...products];
    if (sort === "priceAsc") list.sort((a, b) => a.unitPrice - b.unitPrice);
    else if (sort === "priceDesc") list.sort((a, b) => b.unitPrice - a.unitPrice);
    else list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, sort]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <RequireAuth>
      <AppShell active="/marketplace">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Marketplace</h1>
              <p className="text-sm text-foreground-muted">
                {data?.pagination ? `${data.pagination.total} products available` : "Browse verified suppliers"}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
              <input
                type="text"
                placeholder="Search products..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full ps-10 pe-4 py-2 bg-surface-1 border border-border-subtle rounded-xl text-white placeholder:text-foreground-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-2 bg-surface-1 border border-border-subtle rounded-xl text-white focus:outline-none focus:border-accent"
            >
              <option value="name">Name</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="text-accent animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle size={24} className="mx-auto text-amber-400 mb-2" />
              <p className="text-foreground-muted text-sm">{error}</p>
              <button onClick={refetch} className="text-accent text-sm mt-2 hover:underline">Retry</button>
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-12 bg-surface-1 border border-border-subtle rounded-xl">
              <Package size={32} className="mx-auto text-foreground-muted mb-3" />
              <h3 className="text-lg font-medium text-white mb-1">No Products Available</h3>
              <p className="text-foreground-muted text-sm max-w-md mx-auto">
                Products will appear here when suppliers list their inventory.
                Connect with suppliers to build your catalog.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sorted.map((product) => (
                <Link
                  key={product.id}
                  href={`/marketplace/${product.id}`}
                  className="bg-surface-1 border border-border-subtle rounded-xl p-4 hover:border-visible transition-colors group"
                >
                  <div className="aspect-[4/3] bg-white/5 rounded-lg mb-3 flex items-center justify-center">
                    <Package size={32} className="text-foreground-muted" />
                  </div>
                  <h3 className="text-white font-medium text-sm mb-1 group-hover:text-accent transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-foreground-muted mb-2">{product.supplier.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-accent font-semibold">{formatMoney(product.unitPrice)}</span>
                    <span className="text-xs text-foreground-muted">{product.currency}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </RequireAuth>
  );
}
