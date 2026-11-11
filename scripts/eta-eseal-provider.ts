import { createInterface } from "node:readline";
import { ReadStream, WriteStream } from "node:tty";
import { openSync } from "node:fs";
import { validateSignRequest } from "@/lib/eta/signer-gateway-contract";
import { signLocalInvoice } from "@/lib/eta/eseal-invoice";
import { assertNoPinInput, assertPinNotInEnvironment, resolveEsealLibrary, signWithToken } from "@/lib/eta/eseal-provider";
import { loadPkcs11Module, pkcs11TokenConnection } from "@/lib/eta/eseal-pkcs11";

const SELF_TEST = Buffer.from("HotelsVendors local e-seal test\n", "utf8");

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

export async function promptTokenPin(): Promise<string> {
  const fd = openSync("/dev/tty", "r+");
  const input = new ReadStream(fd);
  const output = new WriteStream(fd);
  const prompt = createInterface({ input, output, terminal: true });
  const hidden = prompt as typeof prompt & { _writeToOutput?: (text: string) => void };
  hidden._writeToOutput = (text: string) => {
    if (text.startsWith("Token user PIN")) output.write(text);
  };
  try {
    const pin = await new Promise<string>((resolve) => {
      prompt.question("Token user PIN (typed on this laptop, not shown): ", resolve);
    });
    output.write("\n");
    if (!pin.trim()) throw new Error("ESEAL_PIN_REQUIRED");
    return pin;
  } finally {
    prompt.close();
    input.destroy();
    output.destroy();
  }
}

export async function runProvider(raw: string, pin: string): Promise<string> {
  assertPinNotInEnvironment();
  const parsed = JSON.parse(raw) as unknown;
  assertNoPinInput(parsed);
  const request = validateSignRequest(parsed);
  const signed = await signWithToken(Buffer.from(request.documentBase64, "base64"), pin, pkcs11TokenConnection(resolveEsealLibrary(), await loadPkcs11Module()));
  return JSON.stringify(signed);
}

async function main() {
  assertPinNotInEnvironment();
  const pin = await promptTokenPin();
  try {
    const token = pkcs11TokenConnection(resolveEsealLibrary(), loadPkcs11Module());
    if (process.argv.includes("--sign-invoice")) {
      const signed = await signLocalInvoice(token, pin);
      process.stderr.write(`Signed local invoice ${signed.internalId} with the USB token.\nCertificate fingerprint: ${signed.certificateFingerprint}\nAlgorithm: ${signed.algorithm}\nSubmitted to the tax authority: no\n`);
      return;
    }
    if (process.argv.includes("--self-test")) {
      const signed = await signWithToken(SELF_TEST, pin, token);
      process.stderr.write(`Signed with the USB token.\nCertificate fingerprint: ${signed.certificateFingerprint}\nAlgorithm: ${signed.algorithm}\n`);
      return;
    }
    process.stdout.write(await runProvider(await readStdin(), pin));
  } finally {
    pin.replace(/./g, " ");
  }
}

if (process.argv[1]?.endsWith("eta-eseal-provider.ts")) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "ESEAL_TOKEN_ERROR";
    process.stderr.write(`${message}\n`);
    process.exit(1);
  });
}
