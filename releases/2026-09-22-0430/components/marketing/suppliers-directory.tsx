"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  MapPin,
  Factory,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
} from "lucide-react";
import marketData from "@/data/egyptian-market-v2.json";

interface Supplier {
  id: string;
  name: string;
  city: string;
  governorate: string;
  category: string;
  industrial_zone: string;
  tax_id: string;
  monthly_capacity_egp: number;
}

const SUPPLIERS: Supplier[] = (marketData as any).suppliers || [];

const CATEGORY_LABELS: Record<string, string> = {
  chemicals: "Chemicals",
  glassware: "Glassware",
  food_ingredients: "Food Ingredients",
  poultry: "Poultry",
  dairy: "Dairy",
  meat: "Meat",
  seafood: "Seafood",
  linens: "Linens & Textiles",
  furniture: "Furniture",
  pharmaceuticals: "Pharmaceuticals",
  energy: "Energy",
  ceramics: "Ceramics",
  carpets: "Carpets",
  plastics: "Plastics",
  oils: "Oils & Fats",
  paper_products: "Paper Products",
  confectionery: "Confectionery",
  sugar: "Sugar",
  electronics: "Electronics",
  fresh_produce: "Fresh Produce",
  spices: "Spices",
  logistics: "Logistics",
  bakery: "Bakery",
  canned_goods: "Canned Goods",
  beverages: "Beverages",
};

const CATEGORY_COLORS: Record<string, string> = {
  chemicals: "var(--accent-base)",
  food_ingredients: "#1a5d1a",
  poultry: "#b8860b",
  meat: "var(--accent-base)",
  seafood: "#1e6091",
  dairy: "#4a7c59",
  beverages: "#8B4513",
  linens: "#6b4c7a",
  furniture: "#5d4e37",
  electronics: "#2c3e50",
  logistics: "#7f8c8d",
};

export function SuppliersDirectory() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    "all",
    ...Array.from(new Set(SUPPLIERS.map((s) => s.category))),
  ];

  const filtered = SUPPLIERS.filter((s) => {
    const matchesSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase()) ||
      s.industrial_zone.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "all" || s.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const totalCapacity = SUPPLIERS.reduce(
    (sum, s) => sum + s.monthly_capacity_egp,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[11px] font-semibold text-accent-base tracking-[0.18em] uppercase mb-3">
          Verified Supplier Network
        </p>
        <h1 className="text-[28px] md:text-[32px] font-bold text-white tracking-[-0.02em]">
          Egyptian Industrial Suppliers
        </h1>
        <p className="mt-2 text-[14px] text-gray-400 max-w-xl">
          {SUPPLIERS.length}+ verified suppliers from industrial clusters across
          Egypt. 6th of October, 10th of Ramadan, Damietta, Port Said, and
          Alexandria.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Suppliers",
            value: String(SUPPLIERS.length),
            icon: Building2,
          },
          {
            label: "Monthly Capacity",
            value: `EGP ${(totalCapacity / 1000000000).toFixed(1)}B`,
            icon: TrendingUp,
          },
          {
            label: "Industrial Zones",
            value: String(
              new Set(SUPPLIERS.map((s) => s.industrial_zone)).size
            ),
            icon: Factory,
          },
          {
            label: "Governorates",
            value: String(new Set(SUPPLIERS.map((s) => s.governorate)).size),
            icon: MapPin,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl bg-[#111] border border-white/10"
          >
            <stat.icon className="w-4 h-4 text-gray-600 mb-2" />
            <p className="text-[22px] font-bold text-white tracking-tight">
              {stat.value}
            </p>
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
        <input
          type="text"
          placeholder="Search suppliers by name, city, or industrial zone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-accent-base/40 transition-all"
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
              activeCategory === cat
                ? "bg-accent-base text-white"
                : "bg-[#111] text-gray-400 border border-white/10 hover:text-white hover:border-white/15"
            }`}
          >
            {cat === "all" ? "All Categories" : CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Supplier grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((supplier, i) => (
          <motion.div
            key={supplier.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.02 }}
            className="group p-5 rounded-xl bg-[#111] border border-white/10 hover:border-white/15 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-[11px] font-bold text-white"
                style={{
                  background:
                    CATEGORY_COLORS[supplier.category] || CATEGORY_COLORS.chemicals,
                }}
              >
                {supplier.name
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[9px] font-semibold text-emerald-600 uppercase tracking-wider">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Verified
              </span>
            </div>

            <h3 className="text-[14px] font-semibold text-white leading-snug mb-1 group-hover:text-accent-base transition-colors">
              {supplier.name}
            </h3>

            <p className="text-[11px] font-medium text-gray-500 mb-3">
              {CATEGORY_LABELS[supplier.category] || supplier.category}
            </p>

            <div className="space-y-1.5 text-[12px] text-gray-400">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-gray-600" />
                {supplier.city}, {supplier.governorate}
              </div>
              <div className="flex items-center gap-1.5">
                <Factory className="w-3 h-3 text-gray-600" />
                {supplier.industrial_zone}
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-gray-600" />
                EGP {(supplier.monthly_capacity_egp / 1000000).toFixed(1)}M/mo
                capacity
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <span className="text-[10px] font-mono text-gray-600">
                Tax ID: {supplier.tax_id}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Filter className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No suppliers match your search</p>
        </div>
      )}
    </div>
  );
}
