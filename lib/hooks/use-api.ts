"use client";

import { useState, useEffect, useCallback } from "react";

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(
  url: string | null,
  options?: RequestInit
): ApiState<T> {
  const [revision, setRevision] = useState(0);
  const requestKey = JSON.stringify([url, revision, options]);
  const [result, setResult] = useState<{ key: string; data: T | null; error: string | null } | null>(null);
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    let active = true;
    async function load() {
      try {
        const res = await fetch(url!, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          ...options,
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
        if (active) setResult({ key: requestKey, data: json.data ?? json, error: null });
      } catch (err) {
        if (active) setResult({ key: requestKey, data: null, error: err instanceof Error ? err.message : "Unknown error" });
      }
    }
    void load();
    return () => { active = false; controller.abort(); };
  }, [url, options, requestKey]);
  const refetch = useCallback(() => setRevision(value => value + 1), []);
  const current = result?.key === requestKey ? result : null;
  return { data: current?.data ?? null, loading: Boolean(url && !current), error: current?.error ?? null, refetch };
}

export function usePost<T, B = unknown>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const post = useCallback(
    async (body: B) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || `HTTP ${res.status}`);
        }
        setData(json.data ?? json);
        return json.data ?? json;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [url]
  );

  return { data, loading, error, post };
}
