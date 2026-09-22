"use client";

import Link from "next/link";
import { usePrefs } from "@/i18n/provider";

export default function PublicFooter() {
  const { t, lang } = usePrefs();
  const nm = (e: string, a: string) => (lang === "ar" ? a : e);

  return (
    <footer className="border-t border-line bg-fog-50 dark:border-linedark dark:bg-ink-900">
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Company */}
          <div>
            <h3 className="text-sm font-bold tracking-wide text-ink-900 dark:text-white">
              HotelsVendors
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
              {t("home.sub")?.slice(0, 120)}...
            </p>
            <div className="mt-4 flex gap-3">
              <Link href="/about" className="text-[13px] font-medium text-brass-600 hover:underline">
                {t("common.about") || "About"}
              </Link>
              <Link href="/contact" className="text-[13px] font-medium text-brass-600 hover:underline">
                {t("common.contact") || "Contact"}
              </Link>
              <Link href="/support" className="text-[13px] font-medium text-brass-600 hover:underline">
                {t("common.help") || "Support"}
              </Link>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-[13px] font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
              {t("home.footMarket")}
            </h4>
            <ul className="mt-3 space-y-2">
              <li><Link href="/marketplace" className="text-[13px] text-ink-600 hover:text-brass-600 dark:text-ink-300 dark:hover:text-brass-400">{t("home.footMarketplace")}</Link></li>
              <li><Link href="/suppliers" className="text-[13px] text-ink-600 hover:text-brass-600 dark:text-ink-300 dark:hover:text-brass-400">{t("home.footSuppliers")}</Link></li>
              <li><Link href="/sourcing" className="text-[13px] text-ink-600 hover:text-brass-600 dark:text-ink-300 dark:hover:text-brass-400">{t("home.footRFQ")}</Link></li>
            </ul>
          </div>

          {/* Procurement */}
          <div>
            <h4 className="text-[13px] font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
              {t("home.footProc")}
            </h4>
            <ul className="mt-3 space-y-2">
              <li><Link href="/orders" className="text-[13px] text-ink-600 hover:text-brass-600 dark:text-ink-300 dark:hover:text-brass-400">{t("home.footOrders")}</Link></li>
              <li><Link href="/receiving" className="text-[13px] text-ink-600 hover:text-brass-600 dark:text-ink-300 dark:hover:text-brass-400">{t("home.footReceiving")}</Link></li>
              <li><Link href="/invoices" className="text-[13px] text-ink-600 hover:text-brass-600 dark:text-ink-300 dark:hover:text-brass-400">{t("home.footInvoices")}</Link></li>
              <li><Link href="/eta-compliance" className="text-[13px] text-ink-600 hover:text-brass-600 dark:text-ink-300 dark:hover:text-brass-400">{t("home.footETA")}</Link></li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h4 className="text-[13px] font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
              {t("home.footLegal")}
            </h4>
            <ul className="mt-3 space-y-2">
              <li><Link href="/terms" className="text-[13px] text-ink-600 hover:text-brass-600 dark:text-ink-300 dark:hover:text-brass-400">{t("home.footTerms")}</Link></li>
              <li><Link href="/privacy" className="text-[13px] text-ink-600 hover:text-brass-600 dark:text-ink-300 dark:hover:text-brass-400">{t("home.footPrivacy")}</Link></li>
              <li><Link href="/financing#disclaimer" className="text-[13px] text-ink-600 hover:text-brass-600 dark:text-ink-300 dark:hover:text-brass-400">{t("home.footFinNote")}</Link></li>
              <li><Link href="/support" className="text-[13px] text-ink-600 hover:text-brass-600 dark:text-ink-300 dark:hover:text-brass-400">Help Center</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6 dark:border-linedark">
          <p className="text-[12px] text-ink-500 dark:text-ink-400">
            {t("home.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
