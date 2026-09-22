"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Scale, ArrowRight, Star, Package, Truck, MapPin } from "lucide-react";
import { useCompare } from "./compare-context";
import { getCategoryById } from "@/lib/marketplace/categories";
import Link from "next/link";

export function CompareDrawer() {
  const { items, removeItem, isOpen, setIsOpen, clearAll } = useCompare();

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat("en-EG", { style: "currency", currency, minimumFractionDigits: 0 }).format(price);

  return (
    <>
      {/* Floating Compare Bar */}
      <AnimatePresence>
        {items.length > 0 && !isOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-3 px-5 py-3 rounded-xl bg-accent-base hover:bg-error text-white shadow-black/40 transition-colors"
            >
              <Scale className="w-5 h-5" />
              <span className="text-sm font-medium">Compare ({items.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Compare Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl border-t border-white/[0.08] bg-surface overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <Scale className="w-5 h-5 text-[#a68b5a]" />
                  <h2 className="text-lg font-semibold">Product Comparison</h2>
                  <span className="text-sm text-white/40">{items.length} items</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearAll}
                    className="px-3 py-1.5 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto p-6">
                <div className="min-w-[800px]">
                  {/* Product Headers */}
                  <div className="grid gap-4" style={{ gridTemplateColumns: `160px repeat(${items.length}, 1fr)` }}>
                    <div className="text-[10px] uppercase tracking-wider text-white/30 font-semibold py-2">Attribute</div>
                    {items.map((item) => (
                      <div key={item.id} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-base/15 text-[#a68b5a] border border-accent-base/25">
                            {getCategoryById(item.category)?.code || item.category}
                          </span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-white/20 hover:text-red-400 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <Link
                          href={`/marketplace/${item.id}`}
                          className="text-sm font-medium text-white/90 hover:text-[#a68b5a] transition-colors line-clamp-2 min-h-[2.5rem]"
                        >
                          {item.name}
                        </Link>
                      </div>
                    ))}
                  </div>

                  {/* Rows */}
                  {[
                    { label: "Price", icon: null, render: (i: typeof items[0]) => formatPrice(i.unitPrice, i.currency) },
                    { label: "Min Order", icon: Package, render: (i: typeof items[0]) => `${i.minOrderQty} ${i.unitOfMeasure}` },
                    { label: "Stock", icon: Package, render: (i: typeof items[0]) => `${i.stockQuantity} ${i.unitOfMeasure}` },
                    { label: "Lead Time", icon: Truck, render: (i: typeof items[0]) => `${i.leadTimeDays} days` },
                    { label: "Supplier", icon: null, render: (i: typeof items[0]) => i.supplierName },
                    { label: "Rating", icon: Star, render: (i: typeof items[0]) => `${i.supplierRating.toFixed(1)} / 5.0` },
                    { label: "Tier", icon: null, render: (i: typeof items[0]) => i.supplierTier },
                    { label: "City", icon: MapPin, render: (i: typeof items[0]) => i.supplierCity },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="grid gap-4 border-t border-white/[0.04]"
                      style={{ gridTemplateColumns: `160px repeat(${items.length}, 1fr)` }}
                    >
                      <div className="flex items-center gap-2 py-3 text-xs text-white/40 font-medium">
                        {row.icon && <row.icon className="w-3.5 h-3.5" />}
                        <span>{row.label}</span>
                      </div>
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center py-3 px-3 text-sm text-white/70">
                          {row.label === "Price" ? (
                            <span className="text-lg font-bold text-white">{row.render(item)}</span>
                          ) : row.label === "Rating" ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <span>{row.render(item)}</span>
                            </div>
                          ) : (
                            <span>{row.render(item)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
