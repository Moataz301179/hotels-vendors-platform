/** Normalize transport URLs only; never alter Clerk authentication headers. */
export function normalizeLoopbackRouting(headers: Headers, publicOrigin: string, requestUrl?: string) {
  const origin = new URL(publicOrigin);
  if (origin.protocol !== "https:" || !["hotelsvendors.com", "www.hotelsvendors.com"].includes(origin.hostname)) return;
  for (const name of ["location", "x-middleware-rewrite"]) {
    const value = headers.get(name);
    if (!value) continue;
    let target: URL;
    try { target = new URL(value); } catch { continue; }
    if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)) continue;
    const path = `${target.pathname}${target.search}${target.hash}`;
    if (path.startsWith("//")) continue;
    if (name === "x-middleware-rewrite") {
      if (!requestUrl) continue;
      const request = new URL(requestUrl);
      if (target.pathname !== request.pathname || target.search !== request.search) continue;
      // Clerk uses a same-path rewrite to forward verified request headers.
      // Resume locally while preserving every override/authentication header.
      headers.delete(name);
      headers.set("x-middleware-next", "1");
    } else {
      headers.set(name, new URL(path, origin).href);
    }
  }
}
