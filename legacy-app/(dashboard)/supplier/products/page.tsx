"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Package,
  Search,
  Plus,
  Tag,
  AlertTriangle,
  DollarSign,
  Grid3X3,
  List,
  Eye,
  Filter,
} from "lucide-react";
import { useApi } from "@/lib/hooks/use-api";
import { LoadingCard, LoadingTable } from "@/components/dashboards/shared/loading-card";
import { EmptyState } from "@/components/dashboards/shared/empty-state";
import { StatusPill } from "@/components/dashboards/shared/status-pill";
import { Modal } from "@/components/ui/modal";
import { getProductImage } from "@/lib/marketplace/product-images";

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  currency?: string;
  stockQuantity: number;
  status: string;
}

interface ProductsApiResponse {
  products: Product[];
  pagination?: { total: number };
}

function formatCurrency(amount: number, currency = "EGP") {
  return `${currency} ${amount.toLocaleString("en-EG")}`;
}

function ProductThumb({ name, category, className = "" }: { name: string; category: string; className?: string }) {
  const resolved = getProductImage({ name, category });
  if (resolved.type === "url") {
    return (
      <img
        src={resolved.src}
        alt={name}
        className={`object-cover ${className}`}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ background: `linear-gradient(135deg, ${resolved.colors[0]} 0%, ${resolved.colors[1]} 50%, ${resolved.colors[2]} 100%)` }}
    >
      <span className="text-xs font-bold text-foreground-muted">{resolved.initials}</span>
    </div>
  );
}

export default function SupplierProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data, loading, error } = useApi<ProductsApiResponse>("/api/v1/products");

  const products = useMemo(() => data?.products ?? [], [data]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  const stats = useMemo(() => {
    const total = products.length;
    const categoriesCount = new Set(products.map((p) => p.category)).size;
    const lowStock = products.filter((p) => p.stockQuantity <= 10).length;
    const avgPrice = total > 0 ? products.reduce((sum, p) => sum + p.price, 0) / total : 0;

    return [
      { label: "Total Products", value: total.toString(), icon: Package },
      { label: "Categories", value: categoriesCount.toString(), icon: Tag },
      { label: "Low Stock", value: lowStock.toString(), icon: AlertTriangle },
      { label: "Avg Price", value: formatCurrency(Math.round(avgPrice)), icon: DollarSign },
    ];
  }, [products]);

  return (
    <motion.div
      className="max-w-[1600px] mx-auto space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Product Catalog</h1>
          <p className="text-sm text-foreground-muted mt-0.5">Manage your inventory and product listings</p>
        </div>
        <Link
          href="/supplier/products/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-base hover:bg-accent-base/80 text-xs text-white font-medium transition-all self-start"
        >
          <Plus size={14} />
          Add Product
        </Link>
      </motion.div>

      {/* Stats */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <LoadingCard key={i} />)
          : stats.map((s) => (
              <motion.div
                key={s.label}
                variants={fadeInUp}
                className="rounded-xl border border-border-subtle bg-surface-1 p-4 hover:bg-surface-1 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider">{s.label}</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
                    <s.icon size={15} className="text-foreground-muted" />
                  </div>
                </div>
                <p className="text-xl font-bold text-white">{s.value}</p>
              </motion.div>
            ))}
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-lg bg-surface-1 border border-border-subtle text-xs text-white placeholder:text-foreground-muted focus:outline-none focus:border-accent-base/50 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-lg bg-surface-1 border border-border-subtle text-xs text-white focus:outline-none focus:border-accent-base/50 appearance-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-surface-2">
                  {c === "all" ? "All Categories" : c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex rounded-lg border border-border-subtle overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-surface-2 text-white" : "text-foreground-muted hover:text-foreground-secondary"}`}
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${viewMode === "grid" ? "bg-surface-2 text-white" : "text-foreground-muted hover:text-foreground-secondary"}`}
            >
              <Grid3X3 size={14} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div variants={fadeInUp}>
        {loading ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <LoadingCard key={i} />
              ))}
            </div>
          ) : (
            <LoadingTable rows={6} />
          )
        ) : error ? (
          <EmptyState title="Error loading products" description={error} />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            title="No products found"
            description={searchQuery || categoryFilter !== "all" ? "Try adjusting your filters." : "Add your first product to start selling."}
            icon="package"
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-xl border border-border-subtle bg-surface-1 overflow-hidden hover:bg-surface-1 transition-colors"
              >
                <div className="relative h-36 overflow-hidden">
                  <ProductThumb
                    name={product.name}
                    category={product.category}
                    className="w-full h-full rounded-t-xl"
                  />
                  <div className="absolute top-2 right-2">
                    <StatusPill status={product.status} />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] font-mono text-foreground-muted">{product.sku}</span>
                  </div>
                  <h3 className="text-sm font-medium text-white mb-1 line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
                  <p className="text-[11px] text-foreground-muted mb-3">{product.category}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{formatCurrency(product.price, product.currency)}</span>
                    <span className={`text-[11px] ${product.stockQuantity <= 10 ? "text-red-400" : "text-foreground-muted"}`}>
                      {product.stockQuantity} in stock
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border-subtle bg-surface-1 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">Product</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">SKU</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">Category</th>
                   <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Price</th>
                   <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Stock</th>
                   <th className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">Status</th>
                   <th className="text-right px-4 py-3 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-border-invisible hover:bg-surface-1 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border border-border-subtle">
                          <ProductThumb name={product.name} category={product.category} className="w-full h-full" />
                        </div>
                        <span className="text-xs font-medium text-white">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-foreground-muted">{product.sku}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-foreground-secondary">{product.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-white">{formatCurrency(product.price, product.currency)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${product.stockQuantity <= 10 ? "text-red-400 font-medium" : "text-foreground-muted"}`}>
                        {product.stockQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={product.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="p-1.5 rounded-lg hover:bg-surface-2 text-foreground-muted hover:text-foreground-secondary transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Product Detail Modal */}
      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name}
        description={`SKU: ${selectedProduct?.sku}`}
        size="md"
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div className="relative h-48 rounded-xl overflow-hidden border border-border-subtle">
              <ProductThumb
                name={selectedProduct.name}
                category={selectedProduct.category}
                className="w-full h-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-surface-1 border border-border-invisible">
                <p className="text-[10px] text-foreground-muted uppercase">Price</p>
                <p className="text-sm text-white mt-0.5">{formatCurrency(selectedProduct.price, selectedProduct.currency)}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-1 border border-border-invisible">
                <p className="text-[10px] text-foreground-muted uppercase">Stock</p>
                <p className={`text-sm mt-0.5 ${selectedProduct.stockQuantity <= 10 ? "text-red-400" : "text-white"}`}>
                  {selectedProduct.stockQuantity} units
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-surface-1 border border-border-invisible">
                <p className="text-[10px] text-foreground-muted uppercase">Category</p>
                <p className="text-sm text-white mt-0.5">{selectedProduct.category}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-1 border border-border-invisible">
                <p className="text-[10px] text-foreground-muted uppercase">Status</p>
                <div className="mt-0.5">
                  <StatusPill status={selectedProduct.status} />
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
