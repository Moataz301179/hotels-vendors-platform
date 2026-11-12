import { useCallback, useEffect, useState } from "react";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { HovinApiError, isRetryableReceiptFailure, type CatalogProduct } from "../src/api/hovin";
import { useLocale } from "../src/i18n";
import { usePhoneContext } from "../src/session/usePhone";
import { CatalogSurface } from "../src/screens/surfaces";
import { ScreenState } from "../src/components/ui";

export default function Catalog() {
  const phone = usePhoneContext();
  const { t } = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [products, setProducts] = useState<CatalogProduct[] | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "offline" | "error">("loading");
  const [note, setNote] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const load = useCallback(async (nextQuery: string) => {
    try {
      const result = await phone.client().catalog(nextQuery);
      setProducts(result.products);
      setPhase("ready");
    } catch (error) {
      setPhase(isRetryableReceiptFailure(error) || (error instanceof HovinApiError && error.status === 0) ? "offline" : "error");
    }
  }, [phone.client]);
  useEffect(() => { void load(query); }, [load, query]);
  if (!phone.home?.plan.capabilities.includes("catalog")) return <ScreenState title={t("state.error")} />;
  if (phase === "offline") return <ScreenState title={t("state.offline")} action={t("action.retry")} onPress={() => void load(query)} />;
  if (phase === "error" || !products) return <ScreenState title={phase === "loading" ? t("state.loading") : t("state.error")} action={phase === "error" ? t("action.retry") : undefined} onPress={() => void load(query)} />;
  return (
    <CatalogSurface
      products={products}
      query={query}
      onQuery={setQuery}
      quantity={quantity}
      onQuantity={setQuantity}
      busy={busy}
      note={note}
      onRequest={(productId) => {
        const amount = Number(quantity);
        if (!Number.isInteger(amount) || amount < 1) {
          setNote(t("catalog.quantity"));
          return;
        }
        setBusy(true);
        setNote(undefined);
        void phone.client().createRfq(productId, amount, Crypto.randomUUID())
          .then(() => router.replace("/quotes"))
          .catch((error: unknown) => setNote(error instanceof HovinApiError ? error.message : t("state.error")))
          .finally(() => setBusy(false));
      }}
    />
  );
}
