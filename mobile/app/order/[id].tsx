import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { confirmPulse } from "../../src/feedback/haptic";
import { HovinApiError, isRetryableReceiptFailure, type PhoneOrderDetail } from "../../src/api/hovin";
import { useLocale } from "../../src/i18n";
import { usePhoneContext } from "../../src/session/usePhone";
import { TrackingSurface } from "../../src/screens/surfaces";
import { ScreenState } from "../../src/components/ui";

export default function OrderTracking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const phone = usePhoneContext();
  const { t } = useLocale();
  const [detail, setDetail] = useState<PhoneOrderDetail | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "offline" | "error">("loading");
  const [code, setCode] = useState("");
  const [note, setNote] = useState<string | undefined>();
  const load = useCallback(async () => {
    if (!id) return;
    try {
      const result = await phone.client().order(id);
      setDetail(result.order);
      setPhase("ready");
    } catch (error) {
      setPhase(isRetryableReceiptFailure(error) || (error instanceof HovinApiError && error.status === 0) ? "offline" : "error");
    }
  }, [id, phone.client]);
  useEffect(() => { void load(); }, [load]);
  if (phase === "offline") return <ScreenState title={t("state.offline")} action={t("action.retry")} onPress={() => void load()} />;
  if (!detail) return <ScreenState title={phase === "error" ? t("state.error") : t("state.loading")} action={phase === "error" ? t("action.retry") : undefined} onPress={() => void load()} />;
  const canConfirm = phone.home?.plan.capabilities.includes("confirm-delivery-code") === true;
  return (
    <TrackingSurface
      detail={detail}
      codeEntry={code}
      onCode={setCode}
      canConfirm={canConfirm}
      note={note}
      onConfirm={() => {
        if (!id || !/^\d{6}$/.test(code)) {
          setNote(t("tracking.enter"));
          return;
        }
        setNote(undefined);
        void phone.client().confirmDeliveryCode(id, code)
          .then(() => {
            confirmPulse();
            return load();
          })
          .catch((error: unknown) => setNote(error instanceof HovinApiError ? error.message : t("state.error")));
      }}
    />
  );
}
