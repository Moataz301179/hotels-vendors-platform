import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@clerk/expo';

import { createHovinClient, resolveOrigin, HovinApiError, type RfqRecord } from '../../src/api/hovin';
import { rfqTitle } from '../../src/workflow';
import { isRTL, statusLabel, t, type Language } from '../../src/i18n';
import { theme } from '../../src/theme';
import { Header, Screen, StateView, StatusPill } from '../../src/components/ui';

/**
 * Hotel: buyer-safe requirement list. Supplier: granted-RFQ inbox.
 * The same route is scoped by the server; the client only renders what it is given.
 */
export default function RfqListScreen() {
  const router = useRouter();
  const { isSignedIn, getToken } = useAuth();
  const [lang, setLang] = useState<Language>('en');
  const rtl = isRTL(lang);
  const [rfqs, setRfqs] = useState<RfqRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const origin = useMemo(() => resolveOrigin(), []);
  const api = useMemo(() => (origin.ok ? createHovinClient(() => getToken()) : null), [getToken, origin]);

  const load = useCallback(async () => {
    if (!api) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.rfqs();
      setRfqs(result.rfqs ?? []);
    } catch (err) {
      setError(err instanceof HovinApiError ? err.code : 'RFQ_LIST_UNAVAILABLE');
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
        title={t(lang, 'rfqs')}
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
        {!loading && !error && rfqs.length === 0 ? <StateView kind="empty" title={t(lang, 'empty')} rtl={rtl} /> : null}
        {rfqs.map((rfq) => (
          <Pressable key={rfq.id} accessibilityRole="button" style={styles.row} onPress={() => router.push(`/rfq/${rfq.id}`)}>
            <View style={styles.copy}>
              <Text style={styles.title}>{rfqTitle(rfq)}</Text>
              <Text style={styles.meta}>
                {rfq.requestedQty} {rfq.unitOfMeasure ?? ''} · {rfq.matchingStatus}
              </Text>
              {rfq.responseDeadline ? <Text style={styles.meta}>Due {new Date(rfq.responseDeadline).toLocaleString()}</Text> : null}
            </View>
            <StatusPill label={statusLabel(lang, rfq.status)} tone={rfq.status === 'QUOTED' ? 'accent' : rfq.status === 'CONVERTED_TO_ORDER' ? 'success' : 'neutral'} />
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
  title: { color: theme.ink, fontSize: 15 },
  meta: { color: theme.muted, fontSize: 12 },
});
