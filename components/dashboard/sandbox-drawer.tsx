"use client";

import { useState } from "react";
import { X, FileText, Landmark } from "lucide-react";

interface SandboxDrawerProps {
  open: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderNumber: string;
    supplier: string;
    hotel: string;
    items: Array<{ name: string; qty: number; price: number }>;
    total: number;
    status: string;
    etaInvoiceUuid?: string;
    grnStatus?: string;
    supplierTaxId?: string;
    hotelTaxId?: string;
  } | null;
}

export function SandboxDrawer({ open, onClose, order }: SandboxDrawerProps) {
  const [activeTab, setActiveTab] = useState<"grn" | "factoring">("grn");

  if (!open || !order) return null;


  return (
    <>
      <div className="fixed inset-0 bg-[#314B43]/30 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-slate-200 shadow-none z-50 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white">
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Order Details</div>
            <div className="text-sm font-semibold text-slate-900 mt-0.5">{order.orderNumber}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Order summary */}
        <div className="px-5 py-3 border-b border-slate-100 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Supplier</span>
            <span className="text-slate-900 font-medium">{order.supplier}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Hotel</span>
            <span className="text-slate-900 font-medium">{order.hotel}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Status</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
              {order.status}
            </span>
          </div>
        </div>

        {/* Items */}
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">Line Items</div>
          <div className="space-y-1.5">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-xs py-1">
                <span className="text-slate-700">{item.name} × {item.qty}</span>
                <span className="text-slate-900 font-medium">EGP {(item.qty * item.price).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm font-semibold pt-2 mt-2 border-t border-slate-100">
            <span className="text-slate-900">Total</span>
            <span className="text-slate-900">EGP {order.total.toLocaleString()}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {[
            { id: "grn", label: "Goods Received Note", icon: FileText },
            { id: "factoring", label: "Financing", icon: Landmark },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="px-5 py-4">
          {activeTab === "grn" && (
            <div className="space-y-3">
              <h3 className="text-xs font-medium">Goods receipt status</h3>
              <p className="text-xs text-slate-500">{order.grnStatus || "No goods receipt status provided."}</p>
              <p className="text-xs text-slate-500">Receipt verification is recorded by the authorized receiving workflow.</p>
            </div>
          )}
          {activeTab === "factoring" && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Financing eligibility</h3>
              <p className="text-xs text-slate-500">No approved financing offer was provided for this order. Availability, fees, payout timing and terms require a verified offer from a financing partner.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
