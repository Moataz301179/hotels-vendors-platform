"use client";

import { useState } from "react";
import Link from "next/link";

type Item = { id: string; name: string; qty: number; unit: string; price: number };

export default function DemoPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<Item[]>([]);

  function parseCSV(text: string) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsed: Item[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      if (cols.length >= 4) {
        parsed.push({ id: String(i), name: cols[0], qty: Number(cols[1]) || 1, unit: cols[2] || "pcs", price: Number(cols[3]) || 0 });
      }
    }
    return parsed;
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const parsed = parseCSV(text);
      setItems(parsed);
    };
    reader.readAsText(f);
  }

  function addToCart(item: Item) {
    setCart((c) => [...c, item]);
  }

  function removeFromCart(idx: number) {
    setCart((c) => c.filter((_, i) => i !== idx));
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className="min-h-screen bg-[#0c0c12] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Live Demo — Inventory Upload & Checkout</h1>
        <p className="text-sm text-white/60 mb-4">Upload a CSV with columns: name,qty,unit,price to seed demo inventory. Proceed to checkout without a payment step.</p>

        <div className="mb-4">
          <input type="file" accept=".csv,text/csv" onChange={handleFile} className="text-sm" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/3 rounded">
            <h2 className="font-semibold mb-2">Inventory</h2>
            {items.length === 0 && <p className="text-sm text-white/50">No items yet. Upload a CSV or add some rows.</p>}
            <ul className="space-y-2">
              {items.map((it) => (
                <li key={it.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{it.name}</div>
                    <div className="text-sm text-white/50">{it.qty} {it.unit} · EGP {it.price}</div>
                  </div>
                  <button onClick={() => addToCart(it)} className="ml-4 px-3 py-1 bg-accent-base text-black rounded">Add</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-white/3 rounded">
            <h2 className="font-semibold mb-2">Cart</h2>
            {cart.length === 0 && <p className="text-sm text-white/50">Cart is empty.</p>}
            <ul className="space-y-2">
              {cart.map((it, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{it.name}</div>
                    <div className="text-sm text-white/50">{it.qty} {it.unit} · EGP {it.price}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeFromCart(idx)} className="px-2 py-1 bg-red-600 rounded">Remove</button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t pt-3 text-right">
              <div className="text-sm text-white/60">Total</div>
              <div className="text-lg font-bold">EGP {total.toFixed(2)}</div>
              <Link href="/demo/checkout" className="inline-block mt-3 px-4 py-2 bg-white text-black rounded">Proceed to Checkout (No Payment)</Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-sm text-white/50">Tip: For quick demo CSV, use: <code>item name,qty,unit,price</code> then rows, e.g. <code>Water Bottle,10,pcs,12</code></div>
      </div>
    </div>
  );
}
