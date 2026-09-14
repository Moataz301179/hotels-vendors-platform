"use client";

import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import { Btn, PageHead, StatePill, T, Td, Th } from "@/components/ui";

const KIND_KEY: Record<string, string> = {
  hotel: "admin.tenants.kindHotel",
  supplier: "admin.tenants.kindSupplier",
  partner: "admin.tenants.kindPartner",
  carrier: "admin.tenants.kindCarrier",
};

export default function TenantsPage() {
  const { t, lang } = usePrefs();
  const { data, toggleTenant, toast } = useApp();

  return (
    <RequireAuth>
      <AppShell active="/admin/tenants">
        <Guard roles={["platform_admin"]}>
          <PageHead kicker={t("admin.k")} title={t("admin.tenants.t")} sub={t("admin.tenants.sub")} />
          <T>
            <thead>
              <tr>
                <Th>{t("common.name")}</Th>
                <Th>{t("admin.tenants.colKind")}</Th>
                <Th>{t("admin.tenants.colCity")}</Th>
                <Th className="text-end">{t("admin.tenants.colUsers")}</Th>
                <Th className="text-end">{t("admin.tenants.colSince")}</Th>
                <Th>{t("admin.tenants.colStatus")}</Th>
                <Th className="text-end">{t("common.actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {data.tenants.map((tn) => (
                <tr key={tn.id} className="hover:bg-fog-50 dark:hover:bg-ink-850">
                  <Td>
                    <span className="font-semibold">{lang === "ar" ? tn.nameAr : tn.name}</span>
                    <div className="tnum text-xs text-ink-400">{tn.id.toUpperCase()}</div>
                  </Td>
                  <Td>
                    <StatePill
                      s="active_t"
                      tone={tn.kind === "partner" ? "brass" : tn.kind === "hotel" ? "info" : tn.kind === "supplier" ? "ok" : "mute"}
                      label={t(KIND_KEY[tn.kind])}
                    />
                  </Td>
                  <Td className="text-[13px]">{tn.city}</Td>
                  <Td className="tnum text-end">{tn.users}</Td>
                  <Td className="tnum text-end">{tn.since}</Td>
                  <Td><StatePill s={tn.status} /></Td>
                  <Td className="text-end">
                    <Btn
                      size="sm"
                      variant={tn.status === "active" ? "outline" : "primary"}
                      onClick={() => {
                        toggleTenant(tn.id);
                        toast(t(tn.status === "active" ? "admin.tenants.suspended" : "admin.tenants.activated"), tn.status === "active" ? "warn" : "ok");
                      }}
                    >
                      {t(tn.status === "active" ? "admin.tenants.suspend" : "admin.tenants.reactivate")}
                    </Btn>
                  </Td>
                </tr>
              ))}
            </tbody>
          </T>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
