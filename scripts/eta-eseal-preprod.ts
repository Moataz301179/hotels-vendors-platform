import { loadPkcs11Module, pkcs11TokenConnection } from "@/lib/eta/eseal-pkcs11";
import { assertPinNotInEnvironment, resolveEsealLibrary } from "@/lib/eta/eseal-provider";
import {
  buildPreprodDocument,
  officialPreprodTarget,
  preprodInternalId,
  preprodCredentials,
  probePreprod,
  sendPreprodInvoice,
} from "@/lib/eta/preprod-submission";
import { promptTokenPin } from "./eta-eseal-provider";

async function health(): Promise<void> {
  const result = await probePreprod();
  process.stderr.write(`Preprod identity: HTTP ${result.identityStatus}\nPreprod submission route: HTTP ${result.submissionStatus}\nPreprod responding: ${result.healthy ? "yes" : "no"}\n`);
  if (!result.healthy) process.exitCode = 1;
}

async function submit(): Promise<void> {
  assertPinNotInEnvironment();
  const target = officialPreprodTarget();
  const credentials = preprodCredentials();
  const issuerId = process.env.ETA_ISSUER_ID?.trim() ?? "";
  const issuerName = process.env.ETA_ISSUER_NAME?.trim() ?? "";
  const activityCode = process.env.ETA_ACTIVITY_CODE?.trim() ?? "";
  const issuedAt = new Date();
  const document = buildPreprodDocument({
    issuerId,
    issuerName,
    activityCode,
    internalId: preprodInternalId(issuedAt),
    issuedAt,
  });
  const pin = await promptTokenPin();
  try {
    const result = await sendPreprodInvoice({
      connection: pkcs11TokenConnection(resolveEsealLibrary(), loadPkcs11Module()),
      pin,
      document,
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      signedAt: issuedAt,
      target,
    });
    const outcome = result.rejected
      ? `Rejected: ${result.rejectionReason}`
      : `Accepted UUID: ${result.acceptedUuid ?? "missing"}`;
    process.stderr.write(`Preprod response: HTTP ${result.httpStatus}\nSubmission ID: ${result.submissionId ?? "missing"}\n${outcome}\nCertificate fingerprint: ${result.certificateFingerprint}\n`);
  } finally {
    pin.replace(/./g, " ");
  }
}

async function main(): Promise<void> {
  if (process.argv.includes("--health")) {
    await health();
    return;
  }
  if (process.argv.includes("--submit")) {
    await submit();
    return;
  }
  throw new Error("ETA_PREPROD_COMMAND_REQUIRED");
}

if (process.argv[1]?.endsWith("eta-eseal-preprod.ts")) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "ETA_PREPROD_SEND_FAILED";
    process.stderr.write(`${message}\n`);
    process.exit(1);
  });
}
