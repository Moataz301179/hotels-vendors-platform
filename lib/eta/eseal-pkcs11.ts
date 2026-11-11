import { createRequire } from "node:module";
import type { TokenConnection, TokenSignature } from "@/lib/eta/eseal-provider";

type Attribute = { type: number; value?: unknown };

export type Pkcs11Module = {
  CKF_SERIAL_SESSION: number;
  CKU_USER: number;
  CKO_PRIVATE_KEY: number;
  CKO_CERTIFICATE: number;
  CKA_CLASS: number;
  CKA_ID: number;
  CKA_SIGN: number;
  CKA_VALUE: number;
  CKM_SHA256_RSA_PKCS: number;
  PKCS11: new () => Pkcs11Session;
};

type Pkcs11Session = {
  load(libraryPath: string): void;
  C_Initialize(): void;
  C_Finalize(): void;
  C_GetSlotList(tokenPresent: boolean): Buffer[];
  C_OpenSession(slot: Buffer, flags: number): Buffer;
  C_Login(session: Buffer, userType: number, pin: string): void;
  C_Logout(session: Buffer): void;
  C_CloseSession(session: Buffer): void;
  C_FindObjectsInit(session: Buffer, template: Attribute[]): void;
  C_FindObjects(session: Buffer, maxCount?: number): Buffer[];
  C_FindObjectsFinal(session: Buffer): void;
  C_SignInit(session: Buffer, mechanism: { mechanism: number }, key: Buffer): void;
  C_Sign(session: Buffer, data: Buffer, output: Buffer): Buffer;
  C_GetAttributeValue(session: Buffer, object: Buffer, template: Attribute[]): Attribute[];
};

export function loadPkcs11Module(projectRoot = process.cwd()): Pkcs11Module {
  const require = createRequire(`${projectRoot}/package.json`);
  try {
    return require("pkcs11js") as Pkcs11Module;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Cannot find module")) throw new Error("ESEAL_PKCS11_PACKAGE_MISSING");
    throw error;
  }
}

export function pkcs11TokenConnection(libraryPath: string, pkcs11: Pkcs11Module): TokenConnection {
  return {
    async sign(document: Buffer, pin: string): Promise<TokenSignature> {
      const session = new pkcs11.PKCS11();
      let open: Buffer | null = null;
      let loggedIn = false;
      session.load(libraryPath);
      session.C_Initialize();
      try {
        const slots = session.C_GetSlotList(true);
        if (!slots.length) throw new Error("ESEAL_TOKEN_NOT_FOUND");
        open = session.C_OpenSession(slots[0], pkcs11.CKF_SERIAL_SESSION);
        try {
          session.C_Login(open, pkcs11.CKU_USER, pin);
        } catch (error) {
          throw loginError(error);
        }
        loggedIn = true;
        const key = findOne(session, open, [{ type: pkcs11.CKA_CLASS, value: pkcs11.CKO_PRIVATE_KEY }, { type: pkcs11.CKA_SIGN, value: true }]);
        if (!key) throw new Error("ESEAL_SIGNING_KEY_NOT_FOUND");
        const keyId = session.C_GetAttributeValue(open, key, [{ type: pkcs11.CKA_ID }])[0]?.value;
        if (!Buffer.isBuffer(keyId) || !keyId.length) throw new Error("ESEAL_KEY_ID_MISSING");
        const certificate = findOne(session, open, [{ type: pkcs11.CKA_CLASS, value: pkcs11.CKO_CERTIFICATE }, { type: pkcs11.CKA_ID, value: keyId }]);
        if (!certificate) throw new Error("ESEAL_CERTIFICATE_NOT_FOUND");
        const certificateDer = session.C_GetAttributeValue(open, certificate, [{ type: pkcs11.CKA_VALUE }])[0]?.value;
        if (!Buffer.isBuffer(certificateDer) || !certificateDer.length) throw new Error("ESEAL_CERTIFICATE_UNREADABLE");
        session.C_SignInit(open, { mechanism: pkcs11.CKM_SHA256_RSA_PKCS }, key);
        const signature = session.C_Sign(open, document, Buffer.alloc(1024));
        if (!Buffer.isBuffer(signature) || !signature.length) throw new Error("ESEAL_TOKEN_ERROR");
        return { signature, certificateDer };
      } finally {
        if (open && loggedIn) {
          try { session.C_Logout(open); } catch { /* The token session is already closing. */ }
        }
        if (open) {
          try { session.C_CloseSession(open); } catch { /* The token session is already closed. */ }
        }
        try { session.C_Finalize(); } catch { /* The library is already shut down. */ }
      }
    },
  };
}

function findOne(session: Pkcs11Session, open: Buffer, template: Attribute[]): Buffer | null {
  session.C_FindObjectsInit(open, template);
  try {
    const found = session.C_FindObjects(open, 1);
    return found[0] ?? null;
  } finally {
    session.C_FindObjectsFinal(open);
  }
}

function loginError(error: unknown): Error {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("CKR_PIN_LOCKED")) return new Error("ESEAL_PIN_LOCKED");
  if (message.includes("CKR_PIN_INCORRECT") || message.includes("CKR_PIN_LEN_RANGE")) return new Error("ESEAL_PIN_REJECTED");
  return new Error("ESEAL_TOKEN_ERROR");
}
