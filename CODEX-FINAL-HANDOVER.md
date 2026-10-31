# HotelsVendors production handover — 2026-10-17

## B47/B48 release-safety reconciliation — 2026-10-31

- **Visible homepage scope:** `components/marketing/hero-carousel.tsx` adds an accessible, reduced-motion-aware four-slide sourcing carousel to the canonical marketing homepage. It reuses the existing approved Restaurants & Bars, Housekeeping, Engineering and HOVIN imagery and the existing SVG brand mark; no generated or externally copied image was added. It is a product-navigation surface, not a supplier/stock/price claim.
- **Changed scope:** the proposed hotel e-invoice import now persists only an allow-listed `payloadSummary` (SHA-256 digest, document count, optional period bounds), never a raw invoice/PII payload. Hotel connectors are created as `PENDING`; a configuration-only probe cannot claim a live PMS/ERP connection, and the update API cannot promote a connector to `ACTIVE`. Connected supplier-price comparison fails closed unless the Supplier has a current `GRANTED` price-feed consent. The migration now creates every new enum/table and every additive existing-table column represented in `prisma/schema.prisma`, including `HotelConnector` and consent fields, with safe defaults for existing rows.
- **Verification:** focused B47/B48/ETA tests pass (7 files, 27 tests); `DATABASE_URL=postgresql://validation:validation@127.0.0.1:5432/validation npx prisma validate` and `git diff --check` pass. The local production build ran through TurboPack, TypeScript, static checks, static generation, and standalone-output phases according to `.next/trace-build`, but the command's final status was not captured and no `.next/standalone` directory was present afterwards. Do not treat it as a passing build; rerun it in a clean, reconciled checkout and retain the final output before release.
- **Remaining release blockers:** this checkout is four commits behind `origin/main` and has concurrent uncommitted Hermes/Codex work. No migration was applied, no connector was activated, no raw hotel data was ingested, no supplier feed was connected, and no deploy, push, merge, or workflow dispatch occurred. Reconcile only the reviewed patch onto `main`, run the isolated PostgreSQL migration rehearsal plus full CI/build/package gates, then separately satisfy authenticated role, ETA preproduction/eSeal, external-partner, HOVIN signed-device, and visual-acceptance gates before a governed release.

## ETA explicit-enablement gate — 2026-10-31

- **Changed scope:** `lib/eta/client.ts` and the legacy `lib/eta/adapter.ts` now reject every document submission with `ETA_SUBMISSION_DISABLED` unless the server-only `ETA_SUBMISSION_ENABLED` flag is exactly `true`; this happens before token acquisition or any ETA network call. When enabled, the existing verified-eSeal gate still rejects until an approved bridge exists. `.github/workflows/deploy-production.yml` now carries the flag only as a protected environment variable, validates it as `true`/`false`, defaults an omitted value to `false`, and refuses a true production setting unless all ETA runtime inputs are present. No private key is accepted or forwarded.
- **Test-first evidence:** the new disabled-submission tests were run red against the prior behaviour, then green after implementation. The full focused ETA suite passes (13 files, 32 tests); `npx tsc --noEmit` and `git diff --check` pass. The existing Vite configuration warning remains non-failing.
- **Release posture:** no deployment, workflow dispatch, credential creation, taxpayer registration, eSeal use, database migration, or document submission occurred. The flag must remain false until all preproduction acceptance inputs in the ETA/eDariba workflow review are verified.

## ETA/eDariba workflow review — 2026-10-31

- **Owner-provided reference reviewed:** the eDariba video `PGRIb5_66xk` demonstrates the manual operator sequence—create a document, enter invoice/company data, select the relevant document option, then sign and submit. It is an onboarding/UI reference only. It is not authority to automate browser clicks, use eDariba credentials, or submit a live taxpayer document.
- **Verified source state:** `lib/eta/client.ts` has token acquisition and an otherwise fail-closed submission entrypoint; `lib/eta/queue.ts` has a queue/DLQ/callback-oriented lifecycle; `app/notifications/documents/route.ts` validates an ETA API-key callback and replay delivery IDs; `docs/eta-esigner-gateway.md` specifies a loopback-only local token bridge. The actual `submitInvoice` path always throws `ETA_HARDWARE_SIGNING_NOT_CONFIGURED`; no approved eSeal bridge, preproduction credential acceptance, or live ETA submission is evidenced.
- **Required protocol:** issue only from an immutable authorized invoice after PO/GRN/variance gates; map validated invoice lines, parties, tax/category and document codes to ETA's current supported schema; canonicalize and sign through the registered taxpayer's local eSeal bridge; submit a signed batch through ETA's authenticated API with a persisted idempotency key; record only ETA response IDs/status as provisional; reconcile by official callback and submission polling; support ETA cancellation/rejection/credit/debit-note lifecycles; route transient errors to bounded retry and manual-resolution DLQ; keep submitted payloads, signature metadata, callback events and audit trail immutable/tenant-scoped.
- **Blocking acceptance inputs:** taxpayer digital profile/system registration, API client credentials, registered eSeal and approved local middleware/PKCS#11 bridge, ETA preproduction root trust and test tenant, allowed public callback URL/API key, official code/type mapping sign-off, and an isolated test set. Until all pass, UI state must remain `pending external clearance` and no finance/payment state may depend on an ETA UUID alone.

## Grok-program reconciliation and coordinated Hermes task — 2026-10-31

- **Canonical execution rule:** the complete owner-provided Grok discussion was treated as backlog intent, then mapped through three read-only, non-overlapping audits in this checkout. No branch, worktree, commit, push, database change, external message, workflow dispatch, or deployment was made. The dirty checkout and all pre-existing untracked files were preserved; `git diff --check` passes.
- **Verified implementation gap:** B46–B50 are not completed by the deployed PR #38 release. Existing sealed-RFQ, routing, GRN-variance, and external-funder fail-closed controls are useful foundations, but live-reachable legacy bidding/financing wording and fee code conflict with the required “no HV tender bid / no finance spread” policy. B47/B48 currently have only file-backed ingestion/evidence primitives; there is no tenant-isolated production import model, API, consent record, source connector, or comparable-price result. B49 has no reliable claim-policy test, and B50 has no controlled role-based end-to-end demo harness.
- **Hermes batch harness:** Hermes is constrained to `/Users/Moatazi/hotels-vendors-new` and one read-only batch rather than ad hoc tasks: (M1) establish current checkout/main/live-release identity and stop on any mismatch; (M2) map B46/B47/B48/B49/B50 exact source, schema, API and test surfaces; (M3) identify external consent, partner, ETA, identity, device and data-retention gates; (M4) produce only source-scoped implementation units with their verification commands. It must stop and immediately surface a red flag for a wrong workspace, dirty-file collision, missing provenance/consent, security/privacy exposure, migration/data-loss risk, release-identity mismatch, or any command that would write, push, merge, deploy, alter a database, secret, workflow or production. No milestone is complete until it reports paths, observed commands/output, verification status, and open blockers. Do not treat Hermes output as release proof; reconcile it against this checkout before implementation.
- **Source-scoped next sequence:** (1) add and enforce one policy that quarantines/removes legacy bidding/financing claims and entrypoints; (2) establish tenant-isolated, consented hotel AP/e-invoice ingestion with immutable evidence metadata; (3) implement a conservative comparable-price evidence model, returning insufficient/not-comparable rather than a saving without matching evidence; (4) add an approved public-claims registry with render/forbidden-claim tests; (5) build a non-production, isolated five-role E2E demo harness; (6) complete authenticated role, ETA, external-funder, mobile/device, and screenshot acceptance gates before any further production release.

## Read-only dashboard and Hermes reconciliation — 2026-10-31

- **Authoritative local source:** the official checkout is presently on `codex/vps-migration-recovery-expanded` at `bcdfe37e1f56a14d8e936d982c2d20daedc10025`, ahead of `origin/main` (`08fed86c…`) and one commit behind its tracked remote branch. Pre-existing untracked Clerk skill files and `skills-lock.json` were preserved. No source, Git, database, workflow, VPS, or deployment mutation was made during this check.
- **Current live evidence:** a fresh read-only `GET https://www.hotelsvendors.com/api/health` returned `ok: true`, `database: ready`, `authorization: configured`, and matching `releaseId`/`sourceCommit` `github-03584cd01b4620b98d0747f1c3657842c87dfcc9`.
- **GitHub PR state:** PR #40 is merged and its build succeeded. PR #38 is open, clean, and its latest build succeeded on head `d73a0bf…`; it has not merged to `main`. PR #41 is open, clean, and green. These observations supersede the pasted dashboard's earlier failed-PR/#40-ready claims, but they do not authorize a merge or deployment.
- **Hermes scope result:** the visible Hermes desktop session is an Oct 24 historical audit connected to `/Users/Moatazi/hotels-vendors/hotels-vendors` (not this official checkout) and reports an older branch/commit. It is not evidence of current HotelsVendors release, VPS, or product progress. The Hermes gateway/bot UI itself is available; no Hermes task was sent or modified.
- **Hermes activity follow-up:** a later live Hermes session was observed editing the legacy repository rooted at `/Users/Moatazi`, remote `Moataz301179/hotels-vendors.git`, branch `paymob-revenue-integration-20261003` at `aec0783b…`; it is not this repository or the `hotels-vendors-platform` remote. It added an `HV_RELEASE_SMOKE` database-skipping health response and `output: 'standalone'` there while attempting a local/Neon build path. Do not promote, merge, deploy, or copy this legacy work into the official checkout without a separately scoped review. Its request to use `prisma db push` is not an authorized production migration path.
- **Verified hv-bridge state:** `~/.hv-bridge/hv-bridge.sh` is loaded as `com.hotelsvendors.hv-bridge`, currently idle, watching `Moataz301179/hotels-vendors-platform#39`, and points at this workspace. It creates isolated `codex/bus-<id>` worktrees from `origin/main`, invokes Codex with network enabled, then can automatically commit, push and open a draft PR; it does not dispatch Hermes. As of the read-only check, the bus had processed only `neon-rotate-001`, `neon-rotate-002`, and `neon-backup-001`, each reporting `no-changes`. Individual bus instructions must therefore be explicit, source-scoped, and separately authorized; a dashboard or prior Grok plan is not an executable backlog.
- **Release-control audit:** GitHub currently reports `main` as unprotected and the `production` environment has no protection rules or deployment-branch policy. The deployed workflow is manual (`workflow_dispatch`) and requires `APPLY_AFTER_NEON_BACKUP`; it cannot be called an auto-deploy pipeline. PR #38 is open, clean and green; PR #41 is open and green. The local candidate deployment workflow has safer host-key pinning and verified TLS probes than the current remote `main` workflow, so no automatic promotion should be enabled before the reconciled workflow is reviewed and merged. Fresh public health remains `03584cd…`, with `database: ready` and `authorization: configured`; this is availability/provenance evidence, not authenticated procurement, ETA, mobile, or funder acceptance.
- **Deploy-gate clone reconciliation:** `/Users/Moatazi/hv-deploy-gate` is a separate clean clone on `chore/deploy-main-only` at `de50254…`, represented by open, green PR #42. Its only source change is a deployment-workflow gate that permits the deployment job only from `main` after a successful `build` check. It contains Hermes/release-gate documentation, but no executable Codex, Hermes, Grok, or `hv-bridge` dispatcher; it is a candidate CI-control change, not the command terminal or an end-to-end automation bridge.
- **Historical terminal evidence reconciliation:** owner-supplied Oct 31 terminal logs show a production Neon connection-password rotation on the VPS followed by a PM2 restart and a successful health response at source `03584cd…`; they also show the matching GitHub Actions secret being updated and SSH key access being configured. A fresh read-only health check still reports that source with `database: ready`. The logs are historical evidence, not authorization to repeat their secret/VPS/bridge-mutation commands; they contain no basis to trust the dashboard's speculative backlog or “need Alex” queue as product truth.
- **Governed PR #38 production release — 2026-10-31:** owner-authorized merge of clean, green PR #38 produced `main` merge commit `bd5993b9fe9fd8f646376e27a9c00c93794fe547`. Its post-merge CI run [41163030877](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/41163030877) passed dependency, isolated-schema, unit, integration, financial-control lint, build, packaging, and packaged-smoke gates. Governed deployment [41163286708](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/41163286708) then passed production migration/status/schema verification, SSH, upload, preflight, activation, rollback-capable live checks, CSP/Nginx checks, and release-identity verification. Independent post-run health returned matching `releaseId` and `sourceCommit` `github-bd5993b9fe9fd8f646376e27a9c00c93794fe547`, `database: ready`, and `authorization: configured`. This proves the deployed release identity and health only; authenticated role journeys, provider callbacks, native/mobile, ETA middleware acceptance, and external-funder acceptance remain separate open gates.
- **Architecture-program numbering check:** as of the read-only GitHub check, PRs #46, #47, #48, #49, and #50 do not exist in `Moataz301179/hotels-vendors-platform`; the newest PR is #42. No remote branches matching those proposed release numbers exist either. Treat any “PR 47–50” architecture plan as an unimplemented backlog until it is decomposed into source-scoped pull requests with acceptance gates; it cannot be assumed to have been deployed with PR #38.
- **Remaining acceptance gates:** current health and CI do not establish real OAuth callback/organization-role acceptance, an authenticated procurement journey, HOVIN device release, ETA preproduction signing acceptance, or an external-funder integration. Keep those gates explicit.

