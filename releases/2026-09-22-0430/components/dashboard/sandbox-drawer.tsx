"use client";

import { useState } from "react";
import { X, FileText, Receipt, Landmark, ChevronRight, CheckCircle2 } from "lucide-react";

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
  } | null;
}

export function SandboxDrawer({ open, onClose, order }: SandboxDrawerProps) {
  const [activeTab, setActiveTab] = useState<"grn" | "eta" | "factoring">("grn");

  if (!open || !order) return null;

  const etaPayload = {
    uuid: order.etaInvoiceUuid || `ETA-${Date.now().toString(36).toUpperCase()}`,
    seller: { taxId: "382-910-112", name: order.supplier },
    buyer: { taxId: "382-910-113", name: order.hotel },
    items: order.items.map((i) => ({ ...i, total: i.qty * i.price })),
    totalAmount: order.total,
    currency: "EGP",
    qrCode: `QR:ETA:${order.id}`,
  };

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
            { id: "eta", label: "ETA e-Invoice", icon: Receipt },
            { id: "factoring", label: "48h Factoring", icon: Landmark },
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
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500 mb-1">Digital GRN Status</div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700">Goods Received & Verified</span>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                {order.grnStatus || "All items scanned and matched against PO. No damages reported."}
              </div>
            </div>
          )}

          {activeTab === "eta" && (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500 mb-2">ETA e-Invoice JSON Payload</div>
                <pre className="text-[10px] text-slate-700 font-mono bg-white p-2 rounded border border-slate-200 overflow-x-auto">
{`{
  "uuid": "${etaPayload.uuid}",
  "seller": { "taxId": "${etaPayload.seller.taxId}" },
  "buyer": { "taxId": "${etaPayload.buyer.taxId}" },
  "items": ${etaPayload.items.length},
  "totalAmount": ${etaPayload.totalAmount},
  "qrCode": "${etaPayload.qrCode}"
}`}
                </pre>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                <CheckCircle2 size={12} />
                ETA e-Invoice generated & submitted
              </div>
            </div>
          )}

          {activeTab === "factoring" && (
            <div className="space-y-3">
              <div className="p-4 rounded-md border border-slate-200 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center">
                    <Landmark size={14} className="text-emerald-700" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">48-Hour Factoring via Oliv</div>
                    <div className="text-[11px] text-slate-500">FRA compliant · Non-recourse</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice Amount</span>
                    <span className="text-slate-900 font-medium">EGP {order.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Factoring Rate</span>
                    <span className="text-slate-900 font-medium">2.1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fee</span>
                    <span className="text-slate-900 font-medium">EGP {(order.total * 0.021).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100">
                    <span className="text-slate-900 font-semibold">Net Payout</span>
                    <span className="text-emerald-700 font-semibold">EGP {(order.total * 0.979).toLocaleString()}</span>
                  </div>
                </div>

                <button className="w-full mt-3 py-2.5 rounded-md bg-[#314B43] text-white text-xs font-semibold hover:bg-[#3a544a] transition-colors flex items-center justify-center gap-2">
                  Trigger 48h Cash-Out via Oliv
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="text-[10px] text-slate-400 text-center">
                Funds disbursed within 38–48 hours via InstaPay / Bank Transfer
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}