import type { NextRequest } from "next/server";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/**
 * Clerk decorates `NextResponse.next()` with an absolute `x-middleware-rewrite`
 * on `localhost`. Next renders that rewrite in-process only when its origin
 * matches the request. The packaged smoke server binds `HOSTNAME=127.0.0.1`,
 * so Next instead proxies the request to `localhost` and the client gets no
 * bytes until curl times out.
 *
 * Rewriting the header to the listen address does not stick: Next rebuilds the
 * URL from the normalized request host and puts `localhost` back. A bare path
 * is parsed with `new URL` and throws. Clerk has already replaced
 * `x-middleware-next` with that absolute rewrite. Dropping the rewrite without
 * restoring `x-middleware-next` makes Next treat the middleware result as the
 * final response, which is HTTP 200 with an empty body. Restoring
 * `x-middleware-next` is the same internal continue used by public pages, and
 * Clerk's auth request headers stay in place. A rewrite to a different path,
 * or to any non-loopback host, is preserved.
 */
export function alignLoopbackRewrite(response: Response, request: NextRequest): Response {
  const rewrite = response.headers.get("x-middleware-rewrite");
  if (!rewrite || !/^[a-z][a-z0-9+.-]*:\/\//i.test(rewrite)) return response;

  let target: URL;
  try {
    target = new URL(rewrite);
  } catch {
    return response;
  }
  if (!LOOPBACK_HOSTS.has(target.hostname)) return response;

  const current = request.nextUrl;
  if (target.pathname === current.pathname && target.search === current.search) {
    response.headers.delete("x-middleware-rewrite");
    response.headers.set("x-middleware-next", "1");
  }
  return response;
}
