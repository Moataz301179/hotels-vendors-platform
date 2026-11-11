import { createHash, createVerify, X509Certificate } from "node:crypto";
import { canonicalizeEtaPayload } from "@/lib/eta/canonicalizer";
import { LOCAL_SIGNING_INVOICE } from "@/lib/eta/eseal-invoice";
import type { TokenConnection } from "@/lib/eta/eseal-provider";

const ID_DATA = "1.2.840.113549.1.7.1";
const ID_SIGNED_DATA = "1.2.840.113549.1.7.2";
const SHA256 = "2.16.840.1.101.3.4.2.1";
const SHA256_WITH_RSA = "1.2.840.113549.1.1.11";
const CONTENT_TYPE = "1.2.840.113549.1.9.3";
const MESSAGE_DIGEST = "1.2.840.113549.1.9.4";
const SIGNING_TIME = "1.2.840.113549.1.9.5";
const SIGNING_CERTIFICATE_V2 = "1.2.840.113549.1.9.16.2.47";

export type LocalCadesSignature = {
  internalId: string;
  algorithm: "CAdES-BES";
  certificateFingerprint: string;
  canonicalSha256: string;
  cmsDer: Buffer;
  submitted: false;
};

type CertificateIdentity = {
  serial: Buffer;
  issuer: Buffer;
};

export async function signDetachedCades(connection: TokenConnection, pin: string, document: Buffer, signedAt = new Date()): Promise<{ cmsDer: Buffer; certificateFingerprint: string }> {
  if (!pin.trim()) throw new Error("ESEAL_PIN_REQUIRED");
  if (!document.length) throw new Error("ETA_CANONICALIZATION_EMPTY_DOCUMENT");
  const signed = await connection.signPrepared(pin, (certificateDer) => signedAttributeSet(document, certificateDer, signedAt));
  const attributes = signedAttributeSet(document, signed.certificateDer, signedAt);
  assertAttributeSignature(attributes, signed.signature, signed.certificateDer);
  return {
    cmsDer: contentInfo(document, signed.certificateDer, signed.signature, signedAt),
    certificateFingerprint: fingerprint(signed.certificateDer),
  };
}

export async function signLocalInvoiceCades(connection: TokenConnection, pin: string, signedAt = new Date()): Promise<LocalCadesSignature> {
  const canonical = canonicalizeEtaPayload({
    ...LOCAL_SIGNING_INVOICE,
    invoiceLines: LOCAL_SIGNING_INVOICE.invoiceLines.map((line) => ({ ...line })),
  });
  const document = Buffer.from(canonical.canonicalString, "utf8");
  const signed = await signDetachedCades(connection, pin, document, signedAt);
  return {
    internalId: LOCAL_SIGNING_INVOICE.internalId,
    algorithm: "CAdES-BES",
    certificateFingerprint: signed.certificateFingerprint,
    canonicalSha256: canonical.sha256Digest,
    cmsDer: signed.cmsDer,
    submitted: false,
  };
}

export function assertDetachedCades(document: Buffer, cmsDer: Buffer, signedAt: Date): void {
  const certificate = certificateFromCms(cmsDer);
  const attributes = signedAttributeSet(document, certificate, signedAt);
  const signature = signatureFromCms(cmsDer);
  assertAttributeSignature(attributes, signature, certificate);
}

function assertAttributeSignature(attributes: Buffer, signature: Buffer, certificateDer: Buffer): void {
  const certificate = new X509Certificate(certificateDer);
  const verifier = createVerify("RSA-SHA256");
  verifier.update(attributes);
  if (!signature.length || !verifier.verify(certificate.publicKey, signature)) throw new Error("ESEAL_CADES_NOT_VERIFIED");
}

function signedAttributeSet(document: Buffer, certificateDer: Buffer, signedAt: Date): Buffer {
  const identity = certificateIdentity(certificateDer);
  const certificateHash = createHash("sha256").update(certificateDer).digest();
  const documentHash = createHash("sha256").update(document).digest();
  const signingCertificate = sequence([
    sequence([
      sequence([
        octetString(certificateHash),
        sequence([
          sequence([explicit(0xa4, identity.issuer)]),
          integer(identity.serial),
        ]),
      ]),
    ]),
  ]);
  return set([
    attribute(CONTENT_TYPE, [objectIdentifier(ID_DATA)]),
    attribute(SIGNING_TIME, [utcTime(signedAt)]),
    attribute(MESSAGE_DIGEST, [octetString(documentHash)]),
    attribute(SIGNING_CERTIFICATE_V2, [signingCertificate]),
  ]);
}

function contentInfo(document: Buffer, certificateDer: Buffer, signature: Buffer, signedAt: Date): Buffer {
  const identity = certificateIdentity(certificateDer);
  const signerInfo = sequence([
    integer(Buffer.from([1])),
    sequence([identity.issuer, integer(identity.serial)]),
    algorithm(SHA256),
    retag(signedAttributeSet(document, certificateDer, signedAt), 0xa0),
    algorithm(SHA256_WITH_RSA),
    octetString(signature),
  ]);
  const signedData = sequence([
    integer(Buffer.from([1])),
    set([algorithm(SHA256)]),
    sequence([objectIdentifier(ID_DATA)]),
    retag(set([certificateDer]), 0xa0),
    set([signerInfo]),
  ]);
  return sequence([objectIdentifier(ID_SIGNED_DATA), explicit(0xa0, signedData)]);
}

