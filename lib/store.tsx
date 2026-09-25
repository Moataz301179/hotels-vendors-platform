"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface CartLine {
  productId: string;
  qty: number;
}

export interface Toast {
  id: number;
  msg: string;
  tone: "ok" | "warn" | "bad";
}

interface StoreShape {
  cart: CartLine[];
  toasts: Toast[];
  cartAdd: (productId: string, qty?: number) => void;
  cartSetQty: (productId: string, qty: number) => void;
  cartRemove: (productId: string) => void;
  cartClear: () => void;
  cartCount: number;
  toast: (msg: string, tone?: Toast["tone"]) => void;
}

const Ctx = createContext<StoreShape | null>(null);

const CART_KEY = "hv:cart";

function loadCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

let toastSeq = 1;

export function AppProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    setCart(loadCart());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart]);

  const toast = useCallback((msg: string, tone: Toast["tone"] = "ok") => {
    const id = toastSeq++;
    setToasts((t) => [...t, { id, msg, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const cartAdd = useCallback((productId: string, qty: number = 1) => {
    setCart((c) => {
      const ex = c.find((l) => l.productId === productId);
      if (ex) return c.map((l) => (l.productId === productId ? { ...l, qty: l.qty + qty } : l));
      return [...c, { productId, qty }];
    });
  }, []);

  const cartSetQty = useCallback((productId: string, qty: number) => {
    setCart((c) =>
      qty <= 0
        ? c.filter((l) => l.productId !== productId)
        : c.map((l) => (l.productId === productId ? { ...l, qty } : l))
    );
  }, []);

  const cartRemove = useCallback((productId: string) => {
    setCart((c) => c.filter((l) => l.productId !== productId));
  }, []);

  const cartClear = useCallback(() => setCart([]), []);

  const cartCount = useMemo(() => cart.reduce((a, l) => a + l.qty, 0), [cart]);

  const value = useMemo(
    () => ({
      cart,
      toasts,
      cartAdd,
      cartSetQty,
      cartRemove,
      cartClear,
      cartCount,
      toast,
    }),
    [cart, toasts, cartAdd, cartSetQty, cartRemove, cartClear, cartCount, toast]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): StoreShape {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function ToastHost() {
  const { toasts } = useApp();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            t.tone === "ok"
              ? "bg-green-600 text-white"
              : t.tone === "warn"
              ? "bg-yellow-500 text-black"
              : "bg-red-600 text-white"
          }`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
