import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Crypto from "expo-crypto";
import { confirmPulse } from "../../src/feedback/haptic";
import { HovinApiError, isRetryableReceiptFailure, type ReceiptContext, type ReceiptSubmission } from "../../src/api/hovin";
import { enqueueGrn, readDraft, saveDraft } from "../../src/sync/offlineQueue";
import { useLocale } from "../../src/i18n";
import { usePhoneContext } from "../../src/session/usePhone";
import { ReceiveSurface } from "../../src/screens/surfaces";
import { Button, ScreenState } from "../../src/components/ui";
import { colors } from "../../src/theme";

type LineDraft = { received: string; accepted: string; reason: string; notes: string };
type StoredDraft = { lines: Record<string, LineDraft>; photoUri: string | null; idempotencyKey: string };

export default function Receive() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const phone = usePhoneContext();
  const { t } = useLocale();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [context, setContext] = useState<ReceiptContext | null>(null);
  const [lines, setLines] = useState<Record<string, LineDraft>>({});
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [note, setNote] = useState<string | undefined>();
  const [phase, setPhase] = useState<"loading" | "ready" | "offline" | "error">("loading");
  const [key, setKey] = useState(() => Crypto.randomUUID());

  useEffect(() => {
    if (!orderId || !phone.database || !phone.accountId) return;
    let cancelled = false;
    void (async () => {
      const stored = await readDraft<StoredDraft>(phone.database!, phone.accountId!, `receipt:${orderId}`);
      if (cancelled) return;
      if (stored) {
        setLines(stored.lines);
        setPhotoUri(stored.photoUri);
        setKey(stored.idempotencyKey);
      }
      try {
        const loaded = await phone.client().receiptContext(orderId);
        if (cancelled) return;
        setContext(loaded);
        setLines((current) => {
          const next = { ...current };
          for (const item of loaded.order.items) {
            next[item.id] ??= { received: String(item.remainingQuantity), accepted: String(item.remainingQuantity), reason: "", notes: "" };
          }
          return next;
        });
        setPhase("ready");
      } catch (error) {
        if (!cancelled) setPhase(isRetryableReceiptFailure(error) || (error instanceof HovinApiError && error.status === 0) ? "offline" : "error");
      }
    })();
    return () => { cancelled = true; };
  }, [orderId, phone.database, phone.accountId, phone.client]);

  useEffect(() => {
    if (!phone.database || !phone.accountId || !orderId || phase !== "ready") return;
    void saveDraft(phone.database, phone.accountId, `receipt:${orderId}`, { lines, photoUri, idempotencyKey: key } satisfies StoredDraft);
  }, [lines, photoUri, key, orderId, phase, phone.database, phone.accountId]);

  if (!phone.home?.plan.capabilities.includes("receive")) return <ScreenState title={t("state.error")} />;
  if (phase === "offline") return <ScreenState title={t("state.offline")} />;
  if (!context || !orderId) return <ScreenState title={phase === "error" ? t("state.error") : t("state.loading")} />;

  const payload = (): ReceiptSubmission => ({
    orderId,
    lines: context.order.items.map((item) => ({
      orderItemId: item.id,
      receivedQuantity: Number(lines[item.id]?.received ?? 0),
      acceptedQuantity: Number(lines[item.id]?.accepted ?? 0),
      rejectionReason: lines[item.id]?.reason || null,
      conditionNotes: lines[item.id]?.notes || null,
    })),
    evidenceUrls: [],
  });

  if (cameraOpen) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.chrome }}>
        <CameraView ref={camera} style={{ flex: 1 }} facing="back" />
        <View style={{ padding: 16, gap: 8, backgroundColor: colors.paper }}>
          <Button label={t("receive.photo")} onPress={() => {
            void camera.current?.takePictureAsync({ quality: 0.7 }).then((shot) => {
              if (shot?.uri) {
                setPhotoUri(shot.uri);
                setCameraOpen(false);
              }
            });
          }} />
          <Button label={t("action.retry")} tone="quiet" onPress={() => setCameraOpen(false)} />
        </View>
      </View>
    );
  }

  return (
    <ReceiveSurface
      orderNumber={context.order.orderNumber}
      photoReady={Boolean(photoUri)}
      note={note}
      lines={context.order.items.map((item) => ({
        id: item.id,
        name: item.product.name,
        remaining: item.remainingQuantity,
        received: lines[item.id]?.received ?? "",
        accepted: lines[item.id]?.accepted ?? "",
        reason: lines[item.id]?.reason ?? "",
        notes: lines[item.id]?.notes ?? "",
      }))}
      onChange={(id, field, value) => setLines((current) => ({ ...current, [id]: { ...(current[id] ?? { received: "", accepted: "", reason: "", notes: "" }), [field]: value } }))}
      onPhoto={() => {
        if (!permission?.granted) {
          void requestPermission();
          return;
        }
        setCameraOpen(true);
      }}
      onSubmit={() => {
        const body = payload();
        const tenantId = phone.home?.account.tenantId;
        void (async () => {
          try {
            let evidenceFileIds: string[] = [];
            if (photoUri) {
              const uploaded = await phone.client().uploadReceiptPhoto({ uri: photoUri, name: "receipt.jpg", type: "image/jpeg" });
              evidenceFileIds = [uploaded.id];
            }
            const submission = { ...body, evidenceFileIds };
            await phone.client().submitReceipt(submission, key);
            confirmPulse();
            setNote(t("receive.saved"));
          } catch (error) {
            const retryable = isRetryableReceiptFailure(error) || (error instanceof HovinApiError && error.status === 0);
            if (retryable && !photoUri && phone.database && tenantId) {
              await enqueueGrn(phone.database, tenantId, key, body);
              setNote(t("receive.queued"));
              return;
            }
            setNote(error instanceof HovinApiError ? error.message : t("state.error"));
          }
        })();
      }}
    />
  );
}