## Clerk strict-CSP and OAuth-completion repair — 2026-10-30 (release candidate)

- **Verified defect:** A production HTML audit showed that the Clerk bootstrap script had no nonce while the response used `script-src 'nonce-…' 'strict-dynamic'`; browsers consequently block the bootstrap in a fresh session. The previous `connection()`-only change did not cause Clerk to render its nonce-aware server script.
- **Changed scope:** Root `ClerkProvider` now uses its supported `dynamic` mode so it consumes the nonce forwarded by `proxy.ts`. The proxy now invokes Clerk middleware for every matched request before public/protected route decisions, which gives `/auth/continue` the Clerk request context required by its server-side actor resolution. The strict CSP remains in place; no `unsafe-inline` or `unsafe-eval` directive, migration, schema change, database write, or new authentication provider was added.
- **Verification:** `npx vitest run tests/p0/production-shell-contract.spec.ts tests/p0/clerk-auth-routing.spec.ts` passed (2 files, 11 tests); `npx tsc --noEmit`, `git diff --check`, and `SESSION_SECRET=<ephemeral> npm run build` passed. The release still requires post-activation HTML/console verification that the Clerk bootstrap nonce equals the response CSP nonce and that the Clerk control renders.
- **Deployment-path correction:** Initial governed run [41042779455](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/41042779455) passed all CI, schema, upload, and read-only production-schema gates but its SSH activation session idled out before a health response. `/api/health` is now explicitly exempt from Clerk middleware while retaining the response CSP; it is a non-authenticated liveness endpoint and cannot require a Clerk session. Interactive login, role signup, and `/auth/continue` remain inside the Clerk wrapper.
- **Public-route scope correction:** Retry [41043815508](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/41043815508) reached the candidate read-only schema check but timed out while requesting the public root during CSP preflight. The final candidate keeps Clerk middleware on login, Clerk's raw sign-in/up routes, both role signups, `/auth/continue`, optional authenticated assistant context, and protected routes; ordinary public marketing and liveness routes remain CSP-protected but do not depend on Clerk service availability.
- **Successful governed release:** [run 41044296510](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/41044296510) deployed commit `03584cd01b4620b98d0747f1c3657842c87dfcc9`; live health returned the same source/release ID with `database: ready` and `authorization: configured`. In the same HTTP response, the CSP nonce matched the Clerk bootstrap nonce on `/login`, `/hotels/signup`, and `/suppliers/signup`. A fresh browser load rendered Google and Apple controls on login and both provider controls on Hotel signup. This verifies shell loading, not a real provider callback or organization-role authorization journey.
- **External provider gate:** The Clerk dashboard instance supplied during investigation is Development/test mode and cannot establish production OAuth configuration. It has Google using shared credentials and no Apple connection. Live HTML uses a distinct `pk_live_`/`clerk.hotelsvendors.com` instance. Before claiming Google/Apple production acceptance, open that actual live instance, configure the existing production Google/Apple credentials and callback/origin allowlists, then complete controlled real-provider callback tests. Do not create or substitute credentials without the owner.

## Governed production release — 2026-10-30 (deployed)

- **Release candidate:** commit `20e1ec2c75d39d4ce04085cb88f3c24ffce2cf5d` on `codex/vps-migration-recovery-expanded` was committed and pushed after local full test/build verification.
- **Initial blocked run:** [run 40987722201](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/40987722201) passed every source/database gate but stopped at SSH configuration before contacting the VPS because `VPS_SSH_HOST_KEY` was absent. The existing verified host pin from this Mac was placed in the GitHub Production environment; no runtime `ssh-keyscan` was used.
- **Successful release:** [run 40988309957](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/40988309957) passed dependency installation, Prisma client generation, isolated schema verification, all unit and integration tests, financial-control lint, production build, release packaging, production `prisma migrate deploy`/status/schema verification, SSH pin verification, VPS upload, protected runtime upload, activation, and its release-identity health gate.
- **Independent live verification:** `https://www.hotelsvendors.com/api/health` returned `ok: true`, `database: ready`, `authorization: configured`, `sourceCommit: e122a4e734df84af81d5b762675d3d79a0d6fb6e`, and matching `releaseId: github-e122a4e734df84af81d5b762675d3d79a0d6fb6e` after activation.

## Grok branch reconciliation — 2026-10-30 (local candidate; not deployed)

- **Verified source:** local checkout `codex/vps-migration-recovery-expanded` at `9c0459b64598e4b597b37cbc18257b60fe76bf93`, with pre-existing owner work preserved. The independently pushed `origin/codex/pillar-visibility` branch was inspected against the actual source; it was not merged wholesale because its orders client contains a malformed state declaration and the branch also carries unrelated drawdown and purchase-order mutation work.
- **Safely reconciled scope:** Hotel navigation now has distinct approval and receiving entries. Carrier and Funder navigation no longer points to hotel order operations; `/carrier/handoff` and `/funding/evidence` are role-guarded, read-only records pages. The administrator page displays the release/source commit returned by `/api/health` alongside the preserved candidate-review and requirement-matching controls. Existing order API behaviour keeps a supplier out of a Hotel response until an invoice exists; it was not weakened.
- **Receipt and funder safety:** The established receipt-variance gate remains authoritative: quantity differences are recorded and must be accepted by an authorized Hotel actor before a funding packet can clear. No local balance, drawdown approval, payment, payout, or new funder decision path was added. No `requirement_lines` or `invoice_claims` table was added.
- **Verification:** Test-first navigation and order-view contracts passed with existing portal-boundary and receipt-variance suites (4 files, 12 assertions). `npx tsc --noEmit` and `SESSION_SECRET=build-validation-only-not-a-runtime-secret NODE_ENV=production npm run build` passed. The existing Vite config-loader and Prisma configuration deprecation warnings remain non-failing.
- **Release status and next action:** No migration, `db push`, reset, deployment, production workflow dispatch, or live-app change occurred. Production remains untouched. Before considering a release, repair/review the upstream branch’s malformed orders client separately, run controlled Clerk-role browser acceptance, and use the governed release process only after explicit approval.

## Neon production migration reconciliation — 2026-10-29 (database-only; no app deploy)

- **Verified target:** Neon organization `Hotelsvendors-B2B`, project `HotelsVendors` (`wild-glade-15493181`), production branch `br-green-block-b5wfx1ft`. This is the authoritative project; two other signed-in Neon organizations were inspected read-only and are not migration targets.
- **Applied scope:** Production `prisma migrate status` identified exactly two pending local migrations: `20261028110000_add_rfq_request_idempotency` and `20261029131500_add_grn_variance_acceptance`. Both were rehearsed on production-derived branch `migration-repair-20261029` (`br-falling-truth-b5mgmn86`), then applied to production through a direct non-pooled Prisma connection. No preview-only `requirement_lines` or `invoice_claims` table was introduced.
- **Recovery and verification:** Fresh rollback branch `pre-production-migration-20261029` (`br-silent-sky-b5jp21s9`) was created from production before the write and expires on 2026-11-05. After application, Prisma reported production up to date; `neon diff` reported no schema difference between production and the rehearsal branch. The production ledger has no unresolved migration attempt. Historical rolled-back attempts for four migrations each have a completed retry.
- **Authorization anchors:** The production `User` and `Tenant` tables contain the Clerk email-to-user and tenant/role columns required by the current server-side authorization model. This is schema evidence, not an authenticated browser acceptance test.
- **Local verification and remaining risk:** Focused packet, receipt-variance, portal-boundary and anonymous-basket tests passed 21/21. The Vite config-loader warning and Prisma package-configuration deprecation remain non-failing maintenance work. No `deploy-production.yml`, PM2/Nginx change, app deployment, `db push`, reset, or production data restore occurred.

## External-funder packet and receipt-variance gate — 2026-10-29 (local candidate; not deployed)

- **Scope:** The public header now uses the requested `#2f2f2feb` 14px-blur curtain, `#95c4f5` join action and cobalt `#276aa9` hover state. About and Help are in the header; Carrier and Funder access remains in the footer. The existing anonymous catalogue basket remains a supplier-neutral requirement/RFQ flow with no payment or binding price.
- **Funding boundary:** `lib/funding/funder-controlled-packet.ts` defines the external-funder-only packet gate. A vendor and funder derive the same remaining amount from one external-funder pull; locally entered/sample balances, API keys and referral `CHV000` are not a payment right. Packets require an invoice file and ETA UUID, reject a previously funded ETA UUID, reject inactive/unpulled or frozen lines, block a pending external-funder reversal, and return the exact replenish amount for an over-limit draw. The public funder status endpoint reports `EXTERNAL_FUNDER_PULL_REQUIRED` while no provisioned adapter exists, rather than fabricating eligibility or a balance.
- **Receipt variance:** HOVIN/receiving records observed quantities; a Hotel OWNER, REGIONAL_GM, GM or FINANCIAL_CONTROLLER must explicitly accept any received-versus-accepted quantity difference through `POST /api/v2/grn/[grnId]/variance` before it can clear the funding packet gate. The additive migration `20261029131500_add_grn_variance_acceptance` records that acceptance and actor; it was rehearsed and applied to the verified Neon production branch on 2026-10-29 without an app deployment.
- **Verification:** Test-first red/green evidence was recorded for the new packet, variance and header contracts. Fresh verification passed: `DATABASE_URL=postgresql://… npx prisma validate`, `npx prisma generate`, `npx tsc --noEmit`, `SESSION_SECRET=build-validation-only-not-a-runtime-secret NODE_ENV=production npm run build`, and 9 focused P0 files / 50 tests. Vitest retained its pre-existing config-loader migration warning; Prisma retained its Prisma-7 configuration deprecation warning.
- **Unresolved production gates:** partial receipt, frozen-line and reversal rules are now explicit in the packet gate, but there is no live funder adapter/pull, ETA production request, or provider-backed invoice file store to execute them against. Do not deploy this candidate, dispatch `deploy-production.yml`, or claim a real credit line/disbursement.

