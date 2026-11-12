import { useCallback, useEffect, useState } from "react";
import type { PhoneNotification } from "../../src/api/hovin";
import { HovinApiError, isRetryableReceiptFailure } from "../../src/api/hovin";
import { useLocale } from "../../src/i18n";
import { usePhoneContext } from "../../src/session/usePhone";
import { AlertsSurface } from "../../src/screens/surfaces";
import { ScreenState } from "../../src/components/ui";

export default function Alerts() {
  const phone = usePhoneContext();
  const { t } = useLocale();
  const [notes, setNotes] = useState<PhoneNotification[] | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "offline" | "error">("loading");
  const load = useCallback(async () => {
    try {
      const result = await phone.client().notifications();
      setNotes(result.notifications);
      setPhase("ready");
    } catch (error) {
      setPhase(isRetryableReceiptFailure(error) || (error instanceof HovinApiError && error.status === 0) ? "offline" : "error");
    }
  }, [phone.client]);
  useEffect(() => { void load(); }, [load]);
  if (phase === "offline") return <ScreenState title={t("state.offline")} action={t("action.retry")} onPress={() => void load()} />;
  if (phase === "error") return <ScreenState title={t("state.error")} action={t("action.retry")} onPress={() => void load()} />;
  if (!notes) return <ScreenState title={t("state.loading")} />;
  return (
    <AlertsSurface
      notifications={notes}
      refreshing={false}
      onRefresh={() => void load()}
      onMark={(id) => {
        void phone.client().markNotification(id).then(() => load());
      }}
    />
  );
}
