import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import type { PhoneOrder } from "../src/api/hovin";
import { HovinApiError, isRetryableReceiptFailure } from "../src/api/hovin";
import { useLocale } from "../src/i18n";
import { usePhoneContext } from "../src/session/usePhone";
import { OrdersSurface } from "../src/screens/surfaces";
import { ScreenState } from "../src/components/ui";

export default function Orders() {
  const phone = usePhoneContext();
  const { t } = useLocale();
  const router = useRouter();
  const [orders, setOrders] = useState<PhoneOrder[] | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "offline" | "error">("loading");
  const load = useCallback(async () => {
    try {
      const result = await phone.client().orders();
      setOrders(result.orders);
      setPhase("ready");
    } catch (error) {
      setPhase(isRetryableReceiptFailure(error) || (error instanceof HovinApiError && error.status === 0) ? "offline" : "error");
    }
  }, [phone.client]);
  useEffect(() => { void load(); }, [load]);
  if (phase === "offline") return <ScreenState title={t("state.offline")} action={t("action.retry")} onPress={() => void load()} />;
  if (!orders) return <ScreenState title={phase === "error" ? t("state.error") : t("state.loading")} action={phase === "error" ? t("action.retry") : undefined} onPress={() => void load()} />;
  return <OrdersSurface orders={orders} onOpen={(id) => router.push(`/order/${id}`)} />;
}
