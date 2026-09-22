"use client";

import { useState } from "react";
import { Building2, ChevronDown, Plus } from "lucide-react";

interface Property {
  id: string;
  name: string;
  city: string;
  roomCount?: number;
}

interface MultiPropertySwitcherProps {
  properties: Property[];
  activeId?: string;
  onChange?: (property: Property) => void;
}

export function MultiPropertySwitcher({ properties, activeId, onChange }: MultiPropertySwitcherProps) {
  const [open, setOpen] = useState(false);
  const active = properties.find((p) => p.id === activeId) || properties[0];

  if (!properties.length) return null;
  if (properties.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
        <Building2 size={14} className="text-foreground-muted" />
        <span className="text-sm text-white">{properties[0].name}</span>
        <span className="text-[10px] text-foreground-muted">{properties[0].city}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
      >
        <Building2 size={14} className="text-foreground-muted" />
        <span className="text-sm text-white">{active?.name}</span>
        <span className="text-[10px] text-foreground-muted">{active?.city}</span>
        <ChevronDown size={14} className={`text-foreground-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-64 rounded-xl border border-white/[0.08] bg-surface-1 shadow-2xl z-20 py-1">
            {properties.map((p) => (
              <button
                key={p.id}
                onClick={() => { onChange?.(p); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.04] transition-colors ${
                  p.id === activeId ? "bg-white/[0.03]" : ""
                }`}
              >
                <Building2 size={14} className={p.id === activeId ? "text-accent-base" : "text-foreground-muted"} />
                <div>
                  <div className="text-sm text-white">{p.name}</div>
                  <div className="text-[10px] text-foreground-muted">{p.city}{p.roomCount ? ` · ${p.roomCount} rooms` : ""}</div>
                </div>
                {p.id === activeId && <div className="ml-auto w-2 h-2 rounded-full bg-accent-base" />}
              </button>
            ))}
            <div className="border-t border-white/[0.06] mt-1 pt-1">
              <button className="w-full flex items-center gap-2 px-4 py-2 text-xs text-foreground-muted hover:text-white hover:bg-white/[0.04] transition-colors">
                <Plus size={12} />
                Add Property
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}