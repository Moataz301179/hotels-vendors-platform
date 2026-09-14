"use client";

import { usePrefs } from "@/i18n/provider";
import { USERS } from "@/lib/seed";
import { hotelById, supplierById, partnerById, carrierById } from "@/lib/data";
import { fmtDateTime } from "@/lib/format";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import { Card, PageHead, StatePill, T, Td, Th } from "@/components/ui";
import { IcCheck, IcX } from "@/components/icons";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["hotel_admin", "gm", "finance_director", "supplier_manager", "partner_officer", "carrier", "platform_admin"];

const MATRIX: { key: string; roles: Role[] }[] = [
  { key: "admin.users.pBrowse", roles: ["hotel_admin", "gm", "finance_director", "platform_admin"] },
  { key: "admin.users.pCart", roles: ["hotel_admin"] },
  { key: "admin.users.pApprove", roles: ["gm", "finance_director"] },
  { key: "admin.users.pReceive", roles: ["hotel_admin", "finance_director"] },
  { key: "admin.users.pInvoiceApprove", roles: ["hotel_admin", "finance_director"] },
  { key: "admin.users.pCatalog", roles: ["supplier_manager"] },
  { key: "admin.users.pFulfill", roles: ["supplier_manager"] },
  { key: "admin.users.pInvoiceSubmit", roles: ["supplier_manager"] },
  { key: "admin.users.pFinApply", roles: ["hotel_admin"] },
  { key: "admin.users.pFinDecide", roles: ["partner_officer"] },
  { key: "admin.users.pCarrier", roles: ["carrier"] },
  { key: "admin.users.pAdmin", roles: ["platform_admin"] },
];

function orgName(orgId: string, orgType: string) {
  if (orgType === "hotel") return hotelById(orgId)?.name ?? orgId;
  if (orgType === "supplier") return supplierById(orgId)?.name ?? orgId;
  if (orgType === "partner") return partnerById(orgId)?.name ?? orgId;
  if (orgType === "carrier") return carrierById(orgId)?.name ?? orgId;
  return "HotelsVendors Platform";
}

export default function UsersPage() {
  const { t, lang } = usePrefs();

  return (
    <RequireAuth>
      <AppShell active="/admin/users">
        <Guard roles={["platform_admin"]}>
          <PageHead kicker={t("admin.k")} title={t("admin.users.t")} sub={t("admin.users.sub")} />

          <T minWidth="min-w-[860px]">
            <thead>
              <tr>
                <Th>{t("admin.users.colUser")}</Th>
                <Th>{t("admin.users.colOrg")}</Th>
                <Th>{t("admin.users.colRole")}</Th>
                <Th>{t("admin.users.colTitle")}</Th>
                <Th className="text-end">{t("admin.users.colLast")}</Th>
              </tr>
            </thead>
            <tbody>
              {USERS.map((u) => (
                <tr key={u.id} className="hover:bg-fog-50 dark:hover:bg-ink-850">
                  <Td>
                    <span className="font-semibold">{lang === "ar" ? u.nameAr : u.name}</span>
                  </Td>
                  <Td className="text-[13px]">{orgName(u.orgId, u.orgType)}</Td>
                  <Td>
                    <StatePill
                      s="active_t"
                      tone={u.role === "platform_admin" ? "brass" : u.role === "gm" || u.role === "finance_director" ? "info" : u.role === "partner_officer" ? "brass" : "mute"}
                      label={t(`role.${u.role}`)}
                    />
                  </Td>
                  <Td className="text-[13px] text-ink-500 dark:text-ink-400">{lang === "ar" ? u.titleAr : u.title}</Td>
                  <Td className="tnum text-end text-[13px] text-ink-500">{fmtDateTime(u.lastActive, lang)}</Td>
                </tr>
              ))}
            </tbody>
          </T>

          <Card className="mt-6 overflow-hidden">
            <div className="border-b border-line px-6 py-4 dark:border-linedark">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-500 dark:text-ink-400">
                {t("admin.users.matrix")}
              </h2>
            </div>
            <T minWidth="min-w-[900px]">
              <thead>
                <tr>
                  <Th>{t("common.actions")}</Th>
                  {ROLES.map((r) => (
                    <Th key={r} className="text-center">{t(`role.${r}`)}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((m) => (
                  <tr key={m.key} className="hover:bg-fog-50 dark:hover:bg-ink-850">
                    <Td className="text-[13px] font-medium">{t(m.key)}</Td>
                    {ROLES.map((r) => (
                      <Td key={r} className="text-center">
                        {m.roles.includes(r) ? (
                          <IcCheck className="inline text-emerald-600" />
                        ) : (
                          <IcX className="inline text-ink-300 dark:text-ink-600" />
                        )}
                      </Td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </T>
          </Card>
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
