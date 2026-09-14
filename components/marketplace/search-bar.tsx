"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, SlidersHorizontal, TrendingUp, Clock, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HOTEL_CATEGORIES } from "@/lib/marketplace/categories";

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  placeholder?: string;
  suggestions?: string[];
  recentSearches?: string[];
  trending?: string[];
}

export interface SearchFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  minRating?: number;
  inStockOnly?: boolean;
  supplierTier?: string;
  city?: string;
}

export function SearchBar({
  onSearch,
  placeholder = "Search products, suppliers, SKUs...",
  suggestions = [],
  recentSearches = [],
  trending = [],
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim(), filters);
    setIsFocused(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion, filters);
    setIsFocused(false);
  };

  const activeFilterCount = [
    filters.priceMin, filters.priceMax, filters.minRating,
    filters.inStockOnly, filters.supplierTier, filters.city, filters.category,
  ].filter(Boolean).length;

  return (
    <div ref={containerRef} className="relative w-full max-w-3xl">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`flex items-center gap-3 rounded-xl border bg-white/[0.03] px-4 py-3 transition-all duration-200 ${
            isFocused
              ? "border-accent-base/50 shadow-[0_0_20px_rgba(139,10,30,0.15)]"
              : "border-white/[0.08] hover:border-white/[0.12]"
          }`}
        >
          <Search className="w-5 h-5 text-white/30 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`relative p-1.5 rounded-lg transition-colors ${
              showFilters ? "bg-accent-base/20 text-[#a68b5a]" : "text-white/30 hover:text-white/60"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-base text-white text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-accent-base hover:bg-error text-white text-sm font-medium transition-colors"
          >
            Search
          </button>
        </div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {isFocused && (suggestions.length > 0 || recentSearches.length > 0 || trending.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-white/[0.08] bg-surface/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50"
            >
              {recentSearches.length > 0 && (
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-wider text-white/30 font-semibold">
                    <Clock className="w-3 h-3" />
                    <span>Recent</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSuggestionClick(s)}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white/60 hover:text-white hover:border-white/[0.12] transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {trending.length > 0 && (
                <div className="px-3 pb-3">
                  <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-wider text-white/30 font-semibold">
                    <TrendingUp className="w-3 h-3" />
                    <span>Trending</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {trending.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSuggestionClick(s)}
                        className="px-2.5 py-1 rounded-lg bg-accent-base/10 border border-accent-base/20 text-xs text-[#a68b5a]/80 hover:text-[#a68b5a] hover:border-accent-base/40 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <FilterSelect
                label="Category"
                icon={<Tag className="w-3 h-3" />}
                value={filters.category}
                options={[{ label: "All Categories", value: "" }, ...HOTEL_CATEGORIES.map((c) => ({ label: c.label, value: c.id }))]}
                onChange={(v) => setFilters({ ...filters, category: v || undefined })}
              />
              <FilterField label="Min Price" type="number" value={filters.priceMin} onChange={(v) => setFilters({ ...filters, priceMin: v })} />
              <FilterField label="Max Price" type="number" value={filters.priceMax} onChange={(v) => setFilters({ ...filters, priceMax: v })} />
              <FilterSelect
                label="Min Rating"
                value={filters.minRating}
                options={[{ label: "Any", value: "" }, { label: "3+", value: "3" }, { label: "4+", value: "4" }, { label: "4.5+", value: "4.5" }, { label: "5", value: "5" }]}
                onChange={(v) => setFilters({ ...filters, minRating: v ? Number(v) : undefined })}
              />
              <FilterSelect
                label="Supplier Tier"
                value={filters.supplierTier}
                options={[{ label: "Any", value: "" }, { label: "Core", value: "CORE" }, { label: "Premier", value: "PREMIER" }, { label: "Verified", value: "VERIFIED" }]}
                onChange={(v) => setFilters({ ...filters, supplierTier: v || undefined })}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterField({ label, type, value, onChange }: { label: string; type: string; value?: number; onChange: (v: number | undefined) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/20 outline-none focus:border-accent-base/50 transition-colors"
      />
    </div>
  );
}

function FilterSelect({
  label,
  icon,
  value,
  options,
  onChange,
}: {
  label: string;
  icon?: React.ReactNode;
  value?: string | number;
  options: { label: string; value: string | number }[];
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/40 font-semibold">
        {icon}
        <span>{label}</span>
      </label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
        className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white outline-none focus:border-accent-base/50 transition-colors appearance-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface">{o.label}</option>
        ))}
      </select>
    </div>
  );
}
