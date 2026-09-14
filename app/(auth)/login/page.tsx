"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { usePrefs } from "@/i18n/provider";
import { useApp } from "@/lib/store";
import { USERS } from "@/lib/seed";
import { hotelById, supplierById, partnerById, carrierById } from "@/lib/data";
import { STAIR_IMG } from "@/lib/data";
import { Btn, Field, Img, TextInput, Card } from "@/components/ui";
import PublicHeader from "@/components/PublicHeader";
import { homeFor } from "@/components/AppShell";
import { IcArrow, IcLock, IcShield, Logo } from "@/components/icons";

const QUICK: { id: string; group: string }[] = [
  { id: "u1", group: "hotel" },
  { id: "u2", group: "hotel" },
  { id: "u3", group: "hotel" },
  { id: "u8", group: "supplier" },
  { id: "u9", group: "supplier" },
  { id: "u11", group: "partner" },
  { id: "u12", group: "carrier" },
  { id: "u14", group: "platform" },
];

export default function LoginPage() {
  const { t, lang } = usePrefs();
  const { user, login } = useApp();
  const router = useRouter();
  const [selected, setSelected] = useState("u1");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  useEffect(() => {
    if (user) router.replace(homeFor(user.role));
  }, [user, router]);

  const orgName = useMemo(() => {
    const u = USERS.find((x) => x.id === selected)!;
    switch (u.orgType) {
      case "hotel": {
        const h = hotelById(u.orgId);
        return h ? (lang === "ar" ? h.nameAr : h.name) : u.orgId;
      }
      case "supplier": {
        const s = supplierById(u.orgId);
        return s ? (lang === "ar" ? s.nameAr : s.name) : u.orgId;
      }
      case "partner": {
        const p = partnerById(u.orgId);
        return p ? (lang === "ar" ? p.nameAr : p.name) : u.orgId;
      }
      case "carrier": {
        const c = carrierById(u.orgId);
        return c ? (lang === "ar" ? c.nameAr : c.name) : u.orgId;
      }
      default:
        return "HotelsVendors Platform";
    }
  }, [selected, lang]);

  const go = () => {
    const u = USERS.find((x) => x.id === selected);
    if (u) {
      login(u.id);
      router.replace(homeFor(u.role));
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-ink-950">
      <PublicHeader solid />
      <div className="mx-auto grid max-w-[1400px] gap-0 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:py-16">
        {/* brand panel */}
        <div className="relative hidden overflow-hidden rounded-lg bg-ink-950 lg:block">
          <Img src={STAIR_IMG} alt="" className="absolute inset-0 h-full w-full opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/30" />
          <div className="relative flex h-full flex-col justify-between p-10 text-white">
            <div className="flex items-center gap-2.5">
              <Logo className="h-9 w-9 text-ink-950" />
              <div>
                <div className="font-bold tracking-tight">HotelsVendors</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-ink-400">{t("brand.tag")}</div>
              </div>
            </div>
            <div>
              <div className="kicker mb-3 text-brass-300">{t("login.k")}</div>
              <h2 className="max-w-md text-3xl font-bold leading-tight tracking-tight">
                {t("login.t")}
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-300">{t("login.sub")}</p>
              <div className="mt-8 flex items-center gap-2 text-[13px] text-ink-300">
                <IcShield className="text-brass-300" />
                RBAC · Multi-tenant · Audit-logged
              </div>
            </div>
          </div>
        </div>

        {/* form */}
        <div className="flex flex-col justify-center py-8 lg:py-4">
          <div className="mb-8 lg:hidden">
            <div className="kicker mb-2 text-brass-600 dark:text-brass-400">{t("login.k")}</div>
            <h1 className="text-3xl font-bold tracking-tight">{t("login.t")}</h1>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{t("login.sub")}</p>
          </div>
          <div className="hidden lg:block">
            <div className="kicker mb-2 text-brass-600 dark:text-brass-400">{t("login.k")}</div>
            <h1 className="text-3xl font-bold tracking-tight">{t("login.t")}</h1>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{t("login.sub")}</p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Field label={t("login.email")} id="li-email">
              <TextInput
                id="li-email"
                type="email"
                placeholder={t("login.emailPh")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </Field>
            <Field label={t("login.password")} id="li-pw">
              <TextInput
                id="li-pw"
                type="password"
                placeholder={t("login.passwordPh")}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
          </div>

          <div className="mt-8">
            <div className="mb-1.5 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-500 dark:text-ink-400">
                {t("login.quick")}
              </h2>
              <span className="text-xs text-ink-400">{t("login.org")}: {orgName}</span>
            </div>
            <p className="mb-4 text-[13px] text-ink-500 dark:text-ink-400">{t("login.quickSub")}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {QUICK.map((q) => {
                const u = USERS.find((x) => x.id === q.id)!;
                const on = selected === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => setSelected(q.id)}
                    aria-pressed={on}
                    className={`flex items-center justify-between gap-3 rounded-lg border p-3.5 text-start transition-colors ${
                      on
                        ? "border-brass-500 bg-brass-500/8 ring-1 ring-brass-500/40"
                        : "border-line bg-white hover:border-ink-300 dark:border-linedark dark:bg-ink-900 dark:hover:border-ink-600"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{lang === "ar" ? u.nameAr : u.name}</div>
                      <div className="truncate text-xs text-ink-500 dark:text-ink-400">
                        {t(`role.${u.role}`)}
                      </div>
                    </div>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        on ? "border-brass-500 bg-brass-500 text-white" : "border-line dark:border-ink-600"
                      }`}
                    >
                      {on ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Btn size="lg" onClick={go}>
              <IcLock className="text-base" />
              {t("login.continue")}
            </Btn>
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-950 dark:hover:text-white">
              <IcArrow className="rotate-180 rtl:rotate-0" /> {t("notFound.home")}
            </Link>
          </div>

          <Card className="mt-8 p-4">
            <p className="text-[12px] leading-relaxed text-ink-500 dark:text-ink-400">{t("login.pilotNote")}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
