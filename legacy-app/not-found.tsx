"use client";

import Link from "next/link";
import { usePrefs } from "@/i18n/provider";
import { btnCls } from "@/components/ui";
import { IcAlert } from "@/components/icons";

export default function NotFound() {
  const { t } = usePrefs();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-4 text-white">
      <IcAlert className="mb-4 text-4xl text-brass-300" />
      <div className="kicker mb-2 text-brass-300">404</div>
      <h1 className="text-3xl font-bold tracking-tight">{t("notFound.t")}</h1>
      <p className="mt-3 max-w-sm text-center text-sm text-ink-300">{t("notFound.sub")}</p>
      <Link href="/" className={`${btnCls("accent")} mt-8`}>
        {t("notFound.home")}
      </Link>
    </div>
  );
}
