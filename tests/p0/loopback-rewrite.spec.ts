import { describe, expect, it } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { alignLoopbackRewrite } from "@/lib/security/loopback-rewrite";

describe("loopback middleware rewrites", () => {
  it("drops a same-path localhost rewrite so Next does not proxy it", () => {
    const request = new NextRequest("http://127.0.0.1:3100/login?redirect_url=%2Forders", {
      headers: { host: "127.0.0.1:3100" },
    });
    const response = NextResponse.next();
    response.headers.set("x-middleware-next", "1");
    response.headers.set("x-middleware-rewrite", "http://localhost:3100/login?redirect_url=%2Forders");

    const normalized = alignLoopbackRewrite(response, request);
    expect(normalized.headers.get("x-middleware-rewrite")).toBeNull();
    expect(normalized.headers.get("x-middleware-next")).toBe("1");
  });

  it("restores x-middleware-next after Clerk has replaced it with the rewrite", () => {
    const request = new NextRequest("http://127.0.0.1:3100/login");
    const response = NextResponse.next();
    response.headers.delete("x-middleware-next");
    response.headers.set("x-middleware-rewrite", "http://localhost:3100/login");

    const normalized = alignLoopbackRewrite(response, request);
    expect(normalized.headers.get("x-middleware-rewrite")).toBeNull();
    expect(normalized.headers.get("x-middleware-next")).toBe("1");
  });

  it("keeps a loopback rewrite that changes the path", () => {
    const request = new NextRequest("http://127.0.0.1:3100/demo");
    const response = NextResponse.next();
    response.headers.set("x-middleware-rewrite", "http://localhost:3100/sandbox");

    expect(alignLoopbackRewrite(response, request).headers.get("x-middleware-rewrite")).toBe(
      "http://localhost:3100/sandbox",
    );
  });

  it("does not rewrite an external Clerk destination", () => {
    const request = new NextRequest("http://127.0.0.1:3100/login");
    const response = NextResponse.next();
    const external = "https://clerk.hotelsvendors.com/v1/client/handshake?redirect_url=http%3A%2F%2F127.0.0.1%3A3100%2Flogin";
    response.headers.set("x-middleware-rewrite", external);

    expect(alignLoopbackRewrite(response, request).headers.get("x-middleware-rewrite")).toBe(external);
  });

  it("leaves an already relative rewrite unchanged", () => {
    const request = new NextRequest("http://127.0.0.1:3100/login");
    const response = NextResponse.next();
    response.headers.set("x-middleware-rewrite", "/login");

    expect(alignLoopbackRewrite(response, request).headers.get("x-middleware-rewrite")).toBe("/login");
  });

  it("applies the normalizer to Clerk middleware responses", () => {
    const proxy = readFileSync(join(process.cwd(), "proxy.ts"), "utf8");
    expect(proxy).toContain("alignLoopbackRewrite(clerkResponse, securedRequest)");
  });
});
