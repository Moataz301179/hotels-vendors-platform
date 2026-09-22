"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { usePrefs } from "@/i18n/provider";
import AppShell, { Guard, RequireAuth } from "@/lib/stubs-export";
import OrderDetail from "@/lib/stubs-export";
import { IcArrow } from "@/lib/stubs-export";

export default function SupplierOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { t } = usePrefs();
  return (
    <RequireAuth>
      <AppShell active="/supplier-central/orders">
        <Guard roles={["supplier_manager"]}>
          <Link
            href="/supplier-central/orders"
            className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-500 hover:text-ink-950 dark:hover:text-white"
          >
            <IcArrow className="rotate-180 rtl:rotate-0" /> {t("central.incoming")}
          </Link>
          <OrderDetail orderId={params?.id ?? ""} mode="supplier" />
        </Guard>
      </AppShell>
    </RequireAuth>
  );
}