## Directory anonymity, controlled matching, and retry-safe RFQs — 2026-10-28 (local candidate; not deployed)

- **Source revision and scope:** local branch `codex/vps-migration-recovery-expanded` at `7c7f8b09f83fdd13ea3ba12c70ca3cd51ffd62c7` contains uncommitted follow-up work. Public directory records now require reviewer-authored, source-free names, categories, descriptions, and technical specifications; public images, source text, commercial terms, and Vendor identity are withheld. Automatic open-license publication is fail-closed until a reviewer authors the public profile.
- **Role and disclosure controls:** Hotel-only guards cover buyer RFQ creation, marketplace access, comparison, and buyer product media. Requirement matching and its Vendor-aware product search are Admin-only. Matching is serialized, deduplicates a repeated Vendor assignment, and limits active Vendor grants to five.
- **RFQ retry safety:** `RfqRequest` now has an additive tenant/buyer/idempotency-key unique constraint in `prisma/migrations/20261028110000_add_rfq_request_idempotency/migration.sql`. `POST /api/v2/rfq` requires a bounded `X-Idempotency-Key`, returns the already-created RFQ on replay, and handles a uniqueness race without duplicating its audit/ledger effects. Requirement baskets persist opaque retry keys before submission and reset them when quantity changes; the in-workspace request list retains retry keys for a partial retry. Existing RFQs retain a null key and are unaffected.
- **Release and test controls:** the governed deployment workflow now requires the `VPS_SSH_HOST_KEY` secret to contain a host-key entry matching `VPS_HOST`; it no longer trusts a runtime `ssh-keyscan`. Public health and CSP probes require verified HTTPS/TLS rather than bypassing certificate validation. `npm run test:setup-db` now exists and accepts only an explicitly supplied local `HV_TEST_DATABASE_URL`, refusing remote and Neon hosts before a disposable Prisma schema projection.
- **Verification:** Prisma client generation, focused directory/RFQ/role/basket tests (8 files, 42 tests), `npx tsc --noEmit`, `git diff --check`, and `SESSION_SECRET=build-validation-only-not-a-runtime-secret NODE_ENV=production npm run build` passed. Vitest emitted its existing config-loader migration warning; Prisma emitted its existing Prisma-7 configuration deprecation warning. Database integration was not run because no explicitly disposable database URL was supplied.
- **Unresolved release gates:** this candidate is not committed, migrated, deployed, or production-verified. Before any deployment, take/verify the authoritative database backup/clone, apply the migration only through the governed release path, run the isolated database lifecycle suite including an RFQ replay assertion, and verify matching live release/source identifiers. External gates remain reviewed permitted Egyptian HoReCa catalogue data, controlled Clerk role-session acceptance, ETA preproduction credentials and approved signing bridge, HOVIN native/device acceptance, and mobile API contract ownership.

## Controlled multi-reference basket and catalogue-source boundary — 2026-10-26 (local candidate; not deployed)

- **Public catalogue to RFQ path extended:** a signed-in Hotel can now build a persistent requirement basket from multiple reviewed directory references, adjust each quantity, and submit each entry as its own sealed, supplier-neutral RFQ. The browser stores only opaque directory IDs and quantities; it rehydrates the published specifications after sign-in and preserves unsubmitted entries if a later RFQ fails. This is deliberately not a retail payment checkout and does not introduce stock, binding prices, Vendor identity, or a commercial assignment.
- **Sign-in context is preserved without duplication:** public catalogue selection saves the opaque reference before Clerk opens its modal, and the basket return URL acts only as a fallback. A direct basket link still works, but the normal sign-in return cannot double an existing item.
- **Catalogue provenance boundary corrected:** `GET /api/v2/directory` and `POST /api/v2/rfq` now use `publicMarketplaceDirectoryProfileWhere`, requiring a published profile backed by an approved candidate and a permitted allowed HoReCa source. The public marketplace no longer renders catalogue attribution/source URLs. These checks close a mismatch between the marketplace listing page and the directory/RFQ API paths; they do not create or publish additional catalogue records.
- **Role workspace routing made more specific:** `/dashboard` now uses the existing organization-role workspace definitions where available. A receiving clerk sees receiving tasks; a financial controller sees approval/reconciliation tasks. The Hotel, Vendor, Carrier, Funder, and Administrator boundaries remain unchanged.
- **Verification:** `npx vitest run tests/p0/catalog-reference-basket.spec.ts tests/p0/request-list.spec.ts tests/p0/pre-spend-routes.spec.ts tests/p0/directory-catalog-route.spec.ts tests/p0/marketplace-catalog-anonymity.spec.ts tests/p0/catalog-publication-review.spec.ts` passed (6 files, 32 tests); `npx tsc --noEmit` passed; `SESSION_SECRET=build-validation-only-not-a-runtime-secret NODE_ENV=production npm run build` passed. Vitest emitted its pre-existing config-loader migration warning; it did not fail the run.
- **Still not production proof:** no production data mutation, deploy, PM2/Nginx change, controlled Clerk role session, mobile release, or ETA request occurred. The next independent gates remain: permitted, reviewed Egyptian HoReCa reference records; controlled role-session/browser acceptance; a designated HOVIN native release path; and externally provisioned ETA preproduction signing/credential acceptance.

## ETA registration and supplier-neutral catalogue classification — 2026-10-24 (local candidate; not deployed)

- **ETA preproduction registration is now correctly shaped.** The official identity request now uses the documented OAuth client-credentials body plus HTTP Basic authentication; `PUT /ping` is implemented as the official authenticated ETA callback-registration probe and returns only the configured RIN on an exact authenticated match. `ETA_REGISTRATION_NUMBER` is a deployment secret alongside the callback key. No secret value is present in source or this handover.
- **Unsafe onboarding pseudo-verification is disabled.** The former worker attempted undocumented ETA tax-ID/KYC calls. ETA e-Invoicing is an invoice/receipt integration API, not an authorized onboarding-KYC provider, so it now fails closed instead of creating a misleading verification result. A separately authorized KYC provider and its data-processing controls are required before restoring that workflow.
- **Placeholder signing is removed.** `lib/eta/signer.ts` now refuses to generate, parse, or verify fake eSeal artifacts. It accepts only an explicitly supplied controlled test key; certificate-only signing fails closed until the registered USB eSeal provider bridge is verified. This prevents an invoice from being accidentally treated as signed before real hardware integration.
- **Catalogue classification can progress without a named Vendor feed.** A 10,000-reference, eight-family / 71-subcategory supplier-neutral HoReCa taxonomy is recorded in `data/staging/hospitality-procurement-subtaxonomy.v1.json`; its targets are capacity planning only, never inventory, availability, price, or offers. The validator confirms that category and subcategory targets reconcile to 10,000. It does not create 10,000 product records or bypass the existing technical-specification, rights, duplicate, code, and publication-review gates.
- **Local verification:** `npx tsx scripts/catalog/validate-subtaxonomy.ts`, seven focused ETA/catalogue suites (16 assertions), and `SESSION_SECRET=build-validation-only-not-a-runtime-secret NODE_ENV=production npm run build` passed. Build includes `/ping` and `/notifications/documents`. This candidate is not deployed.
- **Unsigned ETA submission bypass closed on 2026-10-25 (local candidate; not deployed):** ETA requires an issuer CAdES-BES signature embedded in every invoice document. Both the queue client and the separately exported legacy adapter now stop before acquiring an ETA access token or opening a network connection until an approved bridge can create and embed that signature. A regression suite proves each entry point makes zero `fetch` calls for an unsigned invoice; the focused ETA suite passed 18/18 and the Next production build passed. This is a safety stop, not a live ETA configuration or deployment. The exact next implementation is a separately approved packaged bridge that returns a canonical CAdES-BES-signed document, not merely a raw RSA signature.
- **ETA credential concurrency gate closed on 2026-10-25 (local candidate; not deployed):** concurrent authenticated ETA reads now share one in-flight OAuth client-credentials request and discard it on both success and failure, so a retry can obtain a fresh token rather than retaining a failed promise. Regression evidence: `tests/p0/eta-token-cache.spec.ts` proves concurrent reads use one identity request and a rejected token request is retried; the focused ETA suite passed 20/20 and `SESSION_SECRET=build-validation-only-not-a-runtime-secret NODE_ENV=production npm run build` passed. This is transport hardening only: no credential, ETA endpoint, callback registration, or production deployment was used.
- **ETA canonicalization gate corrected on 2026-10-25 (local candidate; not deployed):** the former alphabetic key/value projection was not ETA's signing serialization and could not safely feed a production signature. `lib/eta/canonicalizer.ts` now preserves submitted field order, uppercases field names, repeats array names as ETA specifies, hashes the resulting UTF-8 canonical string, and refuses an already-signed document. Regression evidence: `tests/p0/eta-canonicalizer.spec.ts` plus the focused ETA suite passed 22/22; the Next production build passed. The helper still neither signs nor submits a document; its only purpose is to prepare controlled input for the future approved CAdES-BES bridge.
- **Exact next owner inputs:** add ETA *preproduction* client/identity/API/callback/RIN secrets in the production Actions environment plus `ETA_ENVIRONMENT=preprod`; register `https://www.hotelsvendors.com` as the protected public callback base. Local hardware signing is verified only in the isolated compatibility evaluation; a supported packaged provider bridge and deployment approval are still required before the ETA registration probe and preproduction signed-document acceptance test. No production eSeal signing claim is made.
- **eSeal local visibility rechecked on 2026-10-25:** macOS now detects the physical `FT ePass2003Auto` reader and card ATR; ePass Manager is running. The operating system still exposes no token certificate/identity (`security find-identity` returns zero) and no PKCS#11 provider library is installed for the application. This proves reader presence only—not certificate unlock, signing capability, or ETA readiness. The token holder must unlock the certificate in ePass Manager without sharing the PIN; then the provider/library path and certificate metadata can be verified before a signing bridge is implemented.
- **eSeal certificate chain inspected locally on 2026-10-25:** owner-provided public certificates cryptographically verify leaf → MCDR CA 2025 → Egypt Root CA G1. The leaf is currently within its validity window and has digital-signature/non-repudiation key usage. No certificate values, subject identifiers, private material, or PIN were copied into the repository. This validates the public chain only; the private key is still inaccessible from macOS and from the production VPS until a supported local token-provider bridge is configured.
- **Dedicated local signing gateway added (local candidate; not deployed):** `npm run eta:signer-gateway` binds to `127.0.0.1` only, accepts one-time HMAC-authenticated signing jobs with exact document digests, and invokes only an explicitly configured absolute-path provider wrapper without a shell. It refuses requests until a provider exists; it does not accept or store a PIN/private key and does not open a public port. Contract tests passed (16 ETA/catalouge tests total) and the Next production build passed. The remaining gate is the official ePass2003 PKCS#11 provider plus a controlled preproduction signature verification; the outbound relay must be separately approved before the VPS can request signatures.
- **eSeal provider diagnosis on 2026-10-25 (read-only):** OpenSC detects the physical `FT ePass2003Auto` reader but reports the inserted token as unrecognized, so no PKCS#11 object, mechanism, PIN, or signature operation was attempted. The installed 2021 ePass package explains the mismatch: its legacy token plug-in does not install on current macOS, and its newer token extension is an x86-only ad-hoc-signed bundle while the legacy plug-in is unsigned. Those components must not be force-copied or used for a production signing path. The safe dependency is a current FEITIAN-signed Apple-silicon/universal PKCS#11 provider (or ETA-approved current equivalent) that recognizes this token. Once present, run a local public-object/mechanism probe, let the owner unlock in the vendor UI without sharing the PIN, perform one controlled preproduction signature verification, and only then configure the loopback signer gateway. The gateway and production VPS remain unchanged.
- **eSeal compatibility follow-up on 2026-10-25 (local evaluation; not deployed):** An isolated build of the pending OpenSC ePass2003 MSCP-emulation compatibility patch recognized the token as a read-only PKCS#15-emulated device and enumerated its public object containers. The owner then completed an interactive PIN login, and a harmless local `SHA256-RSA-PKCS` probe signed with the token verified against exactly one supplied public certificate. This proves the local hardware-key and public-certificate pairing; it is not an ETA or production signing claim. A generic `pkcs11-tool --test` remains unsuitable with this emulator, and certificate-object reads by its exposed MSCP-style identifiers remain unreliable. No business document, invoice, ETA request, token object write, production configuration, or provider installation occurred. The temporary compatibility build must not be put into the release path. The remaining prerequisite is a current, signed Apple-silicon/universal FEITIAN/ETA-approved PKCS#11 middleware package or a separately approved packaged provider bridge, followed by a controlled ETA preproduction acceptance sequence.
- **Official macOS middleware source checked on 2026-10-25 (read-only):** MCDR's official electronic-signature files page was retrieved directly. Its `EPass Setup for MAC` archive contains only `ePass2003-Castle-mac-20210127.dmg`; its `New EPass Setup 2024` archive contains only a Windows `.exe`. Neither is a current signed Apple-silicon/universal PKCS#11 provider, so neither was installed or placed in the signing path. Obtain the current macOS package directly from the accredited certificate issuer/FEITIAN, or approve a separately packaged provider bridge, before any ETA signing bridge configuration.
- **Prior-work reconciliation on 2026-10-25 (read-only):** the accessible `hotels-vendors` legacy checkout, preserved platform copies, current canonical checkout, current process, repository Actions secrets, and the `production` Actions environment were checked by source/secret *name presence only*. No ETA credential, callback credential, PKCS#12 bundle, or current ePass signing provider was found. The legacy `node-forge` addition only loaded an environment PKCS#12 private key and emitted a detached RSA signature; it did not use the registered USB eSeal, generate CAdES-BES, or prove an ETA submission. Its own ETA integration document says digital signing was still a TODO, and its audit identifies fake signature/acceptance behavior. Do not restore or deploy that implementation. The verified reusable work is limited to local token login and a harmless hardware RSA probe; the official preproduction submission gate has not previously been completed in the accessible evidence.

