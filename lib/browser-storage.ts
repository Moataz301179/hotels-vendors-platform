"use client";

import { useMemo, useSyncExternalStore } from "react";

/** A browser preference store with stable snapshots and cross-tab updates. */
export function createBrowserStore<T>(key: string, initial: T, parse: (value: unknown) => T) {
  const empty = JSON.stringify(initial);
  let fallback = empty;
  const eventName = `hv:storage:${key}`;
  const snapshot = () => {
    try { return localStorage.getItem(key) ?? fallback; }
    catch { return fallback; }
  };
  const subscribe = (notify: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) notify();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(eventName, notify);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(eventName, notify);
    };
  };
  const decode = (raw: string) => {
    try { return parse(JSON.parse(raw)); } catch { return parse(raw); }
  };
  return {
    useValue() {
      const raw = useSyncExternalStore(subscribe, snapshot, () => empty);
      return useMemo(() => decode(raw), [raw]);
    },
    update(change: (value: T) => T) {
      fallback = JSON.stringify(change(decode(snapshot())));
      try { localStorage.setItem(key, fallback); } catch { /* Keep the current session usable when storage is blocked. */ }
      window.dispatchEvent(new Event(eventName));
    },
  };
}
