import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/expo';

/**
 * STAGING-ONLY test authentication shim.
 *
 * The Clerk native SDK requires a device (client) token that the Clerk Backend
 * API does not expose, so a backend-minted session token cannot activate the
 * native session. This shim lets the isolated staging build render the
 * signed-in experience against the real backend using a real Clerk session
 * token minted by the local staging token server.
 *
 * It is inert unless BOTH are true:
 *   - __DEV__ is true (Debug builds only)
 *   - EXPO_PUBLIC_HOVIN_TEST_USER is set (staging env only)
 * Production builds never activate it, and the real Clerk flow is unchanged.
 */

type TestUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
};

let testToken: string | null = null;
let testUser: TestUser | null = null;
const listeners = new Set<() => void>();

export function setTestSession(
  token: string | null,
  user?: { id: string; name: string; email: string },
) {
  testToken = token;
  testUser = user
    ? {
        id: user.id,
        firstName: user.name,
        lastName: null,
        emailAddresses: [{ emailAddress: user.email }],
      }
    : null;
  listeners.forEach((listener) => listener());
}

export function isTestAuthActive() {
  return __DEV__ && !!process.env.EXPO_PUBLIC_HOVIN_TEST_USER && !!testToken;
}

// Module-level stable function: a fresh closure per render would recreate the
// API client and retrigger the load effect in an infinite loop.
async function getTestToken() {
  return testToken;
}

function useTestAuthTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const listener = () => setTick((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return tick;
}

export function useHovinAuth() {
  const auth = useAuth();
  useTestAuthTick();
  if (isTestAuthActive()) {
    return {
      ...auth,
      isLoaded: true,
      isSignedIn: true,
      getToken: getTestToken,
    };
  }
  return auth;
}

export function useHovinUser() {
  const { user } = useUser();
  useTestAuthTick();
  if (isTestAuthActive() && testUser) {
    return { user: testUser as unknown as typeof user };
  }
  return { user };
}
