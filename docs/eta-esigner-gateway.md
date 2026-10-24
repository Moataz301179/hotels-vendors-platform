# ETA local eSeal signing gateway

The ETA eSeal private key stays on the registered USB token. The HotelsVendors
web application and production VPS must never receive a PIN, private key,
certificate export with key material, or direct USB access.

`npm run eta:signer-gateway` starts a local service bound only to
`127.0.0.1:4319`. It is intentionally not reachable from the network. It will
not sign anything until an approved local eSeal provider wrapper is configured.

## Required local configuration

Set these values only in the dedicated signing machine's local secret store:

- `ETA_SIGNER_GATEWAY_SHARED_SECRET`: random secret shared with the future
  outbound signing-job relay.
- `ETA_ESEAL_PROVIDER_COMMAND`: absolute path to the approved provider wrapper.
- `ETA_SIGNER_GATEWAY_PORT`: optional local port; defaults to `4319`.

The provider wrapper must receive one signing JSON request through stdin and
write exactly one JSON response to stdout. It is responsible for using the
official token middleware/PKCS#11 module and local secure PIN prompt. The
gateway enforces document-digest matching, a 60-second HMAC request window,
one-time nonces, bounded input/output, no shell execution, and a loopback bind.

## Provider acceptance gate

Do not configure or run a provider wrapper until all of these are true:

1. The official ePass2003 middleware exposes the inserted token and its signing
   certificate locally; public certificate chain validation alone is insufficient.
2. The provider package is acquired from the approved issuer, its installer and
   PKCS#11 library path are recorded outside this repository, and its version is
   verified before use.
3. A controlled preproduction document is signed with the token and verified
   against the public leaf certificate, without persisting the PIN or private key.
4. The outbound relay design is separately approved. Do not expose this loopback
   gateway directly to the Internet or open a router/Nginx port for it.

Until those gates pass, `/health` reports unavailable and every signing attempt
fails closed. This gateway is local signing infrastructure, not proof of ETA
credential registration, document acceptance, or production release.
