"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { usePrefs } from "@/i18n/provider";
import AppShell, { Guard, RequireAuth } from "@/components/AppShell";
import OrderDetail from "@/components/OrderDetail";
import { btnCls } from "@/components/ui";
import { IcArrow } from "@/components/icons";
import type { Role } from "@/lib/types";

const HOTEL: Role[] = ["hotel_admin", "gm", "finance_director"];

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { t } = usePrefs();
  return (
    <RequireAuth>
      <AppShell active="/orders">
        <Guard roles={HOTEL}>
          <Link href="/orders" className={`mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-500 hover:text-ink-950 dark:hover:text-white`}>
            <IcArrow className="rotate-180 rtl:rotate-0" /> {t("nav.orders")}
          </Link>
          <OrderDetail orderId={params?.id ?? ""} mode="hotel" />
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
