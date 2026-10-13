import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";

function clientProbe() {
  let reject: (error: { response: { status: number }; config: { url: string; headers: Record<string, string>; _retry?: boolean } }) => Promise<unknown> = async () => undefined;
  let release: (value: unknown) => void = () => undefined;
  const refresh = vi.fn(() => new Promise(resolve => { release = resolve; }));
  const retry = vi.fn(async (config: unknown) => config);
  const client = Object.assign(retry, { interceptors: {
    request: { use: () => undefined },
    response: { use: (_: unknown, callback: typeof reject) => { reject = callback; } },
  } });
  const values: Record<string, string> = { refresh_token: "original" };
  const store = {
    getItemAsync: vi.fn(async (key: string) => values[key] ?? null),
    setItemAsync: vi.fn(async (key: string, value: string) => { values[key] = value; }),
    deleteItemAsync: vi.fn(async (key: string) => { delete values[key]; }),
  };
  const source = ts.transpileModule(readFileSync("mobile/src/api/index.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  runInNewContext(source, { exports: {}, process: { env: {} }, require: (id: string) => {
    if (id === "axios") return { create: () => client, post: refresh };
    if (id === "expo-secure-store") return store;
    throw new Error(id);
  } });
  return { reject, refresh, retry, store, release: () => release({ data: { success: true, data: { accessToken: "next-access", refreshToken: "next-refresh" } } }) };
}
describe("mobile access-token refresh", () => {
  it("shares a single rotation between concurrent 401s, including session restoration", async () => {
    const probe = clientProbe();
    const a = probe.reject({ response: { status: 401 }, config: { url: "/auth/me", headers: {} } });
    const b = probe.reject({ response: { status: 401 }, config: { url: "/orders", headers: {} } });
    await vi.waitFor(() => expect(probe.refresh).toHaveBeenCalledTimes(1));
    probe.release();
    await Promise.all([a, b]);
    expect(probe.retry).toHaveBeenCalledTimes(2);
    expect(probe.store.setItemAsync).toHaveBeenCalledWith("refresh_token", "next-refresh");
  });
  it("does not refresh invalid login credentials", async () => {
    const probe = clientProbe();
    await expect(probe.reject({ response: { status: 401 }, config: { url: "/auth/login", headers: {} } })).rejects.toBeDefined();
    expect(probe.refresh).not.toHaveBeenCalled();
  });
});
