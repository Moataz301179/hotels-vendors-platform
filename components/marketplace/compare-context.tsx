"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface CompareItem {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  currency: string;
  supplierName: string;
  supplierRating: number;
  supplierTier: string;
  supplierCity: string;
  stockQuantity: number;
  leadTimeDays: number;
  minOrderQty: number;
  unitOfMeasure: string;
}

interface CompareContextType {
  items: CompareItem[];
  addItem: (item: CompareItem) => void;
  removeItem: (id: string) => void;
  isInCompare: (id: string) => boolean;
  clearAll: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CompareContext = createContext<CompareContextType | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((item: CompareItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      if (prev.length >= 4) return prev; // max 4 items
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const isInCompare = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items]
  );

  const clearAll = useCallback(() => {
    setItems([]);
    setIsOpen(false);
  }, []);

  return (
    <CompareContext.Provider
      value={{ items, addItem, removeItem, isInCompare, clearAll, isOpen, setIsOpen }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
