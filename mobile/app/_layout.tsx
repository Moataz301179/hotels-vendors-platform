import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

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
  // The native launch view is intentionally branded, but it must never remain
  // above the receiving application after React has mounted. This explicit
  // dismissal is required for the direct Xcode Release build used by HOVIN.
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  if (!publishableKey) {
    return <ConfigurationRequired />;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
      __experimental_disableNativeClientSync
    >
      <Stack screenOptions={{ headerShown: false }} />
    </ClerkProvider>
  );
}
