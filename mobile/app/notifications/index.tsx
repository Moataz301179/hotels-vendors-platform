import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useHovinAuth } from '../../src/testAuth';

import { createHovinClient, resolveOrigin, HovinApiError, type NotificationRecord } from '../../src/api/hovin';
import { notificationRoute } from '../../src/workflow';
import { isRTL, notificationLabel, t, type Language } from '../../src/i18n';
import { theme } from '../../src/theme';
import { Header, Screen, StateView } from '../../src/components/ui';

/**
 * In-app notifications. Device push registration is a documented gap: there is
 * no /api/v2 push-token contract yet, so this screen polls the server only.
 */
export default function NotificationsScreen() {
  const router = useRouter();
  const { isSignedIn, getToken } = useHovinAuth();
  const [lang, setLang] = useState<Language>('en');
  const rtl = isRTL(lang);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const origin = useMemo(() => resolveOrigin(), []);
  const api = useMemo(() => (origin.ok ? createHovinClient(() => getToken()) : null), [getToken, origin]);

  const load = useCallback(async () => {
    if (!api) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.notifications();
      setNotifications(result.notifications ?? []);
    } catch (err) {
      setError(err instanceof HovinApiError ? err.code : 'NOTIFICATIONS_UNAVAILABLE');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (!isSignedIn) return;
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [isSignedIn, load]);

  async function open(notification: NotificationRecord) {
    if (!notification.readAt && api) {
      try {
        await api.markNotificationRead(notification.id);
      } catch {
        // Marking read is best-effort; opening the authorized task still works.
      }
    }
    router.push(notificationRoute(notification.type) as '/orders' | '/notifications');
  }

  return (
    <View style={styles.root}>
      <Header
        title={t(lang, 'notifications')}
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
        {!loading && !error && notifications.length === 0 ? <StateView kind="empty" title={t(lang, 'empty')} rtl={rtl} /> : null}
        {notifications.map((notification) => (
          <Pressable key={notification.id} accessibilityRole="button" style={[styles.row, !notification.readAt && styles.unread]} onPress={() => void open(notification)}>
            <View style={styles.copy}>
              <Text style={styles.type}>{notificationLabel(lang, notification.type)}</Text>
              {notification.subject ? <Text style={styles.subject}>{notification.subject}</Text> : null}
              {notification.body ? <Text style={styles.body}>{notification.body}</Text> : null}
              <Text style={styles.meta}>{new Date(notification.createdAt).toLocaleString()}</Text>
            </View>
            {!notification.readAt ? <View style={styles.dot} /> : null}
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
  row: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 10, padding: 16, gap: 8 },
  unread: { borderColor: theme.accent },
  copy: { gap: 2 },
  type: { color: theme.accent, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  subject: { color: theme.ink, fontSize: 14 },
  body: { color: theme.muted, fontSize: 13, lineHeight: 18 },
  meta: { color: theme.muted, fontSize: 11, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent, position: 'absolute', top: 16, right: 16 },
});
