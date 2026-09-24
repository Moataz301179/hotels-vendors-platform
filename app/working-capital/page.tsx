"use client";

import { useState } from "react";
import Link from "next/link";
import { usePrefs } from "@/i18n/provider";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import { Btn, Card, PageHead, Stat } from "@/lib/stubs-export";
import { assessWorkingCapital, type WorkingCapitalDecision } from "@/lib/fintech/working-capital";
import type { Role } from "@/lib/types";

const HOTEL = ["hotel_admin", "gm", "finance_director"] as Role[];

export default function WorkingCapitalPage() {
  const { t, lang } = usePrefs();
  const [amount, setAmount] = useState(50000);
  const [decision, setDecision] = useState<WorkingCapitalDecision | null>(null);
  const [loading, setLoading] = useState(false);

  const doAssess = () => {
    setLoading(true);
    setTimeout(() => {
      const result = assessWorkingCapital({
        hotelId: "h1",
        orderValue: amount,
        supplierId: "s1",
        paymentTermsDays: 45,
        hotelCreditScore: 85,
      });
      setDecision(result);
      setLoading(false);
    }, 800);
  };

  return (
    <RequireAuth>
      <AppShell active="/working-capital">
        <Guard roles={HOTEL}>
          <PageHead kicker="Fintech" title="48-Hour Working Capital Engine" sub="Guaranteed supplier payouts with flexible hotel payment terms." />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-sm font-semibold">Assess Working Capital</h3>
              <p className="mt-1 text-xs text-ink-500">Auto-underwrite POs based on hotel historical payment data.</p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Order Value (EGP)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                    className="h-10 w-full rounded border border-line bg-transparent px-3 text-sm dark:border-linedark"
                  />
                </div>

                <Btn variant="primary" onClick={doAssess} disabled={loading}>
                  {loading ? "Assessing..." : "Assess Working Capital"}
                </Btn>
              </div>

              {decision && (
                <div className="mt-6 space-y-3">
                  <div className={`rounded-lg border p-4 ${decision.approved ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20" : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"}`}>
                    <div className={`text-sm font-bold ${decision.approved ? "text-emerald-800 dark:text-emerald-300" : "text-red-800 dark:text-red-300"}`}>
                      {decision.approved ? "Approved" : "Declined"}
                    </div>
                    <div className="mt-1 text-xs text-ink-500">{decision.explanation}</div>
                  </div>

                  {decision.approved && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-fog-50 p-3 dark:bg-ink-850">
                        <div className="text-xs text-ink-500">Max Advance</div>
                        <div className="tnum mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-400">EGP {decision.maxAdvance.toLocaleString()}</div>
                      </div>
                      <div className="rounded-lg bg-fog-50 p-3 dark:bg-ink-850">
                        <div className="text-xs text-ink-500">Advance Rate</div>
                        <div className="tnum mt-1 text-lg font-bold">{decision.advanceRate}%</div>
                      </div>
                      <div className="rounded-lg bg-fog-50 p-3 dark:bg-ink-850">
                        <div className="text-xs text-ink-500">Platform Fee (2%)</div>
                        <div className="tnum mt-1 text-lg font-bold text-brass-700 dark:text-brass-400">EGP {decision.platformFee.toLocaleString()}</div>
                      </div>
                      <div className="rounded-lg bg-fog-50 p-3 dark:bg-ink-850">
                        <div className="text-xs text-ink-500">Supplier Payout (48h)</div>
                        <div className="tnum mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-400">EGP {decision.supplierPayout.toLocaleString()}</div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg border border-line p-3 text-xs dark:border-linedark">
                    <div className="flex justify-between">
                      <span className="text-ink-500">Risk Level</span>
                      <span className={`font-bold ${decision.riskLevel === "low" ? "text-emerald-600" : decision.riskLevel === "medium" ? "text-amber-600" : "text-red-600"}`}>{decision.riskLevel}</span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-ink-500">Hotel Repayment</span>
                      <span className="font-medium">{decision.hotelRepaymentDate}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-semibold">Active Factoring Applications</h3>
              <div className="mt-4 space-y-3">
                {[
                  { id: "FA-001", hotel: "Nile Crown Hotel", supplier: "Misr F&B", amount: 125000, status: "funded", payout: 122500 },
                  { id: "FA-002", hotel: "Marina Bay Resort", supplier: "Nile HK", amount: 85000, status: "pending", payout: 83300 },
                  { id: "FA-003", hotel: "Old Corniche Grand", supplier: "Delta Eng.", amount: 45000, status: "repaid", payout: 44100 },
                ].map((app) => (
                  <div key={app.id} className="flex items-center justify-between rounded-lg border border-line p-3 dark:border-linedark">
                    <div>
                      <div className="text-sm font-medium">{app.hotel}</div>
                      <div className="text-xs text-ink-500">{app.supplier} · {app.id}</div>
                    </div>
                    <div className="text-end">
                      <div className="tnum text-sm font-bold">EGP {app.amount.toLocaleString()}</div>
                      <div className={`text-[11px] font-medium ${app.status === "funded" ? "text-emerald-600" : app.status === "pending" ? "text-amber-600" : "text-gray-500"}`}>{app.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
