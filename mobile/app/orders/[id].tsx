import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@clerk/expo';

import { createHovinClient, resolveOrigin, HovinApiError, type MobileContextUser, type OrderRecord } from '../../src/api/hovin';
import { formatMoney, nextOrderAction, orderTimeline, statusTone } from '../../src/workflow';
import { isRTL, statusLabel, t, type Language } from '../../src/i18n';
import { theme } from '../../src/theme';
import { Card, Field, Header, PrimaryButton, Screen, StateView, StatusPill } from '../../src/components/ui';

/**
 * Order detail. Actions are derived from the server's `allowedActions`; the
 * transition itself is re-validated server-side (authority, payment, ETA).
 */
export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isSignedIn, getToken } = useAuth();
  const [lang] = useState<Language>('en');
  const rtl = isRTL(lang);
  const [user, setUser] = useState<MobileContextUser | null>(null);
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  const origin = useMemo(() => resolveOrigin(), []);
  const api = useMemo(() => (origin.ok ? createHovinClient(() => getToken()) : null), [getToken, origin]);

  const load = useCallback(async () => {
    if (!api || !id) return;
    setLoading(true);
    setError(null);
    setConflict(false);
    try {
      const [ctx, result] = await Promise.all([api.context().catch(() => null), api.order(id)]);
      setUser(ctx?.user ?? null);
      setOrder(result.order ?? null);
    } catch (err) {
      setError(err instanceof HovinApiError ? err.code : 'ORDER_UNAVAILABLE');
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    if (!isSignedIn) return;
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [isSignedIn, load]);

  const action = useMemo(() => (order ? nextOrderAction(order, user) : null), [order, user]);
  const timeline = useMemo(() => (order ? orderTimeline(order) : []), [order]);

  async function runAction() {
    if (!api || !order || !action) return;
    setSubmitting(true);
    setActionError(null);
    setConflict(false);
    try {
      let delivery: string | undefined;
      if (action.needsEstimatedDelivery) {
        const parsed = new Date(estimatedDelivery);
        if (!Number.isFinite(parsed.getTime()) || parsed.getTime() <= Date.now()) {
          setActionError('A future delivery commitment is required before dispatch.');
          return;
        }
        delivery = parsed.toISOString();
      }
      await api.transitionOrder(order.id, action.status, delivery);
      await load();
    } catch (err) {
      if (err instanceof HovinApiError && (err.code === 'The order changed. Refresh before acting.' || err.status === 409)) {
        setConflict(true);
      } else {
        setActionError(err instanceof HovinApiError ? err.code : 'TRANSITION_FAILED');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <Header title={order?.orderNumber ?? t(lang, 'orders')} rtl={rtl} onBack={() => router.back()} />
      <Screen>
        {loading ? <StateView kind="loading" title={t(lang, 'loading')} rtl={rtl} /> : null}
        {error ? <StateView kind="error" title={t(lang, 'error')} message={error} rtl={rtl} onRetry={() => void load()} /> : null}
        {conflict ? <StateView kind="conflict" title={t(lang, 'conflict')} rtl={rtl} onRetry={() => void load()} /> : null}

        {order ? (
          <>
            <Card>
              <View style={styles.statusRow}>
                <StatusPill label={statusLabel(lang, order.status)} tone={statusTone(order.status)} />
                <Text style={styles.total}>{formatMoney(order.total, order.currency)}</Text>
              </View>
              <View style={styles.timeline}>
                {timeline.map((step) => (
                  <View key={step.status} style={styles.timelineStep}>
                    <View style={[styles.dot, step.done && styles.dotDone, step.current && styles.dotCurrent]} />
                    <Text style={[styles.timelineLabel, step.current && styles.timelineCurrent]}>{statusLabel(lang, step.status)}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.meta}>{order.paymentGuaranteed ? 'Payment guaranteed' : 'Payment guarantee pending'}</Text>
            </Card>

            <Card>
              <Text style={styles.section}>{t(lang, 'orders')}</Text>
              {(order.items ?? []).map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemCopy}>
                    <Text style={styles.itemName}>{item.product.name}</Text>
                    <Text style={styles.meta}>{item.product.sku ?? '—'} · {item.quantity} {item.product.unitOfMeasure ?? ''}</Text>
                  </View>
                  <Text style={styles.meta}>{item.receivedQuantity ?? 0}/{item.quantity}</Text>
                </View>
              ))}
            </Card>

            {action ? (
              <Card>
                {action.needsEstimatedDelivery ? (
                  <Field label="Estimated delivery (ISO date-time)" value={estimatedDelivery} onChangeText={setEstimatedDelivery} placeholder="2026-11-10T09:00" rtl={rtl} />
                ) : null}
                {action.labelKey === 'receive' ? (
                  <PrimaryButton label={t(lang, 'receive')} onPress={() => router.push('/receiving')} />
                ) : (
                  <PrimaryButton
                    label={t(lang, action.labelKey)}
                    onPress={() => void runAction()}
                    loading={submitting}
                  />
                )}
                {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
              </Card>
            ) : null}
          </>
        ) : null}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.paper },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { color: theme.accent, fontSize: 18 },
  timeline: { gap: 6, marginTop: 8 },
  timelineStep: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.borderStrong },
  dotDone: { backgroundColor: theme.success },
  dotCurrent: { backgroundColor: theme.accent },
  timelineLabel: { color: theme.muted, fontSize: 12 },
  timelineCurrent: { color: theme.ink },
  meta: { color: theme.muted, fontSize: 12, marginTop: 4 },
  section: { color: theme.ink, fontSize: 16 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.border },
  itemCopy: { flex: 1 },
  itemName: { color: theme.ink, fontSize: 14 },
  error: { color: theme.danger, fontSize: 12 },
});
