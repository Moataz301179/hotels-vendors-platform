import React from "react";
import { PackageSearch, ScanLine, Bell, MapPin, CheckCircle2, Truck, FileCheck } from "lucide-react";

/* Self-contained HOVIN phone mockup — renders the app UI inside a device frame.
   Pure UI chrome + label placeholders (no fabricated order/supplier data). */

export function HovinPhoneMockup() {
  return (
    <div className="relative mx-auto w-[290px] select-none">
      {/* Device frame */}
      <div className="rounded-[2.6rem] border-[10px] border-[#1c1c1e] bg-[#0F172A] shadow-[0_40px_80px_-20px_rgba(15,23,42,0.5)] overflow-hidden">
        {/* Notch / status */}
        <div className="relative h-9 flex items-center justify-center">
          <div className="w-24 h-6 rounded-full bg-[#1c1c1e]" />
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-white/60">9:41</div>
        </div>

        {/* App status bar */}
        <div className="px-4 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#314B43] flex items-center justify-center">
              <span className="text-[11px] font-bold text-white">H</span>
            </div>
            <span className="text-[12px] font-semibold text-white">HOVIN</span>
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <Bell size={13} />
            <div className="w-6 h-6 rounded-full bg-[#ABA294] flex items-center justify-center">
              <span className="text-[9px] font-bold text-[#4D4A46]">OP</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-2 flex gap-1 bg-white/[0.03] border-b border-white/10 pb-2">
          {["Orders", "Deliveries", "Invoices"].map((t, i) => (
            <span key={t} className={`px-2.5 py-1 rounded-md text-[10px] font-semibold ${i === 0 ? "bg-[#314B43] text-white" : "text-white/50"}`}>
              {t}
            </span>
          ))}
        </div>

        {/* Orders list */}
        <div className="px-4 py-3 space-y-2.5">
          <Section icon={PackageSearch} label="LIVE ORDER INBOX" pill="2 TO PICK" />
          {[0, 1].map((i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-white">Order #104{8 + i}</span>
                <span className="text-[9px] font-semibold text-[#ABA294]">HOTEL · READY</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[#8b93a7]">
                <span className="w-9 h-7 rounded bg-[#314B43]/40" />
                <span className="text-[10px] leading-tight">Linen pack × 12<br /><span className="text-white/40">FM Group · Cairo</span></span>
              </div>
            </div>
          ))}
        </div>

        {/* Dock scan CTA */}
        <div className="mx-4 rounded-xl bg-gradient-to-br from-[#314B43] to-[#24382E] p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
            <ScanLine size={16} className="text-white" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-white">Dock Scanner</div>
            <div className="text-[9px] text-white/60">Scan QR → GRN · instant credit notes</div>
          </div>
        </div>

        {/* Delivery track */}
        <div className="px-4 py-3 space-y-2.5 pb-8">
          <Section icon={Truck} label="IN TRANSIT" pill="1 TRUCK" />
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-white">Delivery · Sharm Resort</span>
              <span className="text-[9px] font-semibold text-[#ABA294]">GPS</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              {[0, 1, 2, 3].map((s) => (
                <div key={s} className={`h-1 flex-1 rounded-full ${s < 3 ? "bg-[#314B43]" : "bg-white/15"}`} />
              ))}
            </div>
            <div className="mt-1.5 flex items-center gap-1 text-[9px] text-white/40">
              <MapPin size={9} /> En route · ETA 14:20
            </div>
          </div>
        </div>

        {/* Home indicator */}
        <div className="pb-4 pt-1 flex justify-center">
          <div className="w-24 h-1 rounded-full bg-white/30" />
        </div>
      </div>

      {/* Floating "cash out" pill */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#ABA294] text-[#4D4A46] text-[11px] font-bold px-4 py-2 shadow-lg flex items-center gap-1.5">
        <FileCheck size={12} /> 48h cash-out
        <CheckCircle2 size={12} className="text-[#314B43]" />
      </div>
    </div>
  );
}

function Section({ icon: Icon, label, pill }: { icon: React.ElementType; label: string; pill: string }) {
  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-1.5 text-[#ABA294]">
        <Icon size={11} />
        <span className="text-[9px] font-semibold tracking-wider">{label}</span>
      </div>
      <span className="text-[8px] font-bold text-white px-1.5 py-0.5 rounded bg-[#314B43]">{pill}</span>
    </div>
  );
}