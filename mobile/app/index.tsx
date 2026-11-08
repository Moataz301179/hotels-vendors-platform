import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { useClerk } from '@clerk/expo';
import { useHovinAuth, useHovinUser } from '../src/testAuth';
import { useHostedAuth } from '@clerk/expo/hosted-auth';

import { createHovinClient, resolveOrigin, type MobileContextUser } from '../src/api/hovin';
import { deriveTasks } from '../src/workflow';
import { isRTL, t, type Language } from '../src/i18n';
import { theme } from '../src/theme';
import { Header, Screen, StateView, TaskCard } from '../src/components/ui';

type LoadState = 'loading' | 'ready' | 'error';

/**
 * HOVIN task home. Role-appropriate work only — never a marketing page.
 * Capabilities come from the server; a client toggle never grants access.
 */
export default function TaskHome() {
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useHovinAuth();
  const { user } = useHovinUser();
  const clerk = useClerk();
  const { startHostedAuth } = useHostedAuth();
  const [lang, setLang] = useState<Language>('en');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [contextUnavailable, setContextUnavailable] = useState(false);
  const [context, setContext] = useState<MobileContextUser | null>(null);
  const [unread, setUnread] = useState(0);

  const rtl = isRTL(lang);
  const origin = useMemo(() => resolveOrigin(), []);
  const api = useMemo(() => (origin.ok ? createHovinClient(() => getToken()) : null), [getToken, origin]);

  const loadContext = useCallback(async () => {
    if (!isSignedIn || !api) return;
    setLoadState('loading');
    try {
      const [identity, ctx] = await Promise.all([api.identity(), api.context().catch(() => null)]);
      if (!ctx) {
        // The mobile context contract is additive. If it is absent, fall back
        // to the minimum identity and show every task for the platform role;
        // the server still enforces every action.
        setContextUnavailable(true);
        setContext({
          id: identity.user.id,
          name: identity.user.name,
          email: identity.user.email,
          platformRole: identity.user.platformRole,
          role: '',
          tenantId: identity.user.tenantId,
          hotelId: null,
          supplierId: null,
          departmentId: null,
          permissions: [],
        });
      } else {
        setContext(ctx.user);
        setContextUnavailable(false);
      }
      try {
        const notifications = await api.notifications();
        setUnread(notifications.unread ?? 0);
      } catch {
        setUnread(0);
      }
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [api, isSignedIn]);

  useEffect(() => {
    if (isSignedIn && isLoaded) {
      const timer = setTimeout(() => void loadContext(), 0);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, isSignedIn, loadContext]);

  // DEV ONLY: jump straight to a screen for staging screenshot capture.
  useEffect(() => {
    if (!__DEV__) return;
    const route = process.env.EXPO_PUBLIC_HOVIN_TEST_ROUTE;
    if (!route) return;
    const timer = setTimeout(() => router.replace(route), 150);
    return () => clearTimeout(timer);
  }, [router]);

  const tasks = useMemo(() => {
    const derived = deriveTasks(context);
    if (contextUnavailable) {
      return derived.map((task) => ({ ...task, enabled: true, badge: task.id === 'notifications' ? unread : undefined }));
    }
    return derived.map((task) => ({ ...task, badge: task.id === 'notifications' ? unread : undefined }));
  }, [context, contextUnavailable, unread]);

  async function authenticate() {
    try {
      const result = await startHostedAuth({ mode: 'sign-in', authSessionOptions: { preferEphemeralSession: false } });
      if (!result.createdSessionId) return;
      await loadContext();
    } catch {
      // The sign-in state is handled by Clerk; nothing else to do here.
    }
  }

  function toggleLanguage() {
    setLang((current) => (current === 'en' ? 'ar' : 'en'));
  }

  if (!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || !origin.ok) {
    return (
      <Screen>
        <Text style={styles.brand}>HOVIN</Text>
        <Text style={styles.title}>{t(lang, 'denied')}</Text>
        <Text style={styles.body}>
          {!origin.ok && 'code' in origin ? origin.message : 'This build needs the active Clerk publishable key before protected work can be opened.'}
        </Text>
      </Screen>
    );
  }

  if (!isLoaded) {
    return <Screen><StateView kind="loading" title={t(lang, 'loading')} rtl={rtl} /></Screen>;
  }

  if (!isSignedIn) {
    return (
      <Screen>
        <View style={styles.brandBar}>
          <Text style={styles.brand}>HOVIN</Text>
          <Text style={styles.context}>{t(lang, 'tagline')}</Text>
        </View>
        <View style={styles.hero}>
          {/* eslint-disable-next-line @typescript-eslint/no-require-imports, jsx-a11y/alt-text */}
          <Image accessibilityLabel="HOVIN logo" source={require('../assets/logo-hovin-blue.png')} style={styles.logo} />
          <Text style={styles.heroTitle}>{t(lang, 'yourWork')}</Text>
          <Text style={styles.body}>{t(lang, 'receivingHint')}</Text>
          <Pressable accessibilityRole="button" style={styles.primary} onPress={() => void authenticate()}>
            <Text style={styles.primaryText}>{t(lang, 'signIn')}</Text>
          </Pressable>
        </View>
        <Pressable accessibilityRole="button" onPress={toggleLanguage} style={styles.langToggle}>
          <Text style={styles.langText}>{lang === 'en' ? 'العربية' : 'English'}</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <Header
        title={t(lang, 'yourWork')}
        subtitle={context?.name ?? user?.primaryEmailAddress?.emailAddress ?? ''}
        rtl={rtl}
        right={
          <Pressable accessibilityRole="button" onPress={toggleLanguage} style={styles.langToggle}>
            <Text style={styles.langText}>{lang === 'en' ? 'العربية' : 'English'}</Text>
          </Pressable>
        }
      />
      <Screen>
        {loadState === 'loading' ? <StateView kind="loading" title={t(lang, 'loading')} rtl={rtl} /> : null}
        {loadState === 'error' ? (
          <StateView kind="error" title={t(lang, 'error')} message={t(lang, 'retry')} rtl={rtl} onRetry={() => void loadContext()} />
        ) : null}
        {loadState === 'ready' ? (
          <>
            {contextUnavailable ? (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>
                  {t(lang, 'denied')} — mobile context contract unavailable; showing all tasks for your platform role. The server enforces each action.
                </Text>
              </View>
            ) : null}
            <Text style={styles.sectionLabel}>{t(lang, 'nextAction')}</Text>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                title={t(lang, task.titleKey)}
                hint={t(lang, task.hintKey)}
                badge={task.badge}
                disabled={!task.enabled}
                rtl={rtl}
                onPress={() => router.push(task.route as '/rfq' | '/orders' | '/receiving' | '/notifications')}
              />
            ))}
            <Pressable accessibilityRole="button" onPress={() => void clerk.signOut()} style={styles.signOut}>
              <Text style={styles.signOutText}>{t(lang, 'signOut')}</Text>
            </Pressable>
          </>
        ) : null}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.paper },
  brandBar: { gap: 4, padding: 20, backgroundColor: theme.header },
  brand: { color: theme.onDark, fontSize: 22, letterSpacing: 2.4 },
  title: { color: theme.ink, fontSize: 22, lineHeight: 28 },
  context: { color: theme.onDarkMuted, fontSize: 12 },
  hero: { gap: 12, padding: 20, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 14 },
  logo: { width: 120, height: 39, resizeMode: 'contain' },
  heroTitle: { color: theme.ink, fontSize: 26, lineHeight: 32 },
  body: { color: theme.muted, fontSize: 14, lineHeight: 20 },
  primary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: theme.accent, paddingHorizontal: 18 },
  primaryText: { color: theme.accentInk, fontSize: 15 },
  sectionLabel: { color: theme.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.1, marginTop: 8 },
  notice: { backgroundColor: theme.dangerSoft, borderWidth: 1, borderColor: theme.danger, borderRadius: 10, padding: 12 },
  noticeText: { color: theme.danger, fontSize: 12, lineHeight: 18 },
  langToggle: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: theme.borderStrong },
  langText: { color: theme.onDark, fontSize: 13 },
  signOut: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  signOutText: { color: theme.muted, fontSize: 14 },
});
