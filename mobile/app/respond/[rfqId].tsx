import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { HovinApiError, isRetryableReceiptFailure, type SupplierRequest } from "../../src/api/hovin";
import { readDraft, saveDraft } from "../../src/sync/offlineQueue";
import { useLocale } from "../../src/i18n";
import { usePhoneContext } from "../../src/session/usePhone";
import { RespondSurface } from "../../src/screens/surfaces";
import { ScreenState } from "../../src/components/ui";

type Draft = { unitPrice: string; deliveryFee: string; taxAmount: string; leadTime: string };

export default function Respond() {
  const { rfqId } = useLocalSearchParams<{ rfqId: string }>();
  const phone = usePhoneContext();
  const { t } = useLocale();
  const router = useRouter();
  const [request, setRequest] = useState<SupplierRequest | null>(null);
  const [draft, setDraft] = useState<Draft>({ unitPrice: "", deliveryFee: "0", taxAmount: "0", leadTime: "" });
  const [note, setNote] = useState<string | undefined>();
  const [phase, setPhase] = useState<"loading" | "ready" | "offline" | "error">("loading");

  useEffect(() => {
    if (!rfqId) return;
    let cancelled = false;
    void (async () => {
      if (phone.database && phone.accountId) {
        const stored = await readDraft<Draft>(phone.database, phone.accountId, `quote:${rfqId}`);
        if (stored && !cancelled) setDraft(stored);
      }
      try {
        const result = await phone.client().supplierRequests();
        const match = result.rfqs.find((item) => item.id === rfqId) ?? null;
        if (cancelled) return;
        setRequest(match);
        setPhase(match ? "ready" : "error");
      } catch (error) {
        if (!cancelled) setPhase(isRetryableReceiptFailure(error) || (error instanceof HovinApiError && error.status === 0) ? "offline" : "error");
      }
    })();
    return () => { cancelled = true; };
  }, [phone.database, phone.accountId, phone.client, rfqId]);

  useEffect(() => {
    if (!phone.database || !phone.accountId || !rfqId || phase !== "ready") return;
    void saveDraft(phone.database, phone.accountId, `quote:${rfqId}`, draft);
  }, [draft, phone.database, phone.accountId, rfqId, phase]);

  if (!phone.home?.plan.capabilities.includes("supplier-response")) return <ScreenState title={t("state.error")} />;
  if (phase === "offline") return <ScreenState title={t("state.offline")} />;
  if (!request) return <ScreenState title={phase === "error" ? t("state.error") : t("state.loading")} />;
  return (
    <RespondSurface
      itemName={request.product?.name || request.itemName || t("respond.title")}
      quantity={request.requestedQty}
      unitPrice={draft.unitPrice}
      deliveryFee={draft.deliveryFee}
      taxAmount={draft.taxAmount}
      leadTime={draft.leadTime}
      note={note}
      onChange={(field, value) => setDraft((current) => ({ ...current, [field]: value }))}
      onSubmit={() => {
        const unitPrice = Number(draft.unitPrice);
        const deliveryFee = Number(draft.deliveryFee);
        const taxAmount = Number(draft.taxAmount);
        const leadTimeDays = draft.leadTime ? Number(draft.leadTime) : undefined;
        if (!Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isFinite(deliveryFee) || !Number.isFinite(taxAmount)) {
          setNote(t("state.error"));
          return;
        }
        void phone.client().submitQuote({
          rfqId: request.id,
          unitPrice,
          quantity: request.requestedQty,
          deliveryFee,
          taxAmount,
          leadTimeDays,
        }).then(() => {
          setNote(t("respond.sent"));
          router.back();
        }).catch((error: unknown) => setNote(error instanceof HovinApiError ? error.message : t("state.error")));
      }}
    />
  );
}
