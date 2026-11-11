import { execFileSync } from "node:child_process";
import { createSign } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assertDetachedCades } from "@/lib/eta/eseal-cades";
import { canonicalizeEtaPayload } from "@/lib/eta/canonicalizer";
import type { TokenConnection } from "@/lib/eta/eseal-provider";
import {
  buildPreprodDocument,
  officialPreprodTarget,
  probePreprod,
  sendPreprodInvoice,
  PREPROD_API_ORIGIN,
  PREPROD_TOKEN_URL,
} from "@/lib/eta/preprod-submission";

const SECRET = "preprod-client-secret";
const ISSUED_AT = new Date("2026-11-11T21:05:00.000Z");

function certificate() {
  const directory = mkdtempSync(join(tmpdir(), "eta-preprod-"));
  const keyPath = join(directory, "key.pem");
  const certPath = join(directory, "cert.pem");
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-keyout", keyPath, "-out", certPath, "-days", "1", "-nodes", "-subj", "/CN=HV Preprod Token"], { stdio: "ignore" });
  return { key: readFileSync(keyPath), certificateDer: execFileSync("openssl", ["x509", "-in", certPath, "-outform", "DER"]) };
}

function connection(key: Buffer, certificateDer: Buffer): TokenConnection {
  return {
    async sign() {
      throw new Error("RAW_SIGN_UNUSED");
    },
    async signPrepared(_pin, buildDocument) {
      const document = buildDocument(certificateDer);
      const signer = createSign("RSA-SHA256");
      signer.update(document);
      return { signature: signer.sign(key), certificateDer };
    },
  };
}

function document() {
  return buildPreprodDocument({
    issuerId: "123456789",
    issuerName: "Hotels Vendors Test",
    activityCode: "4620",
    internalId: "HV-PREPROD-TEST01",
    issuedAt: ISSUED_AT,
  });
}

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

