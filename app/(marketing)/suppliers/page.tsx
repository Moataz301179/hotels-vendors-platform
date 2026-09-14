"use client";

import Link from "next/link";
import { usePrefs } from "@/i18n/provider";
import { CATEGORIES, SUPPLIERS } from "@/lib/data";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import { Card, PageHead, btnCls } from "@/components/ui";
import { IcArrow, IcMail, IcPhone, IcPin, IcWarehouse } from "@/components/icons";
import type { Role } from "@/lib/types";

const HOTEL: Role[] = ["hotel_admin", "gm", "finance_director"];

export default function SuppliersPage() {
  const { t, lang } = usePrefs();
  const nm = (e: string, a: string) => (lang === "ar" ? a : e);

  return (
    <RequireAuth>
      <AppShell active="/suppliers">
        <Guard roles={[...HOTEL, "platform_admin"]}>
          <PageHead kicker={t("suppliers.k")} title={t("suppliers.t")} sub={t("suppliers.sub")} />
          <div className="grid gap-5 lg:grid-cols-3">
            {SUPPLIERS.map((s) => {
              return (
                <Card key={s.id} className="flex flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight">{nm(s.name, s.nameAr)}</h2>
                      <div className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-500 dark:text-ink-400">
                        <IcPin className="text-brass-600 dark:text-brass-400" /> {s.city}
                      </div>
                    </div>
                    <span className="rounded-full border border-emerald-600/25 bg-emerald-600/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                      {t("suppliers.vatReg")}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {s.categories.map((c) => (
                      <span key={c} className="rounded-full bg-fog-100 px-2.5 py-1 text-[11px] font-semibold text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                        {nm(CATEGORIES.find((x) => x.id === c)?.name ?? "", CATEGORIES.find((x) => x.id === c)?.nameAr ?? "")}
                      </span>
                    ))}
                  </div>
                  <dl className="mt-5 space-y-2.5 text-[13px] text-ink-600 dark:text-ink-300">
                    <div className="flex items-center gap-2">
                      <IcWarehouse className="shrink-0 text-brass-600 dark:text-brass-400" />
                      <span>{nm(s.coverage, s.coverageAr)}</span>
                    </div>
                    <div className="tnum flex items-center gap-2">
                      <IcArrow className="shrink-0 text-brass-600 dark:text-brass-400" />
                      <span>{t("suppliers.lead", { a: s.leadDays[0], b: s.leadDays[1] })}</span>
                    </div>
                    <div className="tnum flex items-center gap-2">
                      <IcPhone className="shrink-0 text-brass-600 dark:text-brass-400" />
                      <span dir="ltr">{s.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IcMail className="shrink-0 text-brass-600 dark:text-brass-400" />
                      <span>{s.email}</span>
                    </div>
                  </dl>
                  <div className="mt-auto pt-6">
                    <Link href="/marketplace" className={btnCls("outline", "sm")}>
                      {t("suppliers.catalog")}
                      <IcArrow className="rtl:-scale-x-100" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
