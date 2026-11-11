import { createHash, createVerify, X509Certificate } from "node:crypto";
import { existsSync, realpathSync, statSync } from "node:fs";
import { validateSignResponse, type SignResponse } from "@/lib/eta/signer-gateway-contract";

const LIBRARY_NAMES = [
  "libeps2003csp11.dylib",
  "libeps2003csp11.so",
  "libcastle.1.0.0.dylib",
  "libcastle.dylib",
  "libepsng_p11.dylib",
  "libshuttle_p11v2.dylib",
  "opensc-pkcs11.so",
  "opensc-pkcs11.dylib",
];

const LIBRARY_DIRECTORIES = ["/usr/local/lib", "/usr/lib", "/Library/OpenSC/lib", "/opt/homebrew/lib"];

export type TokenSignature = {
  signature: Buffer;
  certificateDer: Buffer;
};

export type TokenConnection = {
  sign(document: Buffer, pin: string): Promise<TokenSignature>;
  signPrepared(pin: string, buildDocument: (certificateDer: Buffer) => Buffer): Promise<TokenSignature>;
};

export function assertNoPinInput(value: unknown): void {
  if (!value || typeof value !== "object") return;
  if (Object.prototype.hasOwnProperty.call(value, "pin")) throw new Error("ESEAL_PIN_NOT_ACCEPTED");
}

export function assertPinNotInEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  if (env.ETA_ESEAL_PIN?.trim()) throw new Error("ESEAL_PIN_ENV_FORBIDDEN");
}

export function resolveEsealLibrary(env: NodeJS.ProcessEnv = process.env, projectRoot = process.cwd()): string {
  const configured = env.ETA_ESEAL_PKCS11_LIBRARY?.trim();
  if (configured) return acceptLibraryPath(configured, projectRoot);
  for (const directory of LIBRARY_DIRECTORIES) {
    for (const name of LIBRARY_NAMES) {
      const candidate = `${directory}/${name}`;
      if (existsSync(candidate)) return acceptLibraryPath(candidate, projectRoot);
    }
  }
  throw new Error("ESEAL_LIBRARY_NOT_FOUND");
}

function acceptLibraryPath(candidate: string, projectRoot: string): string {
  if (!candidate.startsWith("/")) throw new Error("ESEAL_LIBRARY_PATH_INVALID");
  if (!existsSync(candidate) || !statSync(candidate).isFile()) throw new Error("ESEAL_LIBRARY_NOT_FOUND");
  const resolved = realpathSync(candidate);
  const root = realpathSync(projectRoot);
  if (resolved === root || resolved.startsWith(`${root}/`)) throw new Error("ESEAL_LIBRARY_PATH_INVALID");
  return resolved;
}

export function verifiedTokenSignature(document: Buffer, signed: TokenSignature, signedAt = new Date().toISOString()): SignResponse {
  let certificate: X509Certificate;
  try {
    certificate = new X509Certificate(signed.certificateDer);
  } catch {
    throw new Error("ESEAL_CERTIFICATE_UNREADABLE");
  }
  const verifier = createVerify("RSA-SHA256");
  verifier.update(document);
  if (!signed.signature.length || !verifier.verify(certificate.publicKey, signed.signature)) {
    throw new Error("ESEAL_SIGNATURE_NOT_VERIFIED");
  }
  const fingerprint = createHash("sha256").update(signed.certificateDer).digest("hex").match(/.{2}/g)?.join(":") ?? "";
  return validateSignResponse({
    signature: signed.signature.toString("base64"),
    algorithm: "SHA256-RSA-PKCS",
    certificateFingerprint: fingerprint,
    signedAt,
  });
}

export async function signWithToken(document: Buffer, pin: string, connection: TokenConnection): Promise<SignResponse> {
  if (!pin.trim()) throw new Error("ESEAL_PIN_REQUIRED");
  const signed = await connection.sign(document, pin);
  return verifiedTokenSignature(document, signed);
}
