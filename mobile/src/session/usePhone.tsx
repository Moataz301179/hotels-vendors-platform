import { useAuth, useClerk, useUser } from "@clerk/expo";
import * as SQLite from "expo-sqlite";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createHovinClient, HovinApiError, isRetryableReceiptFailure, resolveOrigin, type PhoneHome, type ReceiptSubmission } from "../api/hovin";
import { fieldStateAction } from "./accountField";
import { clearAccountFieldState, flushGrns, getOutboxSummary, initializeOutbox, readDeviceValue, writeDeviceValue } from "../sync/offlineQueue";

const ACCOUNT_KEY = "signed-in-account";

export function usePhone() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const origin = useMemo(() => resolveOrigin(), []);
  const [database, setDatabase] = useState<SQLite.SQLiteDatabase | null>(null);
  const [home, setHome] = useState<PhoneHome | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "offline" | "error" | "config">("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [queued, setQueued] = useState(0);
  const accountId = user?.id ?? null;

  useEffect(() => {
    let cancelled = false;
    void SQLite.openDatabaseAsync("hovin.db").then(async (opened) => {
      await initializeOutbox(opened);
      if (!cancelled) setDatabase(opened);
    }).catch(() => {
      if (!cancelled) setPhase("error");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!database || !accountId) return;
    let cancelled = false;
    void (async () => {
      const previous = await readDeviceValue(database, ACCOUNT_KEY);
      if (fieldStateAction(previous, accountId) === "clear") {
        await clearAccountFieldState(database);
        if (!cancelled) setHome(null);
      }
      await writeDeviceValue(database, ACCOUNT_KEY, accountId);
    })();
    return () => {
      cancelled = true;
    };
  }, [database, accountId]);

  const refresh = useCallback(async () => {
    if (!isSignedIn) return;
    if (!origin.ok) {
      setPhase("config");
      return;
    }
    setRefreshing(true);
    try {
      const next = await createHovinClient(getToken).home();
      setHome(next);
      setPhase("ready");
      if (database) {
        await flushGrns(database, next.account.tenantId, async (item, key) => {
          const payload = JSON.parse(item.payload) as ReceiptSubmission;
          await createHovinClient(getToken).submitReceipt(payload, key);
        });
        const summary = await getOutboxSummary(database, next.account.tenantId);
        setQueued(summary.queued);
      }
    } catch (error) {
      const offline = isRetryableReceiptFailure(error) || (error instanceof HovinApiError && error.status === 0);
      setPhase(offline ? "offline" : "error");
    } finally {
      setRefreshing(false);
    }
  }, [database, getToken, isSignedIn, origin.ok]);

  useEffect(() => {
    if (isLoaded && isSignedIn && database) void refresh();
  }, [database, isLoaded, isSignedIn, refresh]);

  const client = useCallback(() => createHovinClient(getToken), [getToken]);

  return {
    isLoaded,
    isSignedIn,
    home,
    phase,
    refreshing,
    refresh,
    queued,
    origin,
    database,
    accountId,
    client,
    signOut,
  };
}

type PhoneValue = ReturnType<typeof usePhone>;
const PhoneContext = createContext<PhoneValue | null>(null);

export function PhoneProvider({ children }: { children: ReactNode }) {
  const value = usePhone();
  return <PhoneContext.Provider value={value}>{children}</PhoneContext.Provider>;
}

export function usePhoneContext() {
  const value = useContext(PhoneContext);
  if (!value) throw new Error("PhoneProvider is required");
  return value;
}

