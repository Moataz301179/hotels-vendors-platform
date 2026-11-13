import { useCallback, useEffect, useState } from "react";
import type { AnonymousQuote } from "../src/api/hovin";
import { HovinApiError, isRetryableReceiptFailure } from "../src/api/hovin";
import { useLocale } from "../src/i18n";
import { usePhoneContext } from "../src/session/usePhone";
import { QuotesSurface } from "../src/screens/surfaces";
import { ScreenState } from "../src/components/ui";

export default function Quotes() {
  const phone = usePhoneContext();
  const { t } = useLocale();
  const [quotes, setQuotes] = useState<AnonymousQuote[] | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "offline" | "error">("loading");
  const load = useCallback(async () => {
    try {
      const result = await phone.client().quotes();
      setQuotes(result.quotes);
      setPhase("ready");
    } catch (error) {
      setPhase(isRetryableReceiptFailure(error) || (error instanceof HovinApiError && error.status === 0) ? "offline" : "error");
    }
  }, [phone.client]);
  useEffect(() => { void load(); }, [load]);
  if (!phone.home?.plan.capabilities.includes("compare-quotes")) return <ScreenState title={t("state.error")} />;
  if (phase === "offline") return <ScreenState title={t("state.offline")} action={t("action.retry")} onPress={() => void load()} />;
  if (!quotes) return <ScreenState title={phase === "error" ? t("state.error") : t("state.loading")} action={phase === "error" ? t("action.retry") : undefined} onPress={() => void load()} />;
  return <QuotesSurface quotes={quotes.map((quote) => ({ reference: quote.reference, unitPrice: quote.unitPrice, currency: quote.currency }))} />;
}
