import { execFileSync } from "node:child_process";
import { createSign } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assertNoPinInput, assertPinNotInEnvironment, resolveEsealLibrary, signWithToken, verifiedTokenSignature } from "@/lib/eta/eseal-provider";
import { pkcs11TokenConnection, type Pkcs11Module } from "@/lib/eta/eseal-pkcs11";

function testCertificate() {
  const directory = mkdtempSync(join(tmpdir(), "eseal-"));
  const keyPath = join(directory, "key.pem");
  const certPath = join(directory, "cert.pem");
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-keyout", keyPath, "-out", certPath, "-days", "1", "-nodes", "-subj", "/CN=HV Test Token"], { stdio: "ignore" });
  const certificateDer = execFileSync("openssl", ["x509", "-in", certPath, "-outform", "DER"]);
  return { key: readFileSync(keyPath), certificateDer };
}

describe("local e-seal provider", () => {
  it("verifies a signature made by the token key and withholds a signature that does not match", () => {
    const { key, certificateDer } = testCertificate();
    const document = Buffer.from("HotelsVendors local e-seal test\n");
    const signer = createSign("RSA-SHA256");
    signer.update(document);
    const signature = signer.sign(key);
    const signed = verifiedTokenSignature(document, { signature, certificateDer }, "2026-11-11T00:00:00.000Z");
    expect(signed.algorithm).toBe("SHA256-RSA-PKCS");
    expect(signed.certificateFingerprint).toMatch(/^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/);
    expect(() => verifiedTokenSignature(document, { signature: Buffer.from("not-the-signature"), certificateDer })).toThrow("ESEAL_SIGNATURE_NOT_VERIFIED");
  });

  it("refuses a PIN supplied in the signing request or the environment", () => {
    expect(() => assertNoPinInput({ pin: "1234" })).toThrow("ESEAL_PIN_NOT_ACCEPTED");
    expect(() => assertPinNotInEnvironment({ ETA_ESEAL_PIN: "1234" })).toThrow("ESEAL_PIN_ENV_FORBIDDEN");
  });

  it("accepts only a token library outside this project", () => {
    const directory = mkdtempSync(join(tmpdir(), "eseal-lib-"));
    const library = join(directory, "libeps2003csp11.dylib");
    writeFileSync(library, "");
    expect(resolveEsealLibrary({ ETA_ESEAL_PKCS11_LIBRARY: library })).toBe(library);
    expect(() => resolveEsealLibrary({ ETA_ESEAL_PKCS11_LIBRARY: "libeps2003csp11.dylib" })).toThrow("ESEAL_LIBRARY_PATH_INVALID");
    const inside = join(process.cwd(), `.eseal-test-${Date.now()}.dylib`);
    writeFileSync(inside, "");
    try {
      expect(() => resolveEsealLibrary({ ETA_ESEAL_PKCS11_LIBRARY: inside })).toThrow("ESEAL_LIBRARY_PATH_INVALID");
    } finally {
      rmSync(inside);
    }
  });

  it("uses the certificate that belongs to the signing key when the token also holds the authority certificate", async () => {
    const { key, certificateDer } = testCertificate();
    const document = Buffer.from("HotelsVendors local e-seal test\n");
    const pkcs11 = fakePkcs11({ key, certificateDer, loginError: "", authorityFirst: true });
    const signed = await signWithToken(document, "user-pin", pkcs11TokenConnection("/usr/local/lib/libeps2003csp11.dylib", pkcs11));
    expect(signed.certificateFingerprint).toHaveLength(95);
  });

  it("signs through the token session and reports a rejected PIN without echoing it", async () => {
    const { key, certificateDer } = testCertificate();
    const document = Buffer.from("HotelsVendors local e-seal test\n");
    const pkcs11 = fakePkcs11({ key, certificateDer, loginError: "" });
    const signed = await signWithToken(document, "user-pin", pkcs11TokenConnection("/usr/local/lib/libeps2003csp11.dylib", pkcs11));
    expect(signed.signature.length).toBeGreaterThan(20);
    expect(pkcs11.loggedInWith).toBe("user-pin");
    pkcs11.loginError = "CKR_PIN_INCORRECT";
    await expect(signWithToken(document, "wrong-pin", pkcs11TokenConnection("/usr/local/lib/libeps2003csp11.dylib", pkcs11))).rejects.toThrow("ESEAL_PIN_REJECTED");
  });
});

function fakePkcs11(input: { key: Buffer; certificateDer: Buffer; loginError: string; authorityFirst?: boolean }): Pkcs11Module & { loggedInWith: string; loginError: string } {
  const leafId = Buffer.from("leaf-key");
  const state = { loggedInWith: "", loginError: input.loginError, template: [] as Array<{ type: number; value?: unknown }> };
  class PKCS11 {
    load() {}
    C_Initialize() {}
    C_Finalize() {}
    C_GetSlotList() { return [Buffer.from("slot")]; }
    C_OpenSession() { return Buffer.from("session"); }
    C_Login(_session: Buffer, _userType: number, pin: string) {
      state.loggedInWith = pin;
      if (state.loginError) throw new Error(state.loginError);
    }
    C_Logout() {}
    C_CloseSession() {}
    C_FindObjectsInit(_session: Buffer, template: Array<{ type: number; value?: unknown }>) { state.template = template; }
    C_FindObjects() {
      const wantsKey = state.template.some((attribute) => attribute.value === 3);
      if (wantsKey) return [Buffer.from("key")];
      const requestedId = state.template.find((attribute) => attribute.type === 258)?.value;
      if (Buffer.isBuffer(requestedId) && requestedId.equals(leafId)) return [Buffer.from("leaf-cert")];
      return input.authorityFirst ? [Buffer.from("authority-cert")] : [Buffer.from("leaf-cert")];
    }
    C_FindObjectsFinal() {}
    C_SignInit() {}
    C_Sign(_session: Buffer, data: Buffer) {
      const signer = createSign("RSA-SHA256");
      signer.update(data);
      return signer.sign(input.key);
    }
    C_GetAttributeValue(_session: Buffer, object: Buffer, template: Array<{ type: number }>) {
      if (object.equals(Buffer.from("key"))) return [{ type: 258, value: leafId }];
      if (object.equals(Buffer.from("authority-cert"))) return [{ type: 17, value: Buffer.from("authority-certificate") }];
      return [{ type: template[0]?.type ?? 17, value: input.certificateDer }];
    }
  }
  return {
    CKF_SERIAL_SESSION: 4,
    CKU_USER: 1,
    CKO_PRIVATE_KEY: 3,
    CKO_CERTIFICATE: 1,
    CKA_CLASS: 0,
    CKA_ID: 258,
    CKA_SIGN: 1,
    CKA_VALUE: 17,
    CKM_SHA256_RSA_PKCS: 64,
    PKCS11,
    get loggedInWith() { return state.loggedInWith; },
    set loginError(value: string) { state.loginError = value; },
  };
}
