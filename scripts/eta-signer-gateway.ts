/**
 * Dedicated local eSeal gateway. Run only on the host physically attached to
 * the registered USB token. It is loopback-only by default and delegates the
 * private-key operation to a separately installed, approved provider command.
 *
 * Required local environment:
 * ETA_SIGNER_GATEWAY_SHARED_SECRET     random 32+ character secret
 * ETA_ESEAL_PROVIDER_COMMAND           absolute path to approved provider wrapper
 * Optional: ETA_SIGNER_GATEWAY_PORT (defaults to 4319)
 *
 * The provider receives one JSON request on stdin and must return one JSON
 * response on stdout matching SignResponse. It must obtain any PIN through
 * its own local protected UI/token mechanism; this gateway never accepts PINs.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { spawn } from "node:child_process";
import { validateSignRequest, validateSignResponse, verifyRequestMac } from "@/lib/eta/signer-gateway-contract";

const port = Number(process.env.ETA_SIGNER_GATEWAY_PORT || 4319);
const secret = process.env.ETA_SIGNER_GATEWAY_SHARED_SECRET || "";
const providerCommand = process.env.ETA_ESEAL_PROVIDER_COMMAND || "";
const seenNonces = new Map<string, number>();

function json(response: ServerResponse, status: number, value: object) {
  response.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  response.end(JSON.stringify(value));
}

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of request) {
    const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    length += value.length;
    if (length > 1_500_000) throw new Error("REQUEST_TOO_LARGE");
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function providerSign(request: unknown) {
  if (!providerCommand.startsWith("/")) throw new Error("ESEAL_PROVIDER_NOT_CONFIGURED");
  await access(providerCommand, constants.X_OK).catch(() => { throw new Error("ESEAL_PROVIDER_NOT_CONFIGURED"); });
  return new Promise<unknown>((resolve, reject) => {
    const child = spawn(providerCommand, [], { stdio: ["pipe", "pipe", "pipe"], shell: false, windowsHide: true });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGTERM"), 30_000);
    child.stdout.on("data", (chunk) => { stdout += String(chunk); if (stdout.length > 128_000) child.kill("SIGTERM"); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); if (stderr.length > 8_000) child.kill("SIGTERM"); });
    child.once("error", reject);
    child.once("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error("ESEAL_PROVIDER_FAILED"));
      try { resolve(JSON.parse(stdout)); } catch { reject(new Error("ESEAL_PROVIDER_INVALID_RESPONSE")); }
    });
    child.stdin.end(JSON.stringify(request));
  });
}

function cleanupNonces(now = Date.now()) {
  for (const [nonce, expiresAt] of seenNonces) if (expiresAt <= now) seenNonces.delete(nonce);
}

const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    return json(response, secret && providerCommand ? 200 : 503, { ok: Boolean(secret && providerCommand), signer: "local-eseal", providerConfigured: Boolean(providerCommand) });
  }
  if (request.method !== "POST" || request.url !== "/v1/sign") return json(response, 404, { error: "NOT_FOUND" });
  try {
    const rawBody = await readBody(request);
    const nonce = verifyRequestMac(secret, String(request.headers["x-hv-signer-timestamp"] || ""), String(request.headers["x-hv-signer-nonce"] || ""), String(request.headers["x-hv-signer-signature"] || ""), rawBody);
    cleanupNonces();
    if (seenNonces.has(nonce)) throw new Error("REPLAYED_SIGN_REQUEST");
    const signRequest = validateSignRequest(JSON.parse(rawBody));
    seenNonces.set(nonce, Date.now() + 120_000);
    const signed = validateSignResponse(await providerSign(signRequest));
    return json(response, 200, signed);
  } catch (error) {
    const code = error instanceof Error ? error.message : "SIGNER_GATEWAY_ERROR";
    const status = ["UNAUTHORIZED_SIGN_REQUEST", "STALE_SIGN_REQUEST", "REPLAYED_SIGN_REQUEST"].includes(code) ? 401 : 503;
    return json(response, status, { error: code });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`ETA signer gateway listening on 127.0.0.1:${port}`);
});