function startStandIn(handler: (request: IncomingMessage, response: ServerResponse, body: string) => void) {
  const server = createServer(async (request, response) => {
    const body = await readBody(request);
    handler(request, response, body);
  });
  return new Promise<{ origin: string; close: () => Promise<void> }>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("ETA_STAND_IN_FAILED");
      resolve({
        origin: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}

describe("ETA preprod submission", () => {
  it("refuses the live tax authority before any network call", async () => {
    let calls = 0;
    await expect(sendPreprodInvoice({
      connection: connection(Buffer.from("unused"), Buffer.from("unused")),
      pin: "user-pin",
      document: document(),
      clientId: "client-id",
      clientSecret: SECRET,
      signedAt: ISSUED_AT,
      target: { apiOrigin: "https://api.invoicing.eta.gov.eg", tokenUrl: "https://id.eta.gov.eg/connect/token" },
      fetchImpl: async () => {
        calls += 1;
        return new Response();
      },
    })).rejects.toThrow("ETA_TARGET_REFUSED");
    expect(calls).toBe(0);
    expect(() => officialPreprodTarget({ ETA_API_URL: "https://api.invoicing.eta.gov.eg", ETA_IDENTITY_URL: "https://id.eta.gov.eg/connect/token" })).toThrow("ETA_TARGET_REFUSED");
  });

  it("signs one invoice and accepts the test-system response", async () => {
    const { key, certificateDer } = certificate();
    let submissionBody = "";
    const standIn = await startStandIn((request, response, body) => {
      if (request.url === "/connect/token") {
        expect(request.headers.authorization).toMatch(/^Basic /);
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ access_token: "test-access-token", expires_in: 3600 }));
        return;
      }
      submissionBody = body;
      expect(request.headers.authorization).toBe("Bearer test-access-token");
      response.writeHead(202, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ submissionId: "SUB-100", acceptedDocuments: [{ uuid: "DOC-100", internalId: "HV-PREPROD-TEST01" }], rejectedDocuments: [] }));
    });
    try {
      const result = await sendPreprodInvoice({
        connection: connection(key, certificateDer),
        pin: "user-pin",
        document: document(),
        clientId: "client-id",
        clientSecret: SECRET,
        signedAt: ISSUED_AT,
        target: { apiOrigin: standIn.origin, tokenUrl: `${standIn.origin}/connect/token` },
      });
      const sent = JSON.parse(submissionBody) as { documents: Array<Record<string, unknown>> };
      const signature = (sent.documents[0].signatures as Array<{ signatureType: string; value: string }>)[0];
      expect(sent.documents[0].receiver).toEqual({ address: expect.any(Object), type: "P", name: "Preprod test buyer" });
      expect(JSON.stringify(sent.documents[0].receiver)).not.toContain("123456789");
      const canonical = canonicalizeEtaPayload(document());
      expect(signature.signatureType).toBe("I");
      expect(submissionBody).not.toContain(SECRET);
      assertDetachedCades(Buffer.from(canonical.canonicalString, "utf8"), Buffer.from(signature.value, "base64"), ISSUED_AT);
      expect(result).toMatchObject({ target: "loopback", httpStatus: 202, submissionId: "SUB-100", acceptedUuid: "DOC-100", rejected: false, internalId: "HV-PREPROD-TEST01" });
    } finally {
      await standIn.close();
    }
  });

  it("reports a rejected document without revealing the client secret", async () => {
    const { key, certificateDer } = certificate();
    const standIn = await startStandIn((request, response) => {
      if (request.url === "/connect/token") {
        response.writeHead(401, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: SECRET }));
        return;
      }
      response.writeHead(202, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ submissionId: "SUB-200", acceptedDocuments: [], rejectedDocuments: [{ error: { message: `Invalid receiver ${SECRET}` } }] }));
    });
    try {
      await expect(sendPreprodInvoice({
        connection: connection(key, certificateDer),
        pin: "user-pin",
        document: document(),
        clientId: "client-id",
        clientSecret: SECRET,
        signedAt: ISSUED_AT,
        target: { apiOrigin: standIn.origin, tokenUrl: `${standIn.origin}/connect/token` },
      })).rejects.toThrow("ETA_PREPROD_AUTH_FAILED:401");
    } finally {
      await standIn.close();
    }

    const acceptingAuth = await startStandIn((request, response) => {
      if (request.url === "/connect/token") {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ access_token: "test-access-token" }));
        return;
      }
      response.writeHead(202, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ submissionId: "SUB-200", acceptedDocuments: [], rejectedDocuments: [{ error: { message: `Invalid receiver ${SECRET}` } }] }));
    });
    try {
      const result = await sendPreprodInvoice({
        connection: connection(key, certificateDer),
        pin: "user-pin",
        document: document(),
        clientId: "client-id",
        clientSecret: SECRET,
        signedAt: ISSUED_AT,
        target: { apiOrigin: acceptingAuth.origin, tokenUrl: `${acceptingAuth.origin}/connect/token` },
      });
      expect(result.rejected).toBe(true);
      expect(result.rejectionReason).toBe("Invalid receiver [redacted]");
      expect(result.rejectionReason).not.toContain(SECRET);
    } finally {
      await acceptingAuth.close();
    }
  });

  it("treats the unauthenticated preprod responses as healthy", async () => {
    const calls: string[] = [];
    const result = await probePreprod(async (url, init) => {
      calls.push(`${init?.method ?? "GET"} ${url}`);
      const status = String(url).endsWith("/connect/token") ? 400 : 401;
      return new Response("", { status });
    }, { apiOrigin: PREPROD_API_ORIGIN, tokenUrl: PREPROD_TOKEN_URL });
    expect(result).toEqual({ identityStatus: 400, submissionStatus: 401, healthy: true });
    expect(calls).toEqual([
      `POST ${PREPROD_TOKEN_URL}`,
      `POST ${PREPROD_API_ORIGIN}/api/v1.0/documentsubmissions`,
    ]);
    expect(() => buildPreprodDocument({ ...documentInput(), issuerId: "123" })).toThrow("ETA_TAX_ID_REQUIRED");
  });
});

function documentInput() {
  return {
    issuerId: "123456789",
    issuerName: "Hotels Vendors Test",
    activityCode: "4620",
    internalId: "HV-PREPROD-TEST01",
    issuedAt: ISSUED_AT,
  };
}