function certificateFromCms(cmsDer: Buffer): Buffer {
  const info = readTlv(cmsDer, 0);
  const signedDataWrapper = readTlv(cmsDer, nextChild(cmsDer, info, 1));
  const signedData = readTlv(cmsDer, signedDataWrapper.valueStart);
  return readTlv(cmsDer, nextChild(cmsDer, signedData, 3)).value.subarray(0);
}

function signatureFromCms(cmsDer: Buffer): Buffer {
  const info = readTlv(cmsDer, 0);
  const signedDataWrapper = readTlv(cmsDer, nextChild(cmsDer, info, 1));
  const signedData = readTlv(cmsDer, signedDataWrapper.valueStart);
  const signerSet = readTlv(cmsDer, nextChild(cmsDer, signedData, 4));
  const signer = readTlv(cmsDer, signerSet.valueStart);
  return readTlv(cmsDer, nextChild(cmsDer, signer, 5)).value;
}

function certificateIdentity(certificateDer: Buffer): CertificateIdentity {
  try {
    const certificate = readTlv(certificateDer, 0);
    const body = readTlv(certificateDer, certificate.valueStart);
    let cursor = body.valueStart;
    if (certificateDer[cursor] === 0xa0) cursor = readTlv(certificateDer, cursor).end;
    const serial = readTlv(certificateDer, cursor);
    cursor = readTlv(certificateDer, serial.end).end;
    const issuer = readTlv(certificateDer, cursor);
    if (issuer.tag !== 0x30 || !serial.value.length) throw new Error("ESEAL_CERTIFICATE_UNREADABLE");
    return { serial: serial.value, issuer: issuer.bytes };
  } catch (error) {
    if (error instanceof Error && error.message === "ESEAL_CERTIFICATE_UNREADABLE") throw error;
    throw new Error("ESEAL_CERTIFICATE_UNREADABLE");
  }
}

function attribute(id: string, values: Buffer[]): Buffer {
  return sequence([objectIdentifier(id), set(values)]);
}

function algorithm(id: string): Buffer {
  return sequence([objectIdentifier(id), Buffer.from([0x05, 0x00])]);
}

function objectIdentifier(dotted: string): Buffer {
  const arcs = dotted.split(".").map(Number);
  const body = [arcs[0] * 40 + arcs[1]];
  for (const arc of arcs.slice(2)) {
    const encoded = [arc & 0x7f];
    let value = arc >> 7;
    while (value > 0) {
      encoded.unshift((value & 0x7f) | 0x80);
      value >>= 7;
    }
    body.push(...encoded);
  }
  return tlv(0x06, Buffer.from(body));
}

function integer(value: Buffer): Buffer {
  let body = value;
  while (body.length > 1 && body[0] === 0x00 && (body[1] & 0x80) === 0) body = body.subarray(1);
  if (body[0] & 0x80) body = Buffer.concat([Buffer.from([0x00]), body]);
  return tlv(0x02, body);
}

function octetString(value: Buffer): Buffer {
  return tlv(0x04, value);
}

function utcTime(date: Date): Buffer {
  const year = String(date.getUTCFullYear() % 100).padStart(2, "0");
  const part = (value: number) => String(value).padStart(2, "0");
  const text = `${year}${part(date.getUTCMonth() + 1)}${part(date.getUTCDate())}${part(date.getUTCHours())}${part(date.getUTCMinutes())}${part(date.getUTCSeconds())}Z`;
  return tlv(0x17, Buffer.from(text, "ascii"));
}

function sequence(parts: Buffer[]): Buffer {
  return tlv(0x30, Buffer.concat(parts));
}

function set(parts: Buffer[]): Buffer {
  return tlv(0x31, Buffer.concat([...parts].sort(Buffer.compare)));
}

function explicit(tag: number, inner: Buffer): Buffer {
  return tlv(tag, inner);
}

function retag(value: Buffer, tag: number): Buffer {
  const retagged = Buffer.from(value);
  retagged[0] = tag;
  return retagged;
}

function tlv(tag: number, value: Buffer): Buffer {
  return Buffer.concat([Buffer.from([tag]), lengthBytes(value.length), value]);
}

function lengthBytes(length: number): Buffer {
  if (length < 128) return Buffer.from([length]);
  const bytes: number[] = [];
  let remaining = length;
  while (remaining > 0) {
    bytes.unshift(remaining & 0xff);
    remaining = Math.floor(remaining / 256);
  }
  return Buffer.from([0x80 | bytes.length, ...bytes]);
}

type Tlv = { tag: number; valueStart: number; value: Buffer; bytes: Buffer; end: number };

function readTlv(buffer: Buffer, offset: number): Tlv {
  const tag = buffer[offset];
  let cursor = offset + 1;
  const first = buffer[cursor];
  let length = first;
  cursor += 1;
  if (first >= 0x80) {
    const count = first & 0x7f;
    length = 0;
    for (let index = 0; index < count; index += 1) length = length * 256 + buffer[cursor + index];
    cursor += count;
  }
  const end = cursor + length;
  return { tag, valueStart: cursor, value: buffer.subarray(cursor, end), bytes: buffer.subarray(offset, end), end };
}

function nextChild(buffer: Buffer, parent: Tlv, index: number): number {
  let cursor = parent.valueStart;
  for (let current = 0; current < index; current += 1) cursor = readTlv(buffer, cursor).end;
  return cursor;
}

function fingerprint(certificateDer: Buffer): string {
  return createHash("sha256").update(certificateDer).digest("hex").toUpperCase().match(/.{2}/g)?.join(":") ?? "";
}
