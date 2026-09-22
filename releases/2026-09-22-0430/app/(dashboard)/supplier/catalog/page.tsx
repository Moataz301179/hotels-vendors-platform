"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus, Search, Package, Loader2, AlertCircle, Edit, Trash2,
} from "lucide-react";
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
}

interface ProductsResponse {
  data: Product[];
  pagination: { page: number; limit: number; total: number };
}

export default function SupplierCatalogPage() {
  const [q, setQ] = useState("");

  const queryParams = new URLSearchParams();
  if (q.trim()) queryParams.set("search", q.trim());
  queryParams.set("limit", "50");

  const { data, loading, error, refetch } = useApi<ProductsResponse>(
    `/api/v1/products?${queryParams.toString()}`
  );

  const products = data?.data || [];

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <RequireAuth>
      <AppShell active="/supplier/catalog">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Product Catalog</h1>
              <p className="text-sm text-foreground-muted">
                {data?.pagination ? `${data.pagination.total} products` : "Your listed products"}
              </p>
            </div>
            <Link
              href="/supplier/products/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors"
            >
              <Plus size={16} />
              Add Product
            </Link>
          </div>

          <div className="relative max-w-xs">
            <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
            <input
              type="text"
              placeholder="Search products..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full ps-10 pe-4 py-2 bg-surface-1 border border-border-subtle rounded-xl text-white placeholder:text-foreground-muted focus:outline-none focus:border-accent transition-colors"
            />
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
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-surface-1 border border-border-subtle rounded-xl">
              <Package size={32} className="mx-auto text-foreground-muted mb-3" />
              <h3 className="text-lg font-medium text-white mb-1">No Products Listed</h3>
              <p className="text-foreground-muted text-sm max-w-md mx-auto mb-4">
                Add your first product to start selling to hotels on the marketplace.
              </p>
              <Link
                href="/supplier/products/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors"
              >
                <Plus size={16} />
                Add First Product
              </Link>
            </div>
          ) : (
            <div className="bg-surface-1 border border-border-subtle rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Product</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">SKU</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Category</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Price</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Stock</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-foreground-muted uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-foreground-muted">{product.sku}</td>
                      <td className="px-4 py-3 text-sm text-foreground-muted">{product.category}</td>
                      <td className="px-4 py-3 text-right text-white">{formatMoney(product.unitPrice)}</td>
                      <td className="px-4 py-3 text-right text-foreground-muted">{product.stockQuantity}</td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-foreground-muted hover:text-accent transition-colors">
                          <Edit size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AppShell>
    </RequireAuth>
  );
}
