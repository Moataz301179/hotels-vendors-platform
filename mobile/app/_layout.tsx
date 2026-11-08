import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { setTestSession } from '../src/testAuth';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

/**
 * DEV ONLY — staging device test hook.
 *
 * Mints a real Clerk session token from the local staging token server and
 * activates the staging auth shim (src/testAuth.ts). The shim is inert in
 * every production build (`__DEV__ === false`).
 */
const TEST_USERS: Record<string, { name: string; email: string }> = {
  user_3KWexEfdNZ6SSwtwsgi1k4eqRDh: {
    name: 'Staging Buyer',
    email: 'staging.e2e.buyer.20261011@example.com',
  },
  user_3KWexBNsCIwe1bUDrMqUDsbP4QD: {
    name: 'Staging Approver',
    email: 'staging.e2e.approver.20261011@example.com',
  },
  user_3KWexFCaRME4mUyyWiNA01ixO5M: {
    name: 'Staging Supplier',
    email: 'staging.e2e.supplier.20261011@example.com',
  },
};

function useDebugTestAuthInjection() {
  useEffect(() => {
    if (!__DEV__) return;

    const bootstrapFromServer = async () => {
      const user = process.env.EXPO_PUBLIC_HOVIN_TEST_USER;
      if (!user) return;
      const res = await fetch(
        `http://127.0.0.1:8082/hovin-test-token?user=${encodeURIComponent(user)}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as { token?: string };
      if (!data.token) return;
      const testUser = TEST_USERS[user];
      setTestSession(
        data.token,
        testUser ? { id: user, name: testUser.name, email: testUser.email } : undefined,
      );
    };

    void bootstrapFromServer();
  }, []);
}

/**
 * Missing identity configuration must fail closed: show a clear error instead
 * of mounting a tree whose useAuth() calls would throw.
 */
function ConfigurationRequired() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#0A0A0A' }}>
      <Text style={{ color: '#FFFFFF', fontSize: 17, textAlign: 'center', lineHeight: 24 }}>
        HOVIN is not configured.
      </Text>
      <Text style={{ color: '#B7BCC2', fontSize: 13, textAlign: 'center', marginTop: 10, lineHeight: 19 }}>
        Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY and rebuild the app.
      </Text>
    </View>
  );
}

export default function RootLayout() {
  useDebugTestAuthInjection();

  // The native launch view is intentionally branded, but it must never remain
  // above the receiving application after React has mounted. This explicit
  // dismissal is required for the direct Xcode Release build used by HOVIN.
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  if (!publishableKey) {
    return <SafeAreaProvider><ConfigurationRequired /></SafeAreaProvider>;
  }

  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <Stack screenOptions={{ headerShown: false }} />
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
