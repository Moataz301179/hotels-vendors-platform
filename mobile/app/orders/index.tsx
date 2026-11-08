import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@clerk/expo';

import { createHovinClient, resolveOrigin, HovinApiError, type OrderRecord } from '../../src/api/hovin';
import { formatMoney, statusTone } from '../../src/workflow';
import { isRTL, statusLabel, t, type Language } from '../../src/i18n';
import { theme } from '../../src/theme';
import { Header, Screen, StateView, StatusPill } from '../../src/components/ui';

/** Orders list — hotel and supplier scopes are decided by the server. */
export default function OrdersScreen() {
  const router = useRouter();
  const { isSignedIn, getToken } = useAuth();
  const [lang, setLang] = useState<Language>('en');
  const rtl = isRTL(lang);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const origin = useMemo(() => resolveOrigin(), []);
  const api = useMemo(() => (origin.ok ? createHovinClient(() => getToken()) : null), [getToken, origin]);

  const load = useCallback(async () => {
    if (!api) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.orders();
      setOrders(result.orders ?? []);
    } catch (err) {
      setError(err instanceof HovinApiError ? err.code : 'ORDERS_UNAVAILABLE');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (isSignedIn) void load();
  }, [isSignedIn, load]);

  return (
    <View style={styles.root}>
      <Header
        title={t(lang, 'orders')}
        rtl={rtl}
        onBack={() => router.back()}
        right={
          <Pressable accessibilityRole="button" onPress={() => setLang((c) => (c === 'en' ? 'ar' : 'en'))} style={styles.lang}>
            <Text style={styles.langText}>{lang === 'en' ? 'AR' : 'EN'}</Text>
          </Pressable>
        }
      />
      <Screen>
        {loading ? <StateView kind="loading" title={t(lang, 'loading')} rtl={rtl} /> : null}
        {error ? <StateView kind="error" title={t(lang, 'error')} message={error} rtl={rtl} onRetry={() => void load()} /> : null}
        {!loading && !error && orders.length === 0 ? <StateView kind="empty" title={t(lang, 'empty')} rtl={rtl} /> : null}
        {orders.map((order) => (
          <Pressable key={order.id} accessibilityRole="button" style={styles.row} onPress={() => router.push(`/orders/${order.id}`)}>
            <View style={styles.copy}>
              <Text style={styles.number}>{order.orderNumber}</Text>
              <Text style={styles.meta}>
                {order.items?.length ?? 0} lines · {formatMoney(order.total, order.currency)}
              </Text>
              {order.paymentGuaranteed ? <Text style={styles.guarantee}>Payment guaranteed</Text> : <Text style={styles.noGuarantee}>Payment guarantee pending</Text>}
            </View>
            <StatusPill label={statusLabel(lang, order.status)} tone={statusTone(order.status)} />
          </Pressable>
        ))}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.paper },
  lang: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: theme.borderStrong },
  langText: { color: theme.onDark, fontSize: 13 },
  row: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 10, padding: 16, gap: 10 },
  copy: { flex: 1, gap: 4 },
  number: { color: theme.ink, fontSize: 15 },
  meta: { color: theme.muted, fontSize: 12 },
  guarantee: { color: theme.success, fontSize: 12 },
  noGuarantee: { color: theme.danger, fontSize: 12 },
});
