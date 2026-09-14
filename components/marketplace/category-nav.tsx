"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UtensilsCrossed,
  Sparkles,
  Bath,
  Wrench,
  Sofa,
  Briefcase,
  Shirt,
  Droplets,
  Monitor,
  Shield,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { HOTEL_CATEGORIES, type HotelCategory } from "@/lib/marketplace/categories";

const ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Sparkles,
  Bath,
  Wrench,
  Sofa,
  Briefcase,
  Shirt,
  Droplets,
  Monitor,
  Shield,
};

interface CategoryNavProps {
  activeCategory?: string;
  onSelectCategory: (id: string) => void;
  counts?: Record<string, number>;
}

export function CategoryNav({ activeCategory, onSelectCategory, counts = {} }: CategoryNavProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  return (
    <div className="relative">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2 px-1">
        <button
          onClick={() => onSelectCategory("")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
            !activeCategory
              ? "bg-accent-base text-white shadow-[0_0_16px_rgba(139,10,30,0.3)]"
              : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
          }`}
        >
          All
        </button>
        {HOTEL_CATEGORIES.map((cat) => {
          const Icon = ICON_MAP[cat.icon] || Shield;
          const isActive = activeCategory === cat.id;
          const isHovered = hoveredCategory === cat.id;
          const count = counts[cat.id] ?? 0;

          return (
            <div
              key={cat.id}
              className="relative"
              onMouseEnter={() => setHoveredCategory(cat.id)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <button
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-accent-base text-white shadow-[0_0_16px_rgba(139,10,30,0.3)]"
                    : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{cat.label}</span>
                <span className="sm:hidden">{cat.code}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-white/20 text-white/80" : "bg-white/[0.06] text-white/30"
                  }`}>
                    {count}
                  </span>
                )}
              </button>

              {/* Dropdown with examples */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1 w-64 rounded-xl border border-white/[0.08] bg-[#0a0a0a]/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-[#a68b5a]" />
                        <span className="text-sm font-semibold">{cat.label}</span>
                        <span className="text-[10px] text-white/30">{cat.code}</span>
                      </div>
                      <p className="text-xs text-white/40 mt-1 leading-relaxed">{cat.description}</p>
                    </div>
                    <div className="p-2">
                      {cat.examples.map((ex) => (
                        <button
                          key={ex}
                          onClick={() => onSelectCategory(cat.id)}
                          className="flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors"
                        >
                          <span>{ex}</span>
                          <ChevronRight className="w-3 h-3 text-white/20" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
