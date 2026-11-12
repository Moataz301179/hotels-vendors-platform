import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { HovinApiError, isRetryableReceiptFailure, type SupplierRequest } from "../src/api/hovin";
import { useLocale } from "../src/i18n";
import { usePhoneContext } from "../src/session/usePhone";
import { Page } from "../src/screens/surfaces";
import { Group, Row, ScreenState, T } from "../src/components/ui";

export default function Requests() {
  const phone = usePhoneContext();
  const { t } = useLocale();
  const router = useRouter();
  const [rows, setRows] = useState<SupplierRequest[] | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "offline" | "error">("loading");
  useEffect(() => {
    let cancelled = false;
    void phone.client().supplierRequests()
      .then((result) => {
        if (!cancelled) {
          setRows(result.rfqs);
          setPhase("ready");
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) setPhase(isRetryableReceiptFailure(error) || (error instanceof HovinApiError && error.status === 0) ? "offline" : "error");
      });
    return () => { cancelled = true; };
  }, [phone.client]);
  if (!phone.home?.plan.capabilities.includes("supplier-response")) return <ScreenState title={t("state.error")} />;
  if (phase === "offline") return <ScreenState title={t("state.offline")} />;
  if (!rows) return <ScreenState title={phase === "error" ? t("state.error") : t("state.loading")} />;
  return (
    <Page testID="screen-requests">
      <T kind="title">{t("work.requests")}</T>
      {rows.length === 0 ? <T kind="body" tone="muted">{t("home.empty")}</T> : (
        <Group>
          {rows.map((row, index) => (
            <Row
              key={row.id}
              title={row.product?.name || row.itemName || row.id}
              detail={`${t("fact.quantity")} ${row.requestedQty}`}
              onPress={() => router.push(`/respond/${row.id}`)}
              hairline={index < rows.length - 1}
            />
          ))}
        </Group>
      )}
    </Page>
  );
}
