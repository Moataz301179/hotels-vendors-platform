"use client";

import { useMemo, useState } from "react";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import { fmtDateTime } from "@/lib/format";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import { EmptyState, PageHead, Pager, T, Td, TextInput, Th } from "@/components/ui";
import { IcHistory, IcSearch } from "@/components/icons";

const PAGE_SIZE = 10;

export default function AuditPage() {
  const { t, lang } = usePrefs();
  const { data } = useApp();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const list = useMemo(() => {
    if (!q.trim()) return data.audit;
    const s = q.trim().toLowerCase();
    return data.audit.filter(
      (a) =>
        a.actor.toLowerCase().includes(s) ||
        a.entity.toLowerCase().includes(s) ||
        a.action.toLowerCase().includes(s) ||
        a.detail.toLowerCase().includes(s) ||
        a.detailAr.includes(q.trim())
    );
  }, [data.audit, q]);

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const cur = Math.min(page, pages);
  const slice = list.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);

  return (
    <RequireAuth>
      <AppShell active="/admin/audit">
        <Guard roles={["platform_admin"]}>
          <PageHead
            kicker={t("admin.k")}
            title={t("admin.audit.t")}
            sub={t("admin.audit.sub")}
            actions={
              <div className="relative w-72 max-w-full">
                <IcSearch className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <TextInput
                  className="ps-10"
                  placeholder={t("admin.audit.searchPh")}
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  aria-label={t("common.search")}
                />
              </div>
            }
          />

          {slice.length === 0 ? (
            <EmptyState icon={<IcHistory />} title={t("admin.audit.noMatches")} sub={`${list.length} ${t("common.results")}`} />
          ) : (
            <>
              <T minWidth="min-w-[900px]">
                <thead>
                  <tr>
                    <Th>{t("admin.audit.colAt")}</Th>
                    <Th>{t("admin.audit.colActor")}</Th>
                    <Th>{t("admin.audit.colRole")}</Th>
                    <Th>{t("admin.audit.colAction")}</Th>
                    <Th>{t("admin.audit.colEntity")}</Th>
                    <Th>{t("admin.audit.colDetail")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {slice.map((a) => (
                    <tr key={a.id} className="align-top hover:bg-fog-50 dark:hover:bg-ink-850">
                      <Td className="tnum whitespace-nowrap text-[13px] text-ink-500">{fmtDateTime(a.at, lang)}</Td>
                      <Td>
                        <div className="text-[13px] font-medium">{a.actor}</div>
                      </Td>
                      <Td className="whitespace-nowrap text-[12px] text-ink-500">{t(`role.${a.role}`)}</Td>
                      <Td>
                        <span className="tnum rounded bg-ink-950 px-2 py-1 font-mono text-[11px] font-semibold text-brass-300 dark:bg-white/10">
                          {a.action}
                        </span>
                      </Td>
                      <Td className="tnum text-[13px] font-medium">{a.entity}</Td>
                      <Td className="text-[13px] text-ink-500 dark:text-ink-400">{lang === "ar" ? a.detailAr || a.detail : a.detail}</Td>
                    </tr>
                  ))}
                </tbody>
              </T>
              <Pager page={cur} pages={pages} onPage={setPage} />
            </>
          )}
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
