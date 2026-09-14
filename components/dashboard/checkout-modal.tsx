"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
}

export function CheckoutModal({ open, onClose }: CheckoutModalProps) {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [reference, setReference] = useState("");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-surface rounded-xl shadow-xl overflow-hidden border border-border-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-surface-raised">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Immediate Checkout</h2>
            <p className="text-xs text-foreground-secondary mt-0.5">Process a payment or settlement</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <FieldInput label="Amount (EGP)" value={amount} onChange={setAmount} placeholder="0.00" />
          <FieldInput label="Recipient" value={recipient} onChange={setRecipient} placeholder="Supplier name or IBAN" />
          <FieldInput label="Reference" value={reference} onChange={setReference} placeholder="Invoice or PO reference" />

          {/* Stripe Payment Element mount point */}
          <div
            id="stripe-payment-element-mount"
            className="min-h-12 mb-5 px-3 py-2 border border-dashed border-border-subtle rounded-lg bg-surface-raised flex items-center justify-center"
          >
            <span className="text-xs text-foreground-muted">Stripe Payment Element will mount here</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="text-xs font-medium px-5 py-2 rounded-lg border border-border-subtle text-foreground-secondary hover:text-foreground hover:bg-white/[0.03] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button className="text-xs font-medium px-5 py-2 rounded-lg bg-accent-base text-surface hover:bg-accent-dark transition-colors cursor-pointer">
              Process Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-foreground-secondary mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm px-3 py-2.5 rounded-lg border border-border-default bg-surface text-foreground placeholder:text-foreground-muted outline-none focus:border-accent-base/30 focus:ring-1 focus:ring-accent-base/10 transition-colors"
      />
    </div>
  );
}
