# GRN Request Idempotency Design

Status: staged on `codex/grn-idempotency-20261102`; not merged, not deployed, and not applied to Neon or production.

## Scope

Protect POST `/api/v2/grn` from a receiving app retrying after the server committed the receipt but the response was lost. Existing requests without an `Idempotency-Key` remain backward-compatible and follow the existing route behavior. New HOVIN clients should send a stable random key (for example, one UUID per receipt) and reuse it for every retry of that receipt.

## Contract

- The route accepts the optional `Idempotency-Key` request header, 16–128 safe ASCII characters.
- Key scope is `tenantId + orderId + key`; different hotels or orders do not collide.
- A request hash covers the order, canonicalized line payload, and sorted evidence URLs.
- First successful request returns HTTP 201 with the GRN result and `idempotentReplay: false`.
- A retry with the same key and same payload returns the same GRN and recorded order status with HTTP 200 and `idempotentReplay: true`. It does not create another GRN, evidence record, audit entry, ledger event, or order update.
- Reusing the key with a different payload returns HTTP 409 `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST`.
- Failed validation or business gates do not reserve a key. The client may retry the same key when the original blocked condition is corrected.
- No request key is recorded for old clients that omit the header.

## Data and concurrency

Three nullable fields are added to `GoodsReceiptNote`: key, payload hash, and original order status. A composite unique index on tenant, order, and key is additive; pre-existing rows have NULL keys. The route serializes requests for the same tenant/order before looking up or creating a receipt, then checks for an existing key before the order's current receivable status. The database uniqueness constraint remains a final race guard.

## Required verification before merge

1. Validate and generate Prisma client against the branch schema.
2. Apply the migration only to a disposable isolated database; confirm existing receipt rows and schema remain intact.
3. Run the focused lifecycle test: first request creates one receipt, same-key/same-payload retry returns the same receipt, same-key/different-payload retry returns 409, and no duplicate evidence/audit/ledger writes occur.
4. Run current CI, typecheck, lint, build, security, and browser acceptance on the exact branch SHA. The base PR #46 currently has an unrelated invoice lifecycle failure (expected 201, received 409) that must remain visible and must not be attributed to this work.
5. Agree the HOVIN photo upload and PO-picker contracts separately. This change accepts only already-uploaded HTTPS evidence URLs and does not add an upload endpoint or safe receiving-only PO list.

## Recovery and rollout

The migration is additive and nullable. Rehearse it against an isolated restored backup before any production action. Production migration and deployment remain subject to the protected workflow and explicit approval. No production change was made for this feature branch.

Before any client sends idempotency keys, an unmerged/unapplied branch can be discarded safely. After keys have been persisted in production, do not drop the columns or unique index as a rollback: doing so would re-enable duplicate receipts on retries. Prefer a forward fix; if rollback is unavoidable, first take and verify a restorable backup and preserve request-key records.