## ETA fail-closed correction and HOVIN compatibility finding — 2026-10-24 (local candidate; not deployed)

- **ETA onboarding can no longer self-certify.** `lib/workers/eta-verification.worker.ts` no longer treats missing configuration as `MOCK_VERIFIED`. It now rejects a run unless both `ETA_API_URL` and `ETA_API_KEY` are configured, only accepts an explicit upstream `verified: true` response, and no longer writes tax ID or commercial-registration values to worker logs or audit changes. Regression evidence: `npx vitest run tests/p0/eta-verification-configuration.spec.ts` passed 3/3; `SESSION_SECRET=build-validation-only-not-a-runtime-secret NODE_ENV=production npm run build` passed.
- **ETA endpoint separation is now explicit.** `ETAAdapter` and the queue client distinguish `ETA_IDENTITY_URL` (token acquisition) from `ETA_API_URL` (invoicing requests). Token acquisition uses OAuth client credentials form encoding and fails before a network call if either host or either credential is absent. Regression evidence: the two ETA configuration suites passed 5/5 and the production build passed after the change. This fixes a local transport assumption; it does not implement eSeal signing or authorize an external ETA request.
- **Official ETA notification receiver is implemented locally.** `PUT /notifications/documents` now requires the ETA-registered `Authorization: ApiKey <pre-shared key>` header, validates the documented `deliveryId`/`document` batch shape, processes only recognized document-status notifications, uses `deliveryId` replay protection, and returns a retryable 500 if processing cannot complete. `ETA_CALLBACK_API_KEY` is forwarded only when present in the GitHub Actions production secret store. Regression evidence: ETA configuration/callback tests passed 9/9 and the production build includes `/notifications/documents`. It is not deployed or registered with ETA yet.
- **ETA deployment secrets are wired but intentionally absent.** The governed workflow now forwards `ETA_API_URL`, `ETA_IDENTITY_URL`, `ETA_CLIENT_ID`, `ETA_CLIENT_SECRET`, and `ETA_CALLBACK_API_KEY` only when each exists in GitHub Actions Secrets. The repository currently contains none of those secret names; no ETA secret has been printed, copied, or inferred. Workflow regression evidence: ETA callback and deployment-secret checks plus deployment-topology checks passed 14/14. The token hardware was not detected as inserted on the local Mac; ePass Manager is installed.
- **ETA preproduction is an explicit supported stage.** The workflow accepts only the non-secret Actions variable `ETA_ENVIRONMENT=preprod` or `ETA_ENVIRONMENT=production`; the client otherwise stays unconfigured/fail-closed. ETA configuration, callback, and deployment-secret tests passed 10/10; the production build passed. Use preproduction endpoints/credentials and the preproduction root trust only for the controlled acceptance run, then replace them with separately issued production values after ETA acceptance.
- **This is a safety correction, not an ETA production claim.** The source still lacks verified official callback, certificate/hardware-signature and sandbox/production acceptance evidence. Do not put ETA credentials in source code, chat, test fixtures, or this handover. The owner must provide officially issued access through the deployment secret store and the ETA callback/authentication specification before official submission can be enabled and accepted.
- **HOVIN internal APK is finished but not release-ready.** EAS build [`8b7f6de8-1901-4d69-9759-86daa71f8c26`](https://expo.dev/accounts/hotelsvendors.com/projects/hovin/builds/8b7f6de8-1901-4d69-9759-86daa71f8c26) completed as internal Android distribution from the dedicated HOVIN project. It still needs a controlled physical-device session and native API contract remediation before any public/mobile production claim. No Android device bridge is present on the current machine.
- **Material mobile contract defect found.** The mobile client defaults most operational calls to `/api/v1`, but this canonical web source has no `/api/v1` route tree and its supported operational surface is `/api/v2`. The existing v2 Clerk token is only used for inventory counts. The application must be migrated screen-by-screen to the authenticated v2 contracts (or a deliberately versioned supported mobile API must be restored), and unsupported Oliv/48-hour payout claims must remain disabled unless partner authorization is evidenced. Do not change every URL mechanically: payloads, role authorization and response schemas require contract tests.
- **Catalogue approach corrected.** The staging validator now permits `INTERNALLY_AUTHORED` supplier-neutral HoReCa specifications with `HV_INTERNAL` controlled identifiers and no borrowed media. This enables a real operating-reference catalogue and RFQ discovery without asserting a named Vendor, stock, price or offer. Public-source observations remain `PUBLIC_DISCOVERY_ONLY` until their source policy is cleared; they cannot be used to bypass provenance. The readiness report now separates `referenceCatalogReady` from `offerCatalogReady`—a Vendor register is not a prerequisite for the first, but remains required for commercial fulfilment. Regression evidence: reference-policy, buyer-anonymity and RFQ pre-spend tests passed 16/16. The current dataset is still only 94 source records with 0 provenance-tagged records, so both readiness gates truthfully remain false.
- **Current live provenance remains separate:** `https://www.hotelsvendors.com/api/health` returned `github-08fed86ca8cf4ea1d093961dfea1df7f2f1bc176`, database `ready`, authorization `configured`. This local safety candidate is not deployed.

## Controlled acceptance and HOVIN release-candidate start — 2026-10-24

- **Fresh isolated database acceptance branch:** production-derived Neon branch `mvp-acceptance-20261024` (`br-crimson-boat-b5i3xi2x`) was created with expiry `2026-10-31T23:59:00Z`. Before creating it, the exact unprotected, zero-written-byte temporary branch `catalog-remediation-20261022` (`br-rapid-waterfall-b5jvg16m`, expiring the same day) was deleted to free the provider branch limit. Production (`br-green-block-b5wfx1ft`) was not modified.
- **Database lifecycle evidence:** `HV_RUN_DB_INTEGRATION=1 HV_INTEGRATION_ALLOW_REMOTE=1 DATABASE_URL=<isolated branch> npm run test:integration` passed 1 file / 6 tests in 91.95 seconds. The command was explicitly pointed at the disposable branch, not production. This validates the integration fixture lifecycle only; it is not a browser/Clerk role-session acceptance result and does not validate real ETA credentials.
- **Dedicated HOVIN EAS identity:** the legacy EAS binding resolved to `@hotelsvendors.com/invo`. A dedicated `@hotelsvendors.com/hovin` project was created and bound in mobile commit `f0ed280f9199587c8df7e908d8bd2c76eff69677`: project ID `ec9544d2-fb7d-4806-95b3-dae26d8893e9`, app name/slug/scheme `HOVIN`/`hovin`/`hovin`, dark appearance, package/bundle ID `com.hotelsvendors.hovin`. Local `npx tsc --noEmit` and Android export passed. Mobile PR [#3](https://github.com/Moataz301179/hotels-vendors-mobile/pull/3) merged as `e7345f8f928f749301a0d4be455b6a9b62dbcbb0` after the Mobile Quality check passed.
- **Internal Android candidate:** EAS preview build [`8b7f6de8-1901-4d69-9759-86daa71f8c26`](https://expo.dev/accounts/hotelsvendors.com/projects/hovin/builds/8b7f6de8-1901-4d69-9759-86daa71f8c26) was submitted from commit `f0ed280…`; it is internal distribution and was still `IN_PROGRESS` at last check. It is not a signed/public release claim until the build completes and controlled physical-device/Clerk/API acceptance passes.
- **Still blocked by evidence, not bypassed:** no permitted/Vendor-authorized catalogue feed has been supplied, no human catalogue review has occurred, no controlled Clerk browser identities have been provisioned, and no live ETA credential/callback acceptance has been run. Do not publish catalogue records, submit store releases, or claim end-to-end completion until those gates are completed.

## Catalogue, role-session, and mobile-release execution check — 2026-10-24 (read-only; no data or release mutation)

- **Current release: verified available, not MVP-accepted.** `https://www.hotelsvendors.com/api/health` returned HTTP 200 with `releaseId` and `sourceCommit` `github-08fed86ca8cf4ea1d093961dfea1df7f2f1bc176`, `database: ready`, and `authorization: configured`. Public `/`, `/marketplace`, and `/hovin` returned 200. Signed-out basket and ETA entries returned 307 to sign-in with their exact return paths preserved.
- **Catalogue: hard hold on publication.** The read-only `npx tsx scripts/catalog-readiness-report.ts` reports a 10,000-SKU target but only 94 source records, with zero provenance-tagged records and a `RESEARCH_CANDIDATE_ONLY` supplier register. It exited 2 with `materializationReady: false`. Public official sites confirm that Egyptian hotel-procurement categories exist, but their public pages do not establish reuse rights, current availability, or HotelsVendors Vendor authorization. Do not ingest, publish, or present those observations as live offers until source terms/permission, technical records, media rights, EGS/GS1 or controlled internal coding, duplicate screening, and a human review are recorded.
- **Role workflows: source-contract evidence only.** Focused role/dashboard/HOVIN/RFQ/public-catalogue tests passed: 7 files, 33 assertions. This proves scoped route behavior and buyer-side anonymity in the test harness, not live user acceptance. The repository lists seed fixtures but contains no approved controlled production test-identity provisioning or browser-session evidence. Create dedicated non-production/controlled identities for Hotel requester/approver/receiver, Vendor, Carrier, Funder, and Administrator; run each task journey against isolated records; capture results; then remove or expire the identities.
- **Mobile: release blocked by verified EAS identity mismatch.** The documented `/Users/Moatazi/hotels-vendors-mobile` checkout is absent. The clean candidate found at `/Users/Moatazi/hv-mobile-canonical-20261018` is on `codex/mobile-count-controls` and typechecks successfully, but its effective Expo config is inconsistent: `app.json` identifies HOVIN/`hovin`, while `app.config.js` resolves to slug/scheme `invo`. Read-only `npx eas project:info --json` resolves configured ID `515fa26b-e2f5-4036-9d25-800081b76af9` to `@hotelsvendors.com/invo`. No `.apk`, `.aab`, or `.ipa` was present and the live HOVIN page correctly states that no signed Android or iOS release has been published. Do not submit or reassociate this project until the owner selects or creates the correct HOVIN EAS project and a clean mobile source commit is explicitly designated.
- **Hermes check: non-authoritative.** Local `hermes status` reported gateway running and 0 jobs. This is not release, catalogue, or role-session evidence.
- **Exact next owner decisions/actions:** (1) nominate permitted/authorized product feeds and reviewer(s), then process them through the existing staging validator and review gate; (2) authorize a disposable controlled identity tenant for role acceptance; (3) designate the canonical mobile checkout/commit and the correct HOVIN EAS project, then approve build credentials/signing and device testing. After those inputs, run the ingestion/review batches, all role sessions, native builds, physical-device acceptance, and the governed production release verification in that order.

## ETA entry and idempotent production release repair — deployed 2026-10-24

- Governed release [40043695192](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/40043695192) deployed merge commit `5fc90823e01622edc985d1852d72550553fc7807` after PR [#35](https://github.com/Moataz301179/hotels-vendors-platform/pull/35) and PR [#36](https://github.com/Moataz301179/hotels-vendors-platform/pull/36) passed CI.
- `/eta-compliance` was missing from the edge protected-route classifier. A signed-out request reached the server-side role gate and returned HTTP 500. It is now classified as protected and live verification returned HTTP 307 with `location: /login?redirect_url=%2Feta-compliance`.
- A first activation attempt correctly rolled back because the Nginx CSP reconciler required a legacy override even when the production Nginx configuration was already clean (`hide=0`, `add=0`). The reconciler now treats exactly-zero legacy directives as an idempotent no-op, while still rejecting partial legacy configurations. The repaired workflow completed schema, lifecycle, test, build, package, migration, activation, public CSP and live-health gates.
- Independent post-release evidence: `/api/health` reported release/source `github-5fc90823e01622edc985d1852d72550553fc7807`, database `ready`, authorization `configured`; public CSP contains a nonce and neither `unsafe-inline` nor `unsafe-eval`; `/marketplace` returned HTTP 200.
- Local verification: protected-route/CSP/shell tests passed (14 assertions) and `SESSION_SECRET=build-validation-only-not-a-runtime-secret NODE_ENV=production npm run build` passed. No product catalogue data, vendor commercial data, or mobile artefact was added by this release.

## MVP cold-run baseline — 2026-10-24 (read-only; no release or data mutation)

- **Release foundation: pass.** `https://www.hotelsvendors.com/api/health` returned HTTP 200 with release/source `github-1d017670c102e5853850cc26aa18700c35079279`, database `ready`, and authorization `configured`. This confirms availability only; it is not a workflow acceptance result.
- **Public catalogue: hold.** Public `/marketplace` renders the five intended HoReCa families, but the cold-run captured only 15 distinct public specification routes and 30 `product image pending review` markers. This is not the requested 10,000-item, provenance-reviewed Egyptian HoReCa catalogue. It must remain a supplier-neutral reference catalogue until each record passes rights, taxonomy, specification, media, and publication review.
- **Basket/RFQ: source contract pass; live acceptance pending.** Focused catalogue/discovery, source-gate, anonymity, RFQ workspace, dashboard-context, HOVIN receipt-context and ETA-status tests passed (7 files / 16 assertions). Public unauthenticated access correctly redirects `/workspace/marketplace/basket` to sign-in while preserving its return URL, but no controlled Hotel session completed the basket-to-sealed-RFQ path in production during this baseline.
- **ETA delivery-control access: fail.** A direct unauthenticated request to `/eta-compliance` returned HTTP 500. Comparable protected routes redirect to sign-in. Repair this failure and prove role-scoped access before attempting the broader ETA invoice-submission gate acceptance.
- **Dashboards: hold.** Protected workspace entry points redirect unauthenticated users correctly, but no authenticated Hotel, Vendor, Carrier, Funder, or Administrator session was available for a task-based UI and data-scope acceptance pass. Do not claim the role dashboards are MVP accepted from route presence or unit tests.
- **HOVIN/mobile: fail for release readiness.** The public HOVIN page explicitly reports that neither a signed Android package nor a TestFlight/App Store link has been published. No native mobile project, `.apk`, `.aab`, `.ipa`, Expo configuration, or Android/iOS build files were found in this canonical repository. A separate mobile repository may exist, but no release evidence for it was established here.
- **UI/content: hold.** The live probe verifies routes and HTML, not visual quality. Current browser-capture review at desktop and mobile widths, plus authenticated-role screenshots, is still required before accepting the Apple-restraint visual system or claiming removal of generic/placeholder content.

### Required repair sequence before an MVP production acceptance run

1. Repair `/eta-compliance` unauthenticated failure and add a regression test for redirect/error behavior; then verify controlled Hotel/Vendor/Admin views against real role-scoped data.
2. Establish one evidence-backed Egyptian HoReCa catalogue intake/publication pipeline. Publish only reviewed records; measure category/subcategory coverage, image readiness, duplicate rate, provenance and rights. Scale toward 10,000 only after that gate works—do not seed invented or consumer-retail records.
3. Run one controlled Hotel journey in production: public category → product reference → signed-in requirement basket → sealed RFQ; assert no Vendor identity, stock, price, source URL, or private terms leak before authorized execution.
4. Validate each role dashboard from the work it owns (Hotel request/approval, Vendor response/fulfilment, Carrier handoff/tracking, Funder authorized decision, Admin governance), with empty/error/loading states and no generic marketing cards.
5. Choose and deliver a real HOVIN release path (native Android/iOS or an explicitly accepted PWA), then test receiving on a physical-device build. A marketing preview is not a mobile release.
6. Complete a screenshot-based responsive and accessibility acceptance pass at 390, 768, 1024 and 1440 px. Review copy for operational clarity, remove unreleased claims, and verify every CTA opens the exact contextual next task.

## Production recovery, strict CSP, and public catalogue gate — deployed 2026-10-24

- Governed release [40030655001](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/40030655001) deployed merge commit `1d017670c102e5853850cc26aa18700c35079279`. Independent live health evidence returned HTTP 200 with matching `releaseId` and `sourceCommit`, database `ready`, and authorization `configured`.
- The preceding 502 was caused by the failed release rollback leaving the PM2 process errored. The activation workflow now restores the immutable active release with its required runtime identity before attempting a candidate swap; the 502 is resolved.
- The public CSP now carries a per-response nonce and contains neither `unsafe-inline` nor `unsafe-eval` on `/`, `/api/health`, or `/marketplace`. The guard waits for the bounded Nginx graceful-worker handoff and still restores the old configuration and release if strict CSP does not become public.
- Read-only VPS evidence verified that systemd's Nginx master owns ports 80/443 and no effective Nginx proxy/FastCGI cache directives are configured. A second non-listening Nginx master remains an operational-cleanup item; do not stop it until its owner and purpose are separately verified.
- Public marketplace verification after the release found no `Demerara Crunch Shortbreads`, `Fisherman’s Pie`, or `Nature Valley` strings. The tracked legacy page `/marketplace/cmvftclvf00wucryf2kw1jppu` returns HTTP 404. This proves the publication gate prevents those unscreened legacy consumer records from public discovery; it does **not** establish a 10,000-item, reviewed Egyptian HoReCa catalogue.
- Verification: PR #29 CI [40025605363](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/40025605363), PR #30 CI [40026861611](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/40026861611), PR #31 CI [40027429139](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/40027429139), PR #32 CI [40027960774](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/40027960774), and PR #33 CI [40030339758](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/40030339758) passed. The release gate also passed schema, unit, integration, lint, build, package, and live health/CSP gates.
- Remaining scope: provenance-reviewed Egyptian HoReCa catalogue acquisition and publication at the target scale; authenticated role-workspace acceptance; end-to-end basket/RFQ and ETA lifecycle evidence; and separately authorized investigation/cleanup of the non-listening Nginx master.

## Canonical catalogue reference to RFQ repair — 2026-10-23 (local release candidate; not deployed)

- Source base: canonical `main` commit `1b235aeae39b176ab60c78234e591e2db911f34d`; candidate commit `750afa0` was rebased onto that base without replacing the recovered production migration. The current follow-up changes remain local on `codex/vps-migration-recovery-expanded` until an approved release gate is completed.
- Public catalogue references can now be retrieved by opaque published ID through `GET /api/v2/directory?id=…` without returning source URLs, candidate data, Vendor identity, stock, price, or offer terms. `POST /api/v2/rfq` accepts the validated `catalogReferenceId`, records a `QUEUED` supplier-neutral RFQ, and creates no Vendor grant.
- The selection journey now routes to `/workspace/marketplace/basket`: a signed-in Hotel confirms quantity, delivery context, and response window, then creates a sealed sourcing request. This is a private B2B requirement basket, not a retail cart or payment checkout. It intentionally does not imply inventory, price, availability, or a Vendor assignment.
- The shared visual tokens now enforce platinum/white operating surfaces and charcoal actions; Apple-style blue remains restricted to focus/link/icon signaling rather than panel or action fills. Further authenticated screenshot review remains required before release.
- Verification on this local candidate: focused directory/RFQ tests passed (21 assertions); focused marketplace/RFQ tests passed (13 assertions); full `npm test` passed (74 files, 269 tests); `SESSION_SECRET=build-validation-only-not-a-runtime-secret NODE_ENV=production npm run build` passed and includes `/workspace/marketplace/basket`.
- Not production proof: no production database migration, PM2 restart, Nginx change, browser role-session acceptance test, live ETA credential test, or deploy was performed. The 10,000-reference catalogue remains blocked on reviewed, permitted, provenance-backed data; no consumer seed data or unlicensed product images were published.
- `scripts/catalog/validate-staging-import.ts` is a local pre-ingestion gate for the staging model. It rejects consumer-retail noise, unclear source policy, taxonomy gaps, absent technical specifications, invalid MOQ/tax-code formats, undated attribution, and unreviewed media before a database write is even possible. Its local valid/invalid smoke check passed; it does not itself import, seed, or claim 10,000 products.
- Read-only release probe on 2026-10-23: `https://www.hotelsvendors.com/api/health` still reports `releaseId` and `sourceCommit` `github-3106b51fb5af53ba9627b9902b1c9aef05f8fe74`; it is not this candidate. Its response also still includes `unsafe-inline` and `unsafe-eval` in CSP. The connected Hostinger VPS `1636307` is running; provider disk metrics moved from approximately 103.6 GB used to 82.2 GB used on its 100 GB volume (about 20 GB available). The Hostinger API exposes no shell filesystem inventory, so an SSH read-only inventory is still required before any VPS cleanup or release action.

## Homepage sourcing-journey rebuild — deployed 2026-10-20

- Scope: rebuilt the public homepage in `app/(marketing)/page.tsx` and its scoped CSS module. The former explanatory launchpad, text rails and decorative workflow sections are replaced with visual, destination-led task cards, sourcing-area cards, a commercial-control panel, a connected workflow grid and a click-first HOVIN entry point. No marketplace, database, migration, Vendor-commercial, or mobile-release logic was changed.
- Category destinations now use the exact Marketplace taxonomy groups: Restaurants & bars, Housekeeping & laundry, Guest rooms & amenities, Engineering & maintenance, Furniture, fixtures & outdoor, and Hotel services. They are not display-name-only queries.
- HOVIN remains honestly labelled as an interactive product preview: a camera can identify an item, but quantity and condition still require an authorized human confirmation. No unreleased mobile screenshot or fabricated mobile data was presented as a live app.
- Verification: `git diff --check` and local `npm run build` passed. Local preview at port 3101 rendered the rebuilt homepage and exposed all six category links with their exact Marketplace query values.
- Source commit `3106b51fb5af53ba9627b9902b1c9aef05f8fe74` was deployed by governed workflow [39368667093](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/39368667093). Live `/api/health` reported matching `releaseId` and `sourceCommit`, database `ready`, and authorization `configured`.
- Remaining scope: role workspace pages still require their separately approved GUI-first rebuild; avoid mixing that work with Hermes catalogue intake. Production verification proves release identity and health, not an authenticated role workflow or mobile-store release.

## Role workspace shell replacement — staged 2026-10-20

- Scope: the shared application navigation and `/dashboard` are being replaced
  with role-specific workspaces for Hotel, Vendor (backend `SUPPLIER`), Carrier,
  Funder, and Administrator. The new navigation deliberately routes each role
  only to the operational areas it owns.
- Admin Control no longer renders marketplace intake, catalogue review, product
  candidate review, or requirement matching surfaces. It is constrained to
  access, governance, verification, and audit control; product discovery,
  orders, receiving, and Vendor stock remain operational workspaces.
- Design evidence used for the role sequence: SAP Ariba’s request-to-receipt
  lifecycle, Coupa’s guided intake/approval controls, Fairmarkit’s event and
  side-by-side comparison pattern, Alibaba Trade Center’s inquiry-to-confirmed
  order flow, and Made-in-China’s RFQ status model. HotelsVendors preserves its
  distinct anonymous RFQ and controlled identity-disclosure policy.
- `npm run build` passed. Deployment and authenticated role-by-role visual
  verification remain pending; never stage concurrent Hermes marketplace files.

## Authentication logo contrast correction — deployed 2026-10-20

- Scope: `app/globals.css` only. The login wordmark remains the shared SVG; on
  the light authentication story panel its white mark now sits on a compact
  charcoal tile with a visible keyboard focus ring. The public-navigation and
  footer logo styles are unchanged.
- Verification: targeted CSS diff check and `npm run build` passed. The build
  was run while separate, unstaged Hermes marketplace work was present; it
  confirms this source tree compiles but does not validate or approve Hermes'
  catalogue changes.
- Source commit `04a12fb4c3dd40d4e834f7e7eda7947b7d1466fb` was deployed by governed
  workflow [39361463212](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/39361463212).
  Live `/api/health` returned matching `releaseId` and `sourceCommit`, with
  database `ready` and authorization `configured`. `AGENTS.md` and concurrent
  marketplace files remain intentionally unstaged and outside this release.

## Homepage and HOVIN click-first redesign — deployed 2026-10-20

- Scope is intentionally isolated from catalogue intake: only
  `app/(marketing)/page.tsx`, its home CSS module, and the HOVIN receiving
  preview component/styles changed. No marketplace, directory, database,
  migration, or Vendor-commercial data path was modified.
- The final five homepage surfaces now use task/action cards and role-specific
  start choices in place of decorative outcome blocks. The HOVIN preview is a
  keyboard-accessible, click-driven product preview with hotel/Vendor role
  tabs and explicit context, barcode-identification, and receipt-outcome
  states. It is honestly labelled as a preview, not a live receipt or a mobile
  release claim.
- Verification: `git diff --check` and `npm run build` passed; local rendered
  review confirmed the homepage action cards and HOVIN scan state transition.
- Production workflow [39360558288](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/39360558288)
  completed successfully. Live `/api/health` returned matching `releaseId`
  and `sourceCommit` `addaf3f9521fc414e530305161e27335800cfd1a`, database
  `ready`, and authorization `configured`; the live homepage rendered the new
  connected-engine, HOVIN, and role-start markers.
- Catalogue implementation remains a separate Hermes scope and must not be
  co-staged with future homepage/dashboard changes.

## Public ETA access-link repair — deployed 2026-10-20

- Source commit `25f653e6e2b4b167ff930eaaa8b71e53aed26be7` changes only the two
  public footer ETA links (`components/PublicFooter.tsx` and
  `components/marketing/site-footer.tsx`). They now enter the authenticated
  ETA workspace through `/login?redirect_url=%2Feta-compliance`; no ETA
  authorization, database, procurement, or migration logic was changed.
- Local verification: `npm run build` passed. Governed production workflow
  [39357691622](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/39357691622)
  completed successfully, including isolated schema and lifecycle checks,
  production migration/status verification, upload, activation, and release
  health checks.
- Live provenance verified from `/api/health`: `releaseId` and `sourceCommit`
  both equal `25f653e6e2b4b167ff930eaaa8b71e53aed26be7`; database is `ready`
  and authorization is `configured`. The public homepage now renders the ETA
  footer link through the sign-in redirect.
- Remaining risk: this confirms the public entry point, not that an
  authenticated user can complete the ETA workflow. Direct unauthenticated
  `/eta-compliance` behavior and the authorized end-to-end ETA lifecycle still
  require a separate role-session verification.

## Neon migration recovery rehearsal — 2026-10-20 (release candidate pending deploy)

- A fresh, time-bounded recovery branch, `pre-migration-149bffd6-20261020`
  (`br-withered-surf-b55xxy0m`), was created from the current production
  branch. It has a provider-enforced expiry of 2026-10-26 and was reset from
  its production parent after testing; its recorded written-data size is zero.
  It is therefore the current clean rollback point for this release window.
- Neon branch capacity was full. Two older, superseded, zero-write backup
  snapshots from 18 October were removed only after their exact identities and
  lack of writes were verified: `backup-before-core-release-20261018`
  (`br-sweet-sound-b5f6x8wd`) and
  `production-backup-before-6006aac-20261018`
  (`br-square-shape-b5lxbz2r`). Later recovery snapshots were retained.
- On the isolated clone, `prisma migrate deploy` applied
  `20261020050000_add_network_transaction_ledger`; post-migration Prisma
  status was up to date, and the read-only schema gate passed with all 20
  required tables. The remote lifecycle suite passed 6/6 when given a
  120-second remote-database test budget. A direct mutation attempt against a
  `NetworkTransactionEvent` was rejected by its append-only database trigger.
- The ledger helper no longer acquires a second per-order advisory lock after
  the global audit-chain lock. This removes an inverted lock order with the
  receiving route that could deadlock concurrent order status and receipt
  writes. The integration suite now asserts ledger event ordering, hash links,
  event count, and immutability.
- Release candidate verification: focused ledger route tests passed (39), and
  `npm run build` passed. The remaining action is to push the candidate source,
  dispatch the governed production workflow, then require matching live health
  release/source identifiers before claiming deployment.
- Two production-gate workflow attempts stopped before any production
  operation: first because `prisma db push` cannot install SQL triggers, then
  because the historical migration chain begins with SQLite-era `DATETIME` SQL
  and cannot replay into a blank PostgreSQL CI service. The workflow therefore
  retains its existing current-schema CI projection for route behavior and
  disables only the trigger assertion there. The mandatory trigger proof is
  performed against the real, disposable Neon recovery clone before deployment;
  production still applies `prisma migrate deploy` and then executes the
  read-only schema gate.

## Defensible network transaction record — 2026-10-20 (staged; not deployed)

- The current source persists RFQs, quotes, orders, GRNs, invoices, payments,
  documents and funding records, and its material procurement mutation routes
  already append to the protected `AuditLog` hash chain. This is a verified
  source-level fact, not proof that every live historical transaction is
  complete or that a backup/retention process is operating.
- A source-level transaction-ledger migration is now staged in
  `prisma/migrations/20261020050000_add_network_transaction_ledger`. It adds a
  tenant-bound `NetworkTransaction` root and immutable,
  hash-linked `NetworkTransactionEvent` records with `RESTRICT` relationships
  so retained ledger evidence cannot be silently removed through a parent
  deletion. `lib/procurement/network-transaction-ledger.ts` supplies the
  transaction-safe append primitive.
- The staged ledger is now wired into the core source write paths: RFQ creation,
  Vendor quote submission, quote-to-order conversion, approval recording, order
  status change, GRN receipt and invoice submission each append a transaction
  event in the same database transaction as their existing audit record. It is
  still not deployed, so it cannot yet be presented as live transaction
  archiving. Payment and funder write paths need the same treatment when their
  live, partner-authorized mutation endpoints are implemented.
- Local verification after the wiring: schema validation, Prisma client
  generation and `npm run build` passed; 39 focused RFQ/quote/order tests and
  2 GRN authorization tests passed. The database integration suite correctly
  refused to run against Neon because there is no disposable branch configured.
  Activation must occur only after the existing Neon backup/clone and
  migration-history gate is resolved, followed by an approved retention
  schedule, archive manifest export/storage design, and end-to-end lifecycle
  verification.
- The permanent architectural decision and vocabulary are recorded in
  `docs/adr/0001-network-transaction-ledger.md` and `CONTEXT.md`.

## Catalogue publication guard and visible-entry refresh — 2026-10-20 (not deployed)

- The public homepage now starts with direct, task-based paths to catalogue
  browsing, a controlled request, and order follow-up. The authenticated
  dashboard now presents a role-specific first action above its live metrics
  and workflow records. These changes are in the local source only until the
  production migration gate is resolved.
- Added an Administrator-only open-licence publication route at
  `app/api/v2/admin/directory/open-license-publish/route.ts`. It accepts no
  generic scraped source: it is restricted to the two declared Open Facts
  catalogue URLs, a recorded ODbL/CC-BY-SA evidence object, permitted source
  status, no duplicate relationship, and a non-placeholder HTTPS image from
  the official image host. Every batch writes an audit entry and public records
  carry catalogue attribution; it never publishes a Vendor identity, offer,
  stock or price.
- Local checks: focused directory route suite passed (7 tests) and `npm run
  build` passed. A local browser confirmed the new homepage launch paths.
  The local dashboard could render its shared shell but cannot establish an
  authenticated role session without production Clerk evidence.
- Open Food Facts staging remains local and unpublished. The initial 500
  records include 10 known `/invalid/` image URLs, so the new guard correctly
  prevents their batch from being published as product images. Do not claim the
  remainder is image-live until an image availability probe and batch split are
  recorded.
- Release blocker remains unchanged: production deploy executes all pending
  Prisma migrations, including
  `20261019030000_add_sealed_multi_vendor_rfq`. Do not dispatch deployment
  until a restorable Neon production backup/clone exists and the owner approves
  that migration. The current source change itself needs no new migration.

### Strategic sequencing recorded 2026-10-20

1. Complete ETA invoice lifecycle verification from approved PO, controlled
   receiving/GRN, supplier invoice, and official submission/result evidence.
2. Scale Vendor onboarding and supplier-owned catalogue intake with provenance,
   permission, review and tenant-safe commercial matching.
3. Add funder-partner evidence cases from authorized order, ETA status and
   HOVIN receipt evidence. The platform must not represent this as automatic
   underwriting, credit approval or funder disbursement.

## Bulk private catalogue intake — 2026-10-19 (pending release)

- Added a reusable Administrator bulk-intake control in
  `components/v2/directory-operations.tsx`. It accepts a normalized JSON batch
  of at most 100 records and delegates to the existing authenticated
  `/api/v2/admin/directory/candidates` endpoint; it does not add a second
  ingestion API or a migration.
- The control makes the actual boundary explicit: every submission remains
  `PENDING_REVIEW`, generates the endpoint's audit record, and reports zero
  publication. It cannot claim a price, stock, commercial offer, Vendor
  identity, or image-use permission.
- A rendered, public observation of the Mass Distribution catalogue identified
  251 product cards. Those records have been normalized into three local,
  disposable batches (100, 100, 51) with source permission intentionally
  `PERMISSION_UNKNOWN`; they have not yet been sent to the production system.
- Local verification: catalogue JSON-LD suite passed (5 tests) and
  `npm run build` passed. Build warnings remain non-blocking: Prisma config
  deprecation, outer workspace detection, and React 18 deprecation in Next 16.
- Next action after release: an authenticated Administrator queues the three
  private batches, then separately verifies source/image reuse rights before
  considering any candidate for public publication.

### Intake evidence recorded after release

- Production release [`2963dfa3`](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/39319718029)
  completed successfully. The live health response reported matching
  `releaseId` and `sourceCommit` `2963dfa3fff46127fed7381c65636d1971801991`,
  database `ready`, and authorization `configured`.
- An authenticated Administrator submitted the three generated batches through
  the released UI: 100, 100, and 51 records. The UI confirmed 100 (one
  duplicate relationship flagged), 100, and 51 observations queued;
  published records stayed at zero for every submission.
- The live source registry then reported
  `https://www.massdistributioneg.com/products` as `permission unknown`,
  `251 candidates`, and `ingested`; the cross-source total was 301 candidates.
  This is intake evidence only, not proof of permission to reuse images or a
  claim that any source is a participating Vendor.

## Catalogue intake repair — 2026-10-19 (pending release)

- Working source was `59495a0d` on `main` before this repair. The only official
  workspace remains `/Users/Moatazi/hotels-vendors-new`; no worktree or branch
  was created.
- Production intake was exercised by an authenticated platform administrator
  with seven researched public catalogue/category URLs. The live result was 12
  private observations from 5/7 sources; two source attempts failed and four
  page-level fallbacks yielded no product records. Nothing was published.
- The fallback now discovers bounded, same-origin product-card and schema.org
  ItemList URLs from a submitted catalogue page, fetches up to 24 candidate
  product pages with concurrency four, and retains only schema.org Product
  facts. It also has a conservative WooCommerce detail-page adapter for public
  pages that render a real product title but omit Product JSON-LD; it reads
  only visible title, SKU, category, image, and stock state. It never follows
  third-party/navigation links or invents commercial data. The relevant implementation is
  `lib/sourcing/scrapegraph-discovery.ts` and tests are in
  `tests/p0/public-catalog-jsonld.spec.ts`.
- The same adapter now reads product objects embedded in public Next.js Flight
  payloads as JSON text only (never by evaluating supplier page scripts). It
  requires a public id, name, category, image, and observed price, then records
  pack/case quantity as MOQ evidence. This covers the verified Mass
  Distribution page structure; re-run its `/products` route after release.
- Local verification after the change: `npm test -- --run` passed (74 files,
  264 tests); `npm run build` passed. Non-blocking build warnings remain for
  Prisma's deprecated `package.json#prisma` setting, an outer workspace
  `pnpm-workspace.yaml`, and React 18 deprecation in Next 16.
- Next owner action: commit and deploy this repair through the existing manual
  production workflow, then re-run only the source pages that previously
  produced zero observations. Keep all newly observed candidates private until
  reuse permission, image-use review, and product review are recorded.

## Marketplace visual completeness — 2026-10-19 (pending release)

- Reviewed directory records that have no approved product image now render a
  clearly labelled operating-category artwork panel instead of a blank card.
  The panel never claims to be a photo of the named item and does not expose
  source or vendor information.
- Changed: `components/marketing/marketplace-directory.tsx` and
  `components/marketing/marketplace-directory.module.css`.
- Verification: focused directory/discovery tests passed (8 tests) and
  `npm run build` passed. Product photography still requires an image source
  that has cleared source-rights and catalogue review.

## Public directory experience — pending deployment 2026-10-19

- Replaced the public marketplace's compact directory table with a responsive,
  category-filterable discovery interface in
  `components/marketing/marketplace-directory.tsx`.
- Each entry remains vendor-neutral and explicitly labels a market reference as
  a dated signal, never stock, an offer, or a commercial commitment.
- A chosen record now hands off to the authenticated hotel workspace with the
  product preselected; the public route never reveals vendor identity or terms.
- The homepage primary action now leads to `/marketplace` so visitors can see
  the reviewed directory before registration.
- Local verification: `npm test` passed (72 files / 256 tests), `npm run build`
  passed, and a production-build local browser inspection confirmed category
  filters, search, cards, and secure workspace handoff links at `/marketplace`.
- Pending: production deployment and live browser verification. This improves
  the visible catalogue journey but does not turn 15 reviewed records into a
  complete operating catalogue; governed catalog coverage remains an active
  operational requirement.

## Unreleased implementation — 2026-10-19

- Local source now contains a sealed multi-vendor RFQ implementation that is not
  yet committed, migrated, or deployed.
- It adds a response deadline, vendor-specific internal product assignments,
  one response per assigned vendor, anonymous buyer comparisons, and an
  exception-reason gate for selection before the deadline.
- New migration: `20261019030000_add_sealed_multi_vendor_rfq`. Do not apply it
  until a production backup/clone and the existing migration approval gate are
  complete.
- Focused checks passed locally: 35 tests across quote submission, RFQ matching,
  and quote conversion; TypeScript type-check passed. A full build is still the
  release verification gate.
- Hermes is not a continuation dependency. Use `AGENTS.md` and
  `.agents/skills/hv-project-memory/SKILL.md` for repository continuity.
- Deployment block: Neon rejected creation of a fresh pre-migration recovery
  branch because the project's branch limit is reached. Existing recovery
  branches were preserved; do not delete one without owner approval. Production
  migration and activation remain blocked until capacity is available.

## Production release

- Runtime source commit: `93b701bd8622528324a0a656b5812005bbae6bf1`.
- GitHub deployment: [run 39046799295](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/39046799295), completed successfully.
- Live health: `releaseId` is `github-93b701bd8622528324a0a656b5812005bbae6bf1`; `sourceCommit` matches; database is `ready`; authorization is `configured`.
- Release route used: `main` push → manually dispatched `.github/workflows/deploy-production.yml` → isolated Postgres/Redis gates → SSH artifact activation at `/var/www/hv-releases/github-${GITHUB_SHA}` → PM2 replacement.
- Active PM2 contract enforced by that workflow: process `hotels-vendors-production`, release cwd `/var/www/hv-releases/github-93b701bd8622528324a0a656b5812005bbae6bf1`, port `3008`.
- Proxy contract: `docs/architecture/system-map.md` and the deployment skill specify Nginx upstream `localhost:3008`. The workflow's successful public HTTPS health verification proves the released process is reachable through the live proxy; this run did not directly read the VPS Nginx file.
- Hostinger VPS: `1636307`, state `running`, Ubuntu 22.04.

## Database and migration

- Neon project: `wild-glade-15493181`, production branch `br-green-block-b5wfx1ft`.
- `prisma migrate status` was clean before the batch.
- Migration `20261017153000_add_directory_catalog_foundation` is applied.
- No reset, schema push, or destructive database operation was used.

## Supplier-neutral directory batch

- Internal source: `internal://hotelsvendors/hospitality-core-specifications/v1`.
- Source type: `INTERNAL_HOSPITALITY_SPECIFICATION`; permission status: `PERMITTED`.
- Published records: **15**; reviewed candidates: **15**; publication audit events for this batch: **1**.
- Scope: generic guest-room linen, guest amenities, housekeeping, food-and-beverage operating equipment, engineering/FF&E, and hotel services.
- Excluded by data model and validation: supplier names/identities, supplier URLs, prices, stock, availability, offers, lead times, ETA, and delivery commitments.
- Materializer: `scripts/publish-internal-directory-batch.ts`. It requires an existing platform administrator, explicit `--apply`, and `HV_ALLOW_INTERNAL_DIRECTORY_PUBLICATION=1`.
- Source specifications: `data/directory/hospitality-core-specifications.v1.json`.

## Verification completed

- `npm test`: 62 files / 232 tests passed.
- Catalog-focused suite: 5 files / 16 tests passed.
- `npm run build`: passed.
- Production workflow isolated integration test: passed.
- Production database query: 15 published `DirectoryProfile` rows; all candidate rows are approved; source is permitted.
- `https://www.hotelsvendors.com/marketplace`: live HTML contains directory item names, descriptions, and service entries; no internal source, profile ID, supplier identity, or commercial fields were found in the rendered page.
- `/api/v2/directory` remains protected by Clerk. Unauthenticated live requests correctly return `401`; its DTO safety is covered by the directory route test. A logged-in hotel-session request was not captured in this run because browser direct API navigation was blocked by the browser client.
- Buyer path: each marketplace row directs the user to network registration for an RFQ-required journey. It does not expose a direct commercial purchase or supplier disclosure path.

## Completed work

### P0

- Directory schema, review workflow, public DTO boundary, and migration are deployed.
- Source-permission and audit requirements are implemented.

### P1

- Supplier-owned catalog behavior remains separate from the directory batch and was not changed.
- The marketplace now renders a non-commercial specification under each published directory item.

### P2

- First production directory batch is live: 15 supplier-neutral, internally authored hospitality specifications.
- Controlled publishing materializer and batch safety test are committed in the production release.
- Local database integration command now rejects Neon unless `HV_INTEGRATION_ALLOW_REMOTE=1` is explicitly set; GitHub CI uses isolated Postgres and passed.

## Outstanding work

1. Add further internally authored or demonstrably permitted batches through the same review/materialization path. Do not import the old supplier/product fixture files as production evidence.
2. Build an authenticated hotel-session acceptance check for `/api/v2/directory` and its RFQ initiation route.
3. Add an audited directory-profile withdrawal operation before operating at larger catalog volume.
4. Resolve the broad pre-existing repository lint debt separately; targeted deployment lint is green, while repository-wide lint remains unsuitable as a release gate.
5. Investigate and safely classify the interrupted production integration-test fixtures: 3 `it-*` tenants, 5 test users, 1 test supplier, and 25 append-only audit rows were created before the newly added guard stopped future runs. Do not delete them by cascading database operations; use an explicitly reviewed archival/remediation procedure.
6. Do not amend the release commit automatically. Git recorded the local committer as `Moataz Ghani <Moatazi@MacBook-Air.local>`; configure the preferred Git identity before a future commit if needed.

## Exact continuation tasks for Hermes

1. Read this file, then confirm live health still reports commit `93b701bd8622528324a0a656b5812005bbae6bf1`.
2. Treat the 15 records as generic sourcing specifications, not supplier offers.
3. Before adding a batch, verify source permission and use a disposable Neon branch for any integration rehearsal.
4. Use the existing PM2 process `hotels-vendors-production`; do not create another production process or route.
5. Extend catalog coverage only after preserving the buyer DTO boundary and audit chain.

## Working tree and blockers

- At handover creation, user-owned untracked directories remain preserved: `.next-maintenance-build/` and `.next-maintenance/`.
- This handover file is intentionally added after the runtime release and is not part of release commit `93b701bd`; commit it only as documentation if a new source revision is wanted. Do not deploy it merely to change documentation.
- No production availability blocker remains for the published supplier-neutral directory batch.

## Current governed catalogue release — 2026-10-20

- Runtime source commit: `97cc31349054f7f9f9d6b2609065de0603172dd3`.
  It includes the governed-batch retry correction (`59880f67`) and Next Image
  configuration for the permitted Open Food Facts product media.
- Deployment evidence: [batch-retry run 39331819383](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/39331819383)
  and [image-rendering run 39332763148](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/39332763148)
  completed successfully. Live health subsequently returned matching `releaseId`
  and `sourceCommit`, with database `ready` and authorization `configured`.
- A governed Open Food Facts batch was published from the source's openly
  licensed data export under source record `https://world.openfoodfacts.org/data`:
  **100 + 98 + 95 + 97 = 390** catalogue references. Duplicate candidates
  (**2 + 5 + 3**) were deliberately retained in private review rather than
  published. The source is recorded as `OPEN_LICENSED_BULK_EXPORT` / `PERMITTED`.
- Visual production check: `/marketplace` product cards now render actual
  permitted product images through the same-site Next image optimizer. Card
  output does not expose a Vendor name, source URL, stock assertion, price, or
  binding offer.
- Known scope limit: the current marketplace query renders at most 100 entries
  per view and this first external batch maps primarily to the food-and-beverage
  taxonomy. Pagination and hospitality-specific category curation are separate
  follow-up work; do not represent 390 published references as a complete hotel
  purchasing catalogue.
- External source observations with unproven reuse rights remain private in
  review. Do not publish them until permission, attribution, duplicate handling,
  and category fit are evidenced.

## Reconciliation evidence — 2026-10-23

- Canonical source: GitHub `main` now contains merge commit
  `4bda2705b3be81aed81e7098be40d87619a89353` (PR #21). Its main-branch CI run
  `39869538007` passed isolated database lifecycle, full tests, production build,
  standalone package, and packaged runtime smoke checks. This is source/build
  evidence only; it is not a production deployment.
- Read-only VPS recovery run `39869852982` observed `/` at **97 GB total, 77 GB
  used, 21 GB free (80%)**. The active `hotels-vendors-production` PM2 process
  is online from `/var/www/hv-releases/github-3106b51fb5af53ba9627b9902b1c9aef05f8fe74`.
  No file was deleted, no PM2 process was restarted, and no Nginx change was made.
- The formerly missing migration was recovered read-only from
  `/var/www/hotelsvendors/prisma/migrations/20261003_funder_approval_state/migration.sql`.
  Its SHA-256 is `c89cf947b98cb79d1f1fd0dd3237e3c529d7fa3c2bfb0f19417b041d395e95c8`,
  exactly matching the canonical migration byte-for-byte. It must not be recreated.
- Pending source-only guard: the deployment workflow now requires the active
  governed PM2 contract, an active health check, and matching Nginx `3008`
  routing before replacement; it rolls the old runtime back if startup or
  public health identity fails. The recovery workflow is extended to capture
  sanitized Nginx topology directives so that the historical port conflict is
  resolved from live evidence before a release attempt.
- Still blocked from production activation: run the updated read-only topology
  capture; rehearse migrations against a fresh restorable Neon clone; obtain
  source-backed, rights-cleared hospitality catalogue data rather than inventing
  10,000 references; and complete authenticated role/browser acceptance with
  real non-production test identities. ETA remains fail-closed until official
  credentials, signing hardware, and callback verification are supplied.

## PR #24 Nginx topology-guard regression evidence — 2026-10-23

- Scope: PR #24 remains open on
  `codex/vps-migration-recovery-expanded`. Commit `26b040248c69dee826eae2d8264d91ce3420fa52`
  adds `tests/p0/deploy-topology-guard.spec.ts`; it does not alter the deployed
  guard logic. The test extracts the exact AWK program from
  `.github/workflows/deploy-production.yml` and executes that program directly.
- Verified results: `npx vitest run tests/p0/deploy-topology-guard.spec.ts --reporter=verbose`
  passed **9/9**. It accepts direct `3008` routing and both single-line and
  multi-line `upstream nextjs` routing to `3008`; it rejects non-governed ports,
  missing routing, look-alike upstream names, and unrelated upstreams.
- Additional local checks passed: `npx eslint tests/p0/deploy-topology-guard.spec.ts`,
  `git diff --check`, YAML parsing of `.github/workflows/deploy-production.yml`,
  and `bash -n` of the exact `Activate release and verify` workflow shell block.
  GitHub Actions build `39878547771` passed for commit `26b0402`.
- No production action was performed for this change: no merge, deployment,
  release call, PM2 restart, or Nginx modification. CI proves source checks only.
- Remaining blocker and next action: obtain owner approval for a separate,
  production-verification step before any release workflow is manually invoked.
  That step must retain the governed `3008` topology and active health gate;
  it is outside this PR documentation/test update.
## Clerk signup CSP repair — 2026-10-30 (candidate)

- **Observed live defect:** both `/hotels/signup` and `/suppliers/signup` rendered their role-specific marketing copy but no Clerk inputs or action controls. Browser inspection found no `.cl-rootBox`, no inputs, and `window.Clerk` remained undefined after the Clerk loader was requested.
- **Cause:** the live response CSP required a per-request nonce while the pages were statically rendered. Next therefore emitted framework and client scripts with no nonce, so the strict `script-src ... 'strict-dynamic'` policy blocked the client bundle that mounts Clerk.
- **Source correction:** `app/layout.tsx` now waits for `connection()` before rendering. This makes the shared layout request-rendered, allowing Next 16 to apply the nonce forwarded by `proxy.ts` to framework and Clerk scripts. The `ClerkProvider` is also placed inside the required `html > body` root-layout structure.
- **Verification:** `npx vitest run tests/p0/production-shell-contract.spec.ts` passed (9 assertions); `npx tsc --noEmit` passed; `SESSION_SECRET=<ephemeral> npm run build` passed; and `git diff --check` passed. The temporary build value was not saved or printed.
- **Next action:** commit, push, and run the governed production workflow. After activation, verify the live CSP nonce appears on framework scripts and that both role signup pages render Clerk controls without creating a user.

## Clerk role-auth routing repair — 2026-10-30 (deployed)

- **Scope:** Clerk continues to own authentication for every platform role. Hotel and Vendor remain the only public registration paths; carrier and funder accounts remain provisioned partner roles and may sign in normally once provisioned.
- **Observed state:** live Clerk controls show Google and Apple on both role signups and the shared login. The prior client-rendering/CSP failure was already repaired in runtime source `576e7ce`.
- **Correction:** all Clerk completions now first pass through `/auth/continue`. The server creates the scoped public-registration record where appropriate, sends pending registrations to `/onboarding`, and only sends active users to a safe same-origin return path. The shared login uses Clerk redirect OAuth, disables opaque OAuth sign-up (`transferable={false}`), and routes new users to the role-selection page rather than silently assigning an OAuth sign-in to a default role.
- **Verification:** `npx vitest run tests/p0/clerk-auth-routing.spec.ts tests/p0/production-shell-contract.spec.ts` passed (11 assertions); `npx tsc --noEmit` passed; `SESSION_SECRET=<ephemeral> npm run build` passed; and `git diff --check` passed. No Clerk user, provider, OAuth credential, or production database record was created or modified during validation.
- **Deployment:** [production workflow 41040771475](https://github.com/Moataz301179/hotels-vendors-platform/actions/runs/41040771475) passed for source `e1ff3f39fb813e7517dbbd56b829ad999a33b08c`. Live health reported the same release ID, database `ready`, and authorization `configured` after activation.
- **Live unauthenticated verification:** Google and Apple controls render in the shared login and Hotel signup components. The Clerk login's registration link now leads to `/register`; the Hotel signup's sign-in link retains the onboarding-safe return path. No real OAuth identity was created or authenticated.
- **Remaining acceptance:** verify Google and Apple callbacks with controlled non-production identities for a Hotel, Vendor, and provisioned partner account. Do not use a production identity for browser automation.

## CI smoke self-proxy on loopback — 2026-10-30

- **Source:** branch `ci-heal/pr-38-smoke`, based on `6f3ca34938bf198a58aaacb8f4998db98ba63b94`. GitHub Actions run `41143407238` is the only run of that SHA and it failed. Earlier runs on this branch failed in lint before smoke. No later run of `6f3ca349` passed, so the timeout was not a flake that later went green.
- **Scope:** `proxy.ts` drops a same-path loopback `x-middleware-rewrite` and restores `x-middleware-next`, so Next renders the page in process instead of proxying `localhost` while the process is bound to `127.0.0.1`. Path-changing and non-loopback rewrites are left unchanged. The smoke step names the path when curl exits non-zero and still requires HTTP 200. Pull requests into `codex/vps-migration-recovery-expanded` run HotelsVendors CI. No deploy workflow, production secret, or database change.
- **Cause:** the homepage was not the slow request. With `HOSTNAME=127.0.0.1`, `GET /` returned in about 130 ms with the homepage markers. The smoke loop then requested `/login`. Clerk replaces `x-middleware-next` with an absolute rewrite of `http://localhost:<port><path>`. Next compares that origin with the bind address (`http://127.0.0.1:<port>`) and proxies the request to itself. Nothing accepted that connection, so curl received 0 bytes until its 10 s limit (exit 28). `set -e` aborted before the script printed the path, which made the log look like a homepage timeout. Binding `0.0.0.0` made the same `/login` request return 200 in about 115 ms, which confirmed the self-proxy. A document-style curl to a `pk_test` instance returned the Clerk handshake 307 in 4 ms and was not the hang. Run `41143407238` is the only run of SHA `6f3ca349`; it did not later pass.
- **Verification:** standalone server, `HOSTNAME=127.0.0.1`, `HV_RELEASE_SMOKE=1`, port 3100, no database. Before the header restore, `/login` was HTTP 200 with an empty body because Next treated the middleware response as final. After restoring `x-middleware-next`: `/` 200 in 21 ms (119493 bytes, both homepage markers present; cold `/` on the unrepaired server was about 130 ms); `/login` 200 in 27 ms (29260 bytes, HTML containing “Sign in”); the other 14 smoke paths 200 in 7–85 ms, each with a document body; `/audit`, `/security`, `/intelligence`, and `/demand-aggregation` 307 in about 3 ms; `/api/v2/audit`, `/api/v2/funders`, and `/api/v2/demand` 401 in about 3 ms. No `Failed to proxy` in the server log. `npx vitest run tests/p0/loopback-rewrite.spec.ts tests/p0/production-shell-contract.spec.ts` — 15 passed. Local `/api/health` stays 503 without Postgres; CI has the database service.
- **Next owner action:** review and merge the healing PR. Do not merge it automatically. Do not push this change onto `codex/vps-migration-recovery-expanded` or `main` from the agent.

