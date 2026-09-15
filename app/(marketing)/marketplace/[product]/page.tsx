"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package, ShoppingCart, Loader2, AlertCircle, MapPin, Phone, Mail, Star,
} from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string | null;
  unitPrice: number;
  currency: string;
  stockQuantity: number;
  minOrderQty: number;
  unitOfMeasure: string;
  status: string;
  supplier: {
    id: string;
    name: string;
    city: string;
    rating: number | null;
    reviewCount: number;
  };
}

export default function ProductPage() {
  const params = useParams();
  const id = params?.id as string;
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const { data, loading, error } = useApi<{ data: Product }>(`/api/v1/products?productId=${id}`);

  const product = data?.data;

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await fetch("/api/v1/cart", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: qty }),
      });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch {
      // Error handled by useApi
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency: "EGP", maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <RequireAuth>
        <AppShell active="/marketplace">
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="text-accent animate-spin" />
          </div>
        </AppShell>
      </RequireAuth>
    );
  }

  if (error || !product) {
    return (
      <RequireAuth>
        <AppShell active="/marketplace">
          <div className="text-center py-12">
            <AlertCircle size={24} className="mx-auto text-amber-400 mb-2" />
            <p className="text-foreground-muted text-sm">{error || "Product not found"}</p>
          </div>
        </AppShell>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <AppShell active="/marketplace">
        <div className="space-y-6">
          <Link href="/marketplace" className="text-foreground-muted hover:text-white text-sm">
            ← Back to Marketplace
          </Link>

          <div className="bg-surface-1 border border-border-subtle rounded-xl p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center">
                <Package size={48} className="text-foreground-muted" />
              </div>

              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-semibold text-white mb-2">{product.name}</h1>
                  <p className="text-foreground-muted text-sm">{product.description}</p>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="text-accent font-semibold text-xl">{formatMoney(product.unitPrice)}</span>
                  <span className="text-foreground-muted">per {product.unitOfMeasure}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-foreground-muted">
                  <Star size={14} className="text-amber-400" />
                  <span>{product.supplier.rating?.toFixed(1) || "N/A"} ({product.supplier.reviewCount} reviews)</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-foreground-muted">
                  <MapPin size={14} />
                  <span>{product.supplier.city}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-foreground-muted">
                  <Phone size={14} />
                  <span>{product.sku}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-foreground-muted">
                  <Package size={14} />
                  <span>{product.stockQuantity} in stock</span>
                </div>

                <div className="border-t border-border-subtle pt-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm text-foreground-muted">Quantity:</label>
                    <input
                      type="number"
                      min={product.minOrderQty}
                      value={qty}
                      onChange={(e) => setQty(Math.max(product.minOrderQty, parseInt(e.target.value) || 1))}
                      className="w-24 px-3 py-2 bg-ink-950 border border-white/10 rounded-lg text-white"
                    />
                    <span className="text-sm text-foreground-muted">Min: {product.minOrderQty}</span>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="w-full px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors"
                  >
                    {addedToCart ? "Added to Cart ✓" : "Add to Cart"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
