# AI Capability Map — HotelsVendors

> Every promised AI capability mapped to its actual screen, data source,
> permission, executable action and acceptance test. Status is stated plainly:
> VERIFIED, BUILT-NOT-WIRED, or MISSING. Nothing here is claimed without a test
> or a live run behind it.

---

## 1. AI AGENT (chat assistant)

**Screen:** `components/v2/procurement-assistant.tsx` — mounted inside
`components/v2/procurement-console.tsx` on the workspace/marketplace console.
Also `components/Assistant.tsx` (legacy surface).

**Route:** `POST /api/v2/assistant`

**Data source:** Prisma, tenant-scoped. Each tool queries only what its
permission allows.

**Permission model (fail-closed):**

| Gate | Rule |
|---|---|
| Entry | At least one of `order:read`, `product:read`, `invoice:read`, `fintech:read`, `report:read`, `audit:read`. Otherwise `403 ASSISTANT_PERMISSION_DENIED`. |
| Tool | `TOOL_PERMISSION` maps each tool to required permissions. Unpermitted tools are **dropped**, not redacted. |
| Field | `FIELD_PERMISSION` strips every key not explicitly allowed **before** the result reaches the model or the client. `supplierId`, `sourceKey`, IBANs and client names are never returned. |
| History | Client-supplied roles are rejected. History is reconstructed from persisted, already-scrubbed `ChatMessage` rows owned by the actor's tenant. |

**Executable actions:** read-only snapshots plus one demonstrative calculator.
No AI tool can create, approve, release or pay anything.

| Tool | Permission | Fields returned |
|---|---|---|
| `catalog_snapshot` | `product:read` | productId, name, sku, unitPrice, images, status |
| `spend_snapshot` | `order:read` | orderCount, orderTotal |
| `rfq_pipeline` | `order:read` | byStatus, total |
| `inventory_alerts` | `order:read` | productId, sku, name, stockLevel, reorderPoint, projectedDays, leadTimeDays |
| `opportunity_snapshot` | `order:read` | openProductIntelligenceOpportunities |
| `cashflow_alerts` | `invoice:read` + `fintech:read` | id, invoiceNumber, dueDate, total, currency |
| `fee_calculation` | none (demonstrative) | claimedRateTotal, hypotheticalTotal, illustrativeTotal, chargeable |

**Acceptance tests:** `tests/p0/assistant-contract.spec.ts`,
`tests/p0/assistant-honesty.spec.ts`, `tests/p0/fee-calculator.spec.ts`.

**Status: VERIFIED end-to-end.** Signed-in UI → AI AGENT panel → question →
HTTP 200 → `provider: ollama`, `model: llama3.2:latest` → real answer with
`[source=prisma; scope=tenant:…; observedAt=…]` citations. The answer stated
honestly that no specific towel supplier could be identified — no fabrication,
no supplier identity disclosed.

---

## 2. Provider-independent model access

**Screen:** none — backend only.

**Route:** `lib/ai/llm.ts` (`executeLLM`).

**Implemented:** `lib/ai/llm.ts` now carries the full chain
Ollama → Groq → OpenRouter → xAI, local-first.

- A provider that fails or times out falls through to the next.
- `allowExternal: false` restricts the chain to local inference only — no
  prompt ever leaves the machine.
- If every provider is unavailable the router returns
  `available: false` with an honest notice. It never fabricates an answer.
- The result names the provider and model that produced the answer.
- Credentials are read from the server environment only.

**Deployment target:** Ollama is reachable on the VPS at `127.0.0.1:11434`
(model `artifish/llama3.2-uncensored:latest`). The port is **not publicly
reachable** (external probe → `http_code=000`). `OLLAMA_HOST=0.0.0.0:11434`
remains broader than loopback — hygiene issue, owner approval required.

**Live verification (local):** the full signed-in journey returned
`provider: ollama`, `model: llama3.2:latest`, HTTP 200, with a real answer
carrying evidence citations.

**Acceptance tests:** `tests/p0/llm-provider-router.spec.ts` (8/8).

**Credential rule:** server-side only. No provider key is exposed to any
client component. Financial documents are **not** sent to any new provider
until its data handling is approved.

**Status: VERIFIED (code + live local run). External providers unconfigured by design.**

---

## 3. Virtual Ghost (operational intelligence)

**Screen:** **MISSING** — there is no component that renders Ghost findings.
The engine and API exist; nothing displays them.

**Route:** `GET|POST /api/v2/ghost`, `POST /api/v2/ghost/[findingId]`

**Data source:** Prisma — `Opportunity` rows plus `ConsentRecord` opt-in.

**Permission model:**

- Organization opt-in is required per tenant (`GHOST_CONSENT_TYPE`,
  `GHOST_CONSENT_VERSION`). No opt-in → no evaluation.
- Findings are labelled `evidenceLabel: "INFERENCE"` with a disclaimer.
- `decideGhostFinding` writes `AuditLog` with
  `expenditureApproved: false, orderReleased: false`.

**Executable actions:** accept / dismiss a recommendation — an operational
acknowledgement only. **Acceptance is not expenditure approval and not order
release.**

**Acceptance tests:** `tests/p0/ghost-operational-intelligence.spec.ts` (9/9).

**Status: BUILT-NOT-WIRED (no UI, no live tenant exercise).**

---

## 4. Role-specific prompts

**Screen:** assistant prompt selector.

**Files:** `components/ai-assistant/prompts/{hotel,supplier,factoring,shipping,admin,public}-prompt.ts`

**Status: VERIFIED (files exist and are imported) — Arabic variant MISSING.**
No prompt file contains Arabic (`عربي`) content, so the promised
English/Arabic onboarding demo has no Arabic model.

---

## 5. English/Arabic onboarding demo

**Screen:** onboarding flow.

**Status: MISSING.** No bilingual onboarding UI, no Arabic prompt, no recorded
demo. Marked explicitly as not delivered.

---

## 6. Authorized procurement task (end to end)

**Screen:** workspace marketplace → RFQ → quote accept → order.

**Status: PARTIAL.** The assistant can read snapshots and the workspace can
build an RFQ, but there is **no recorded end-to-end run** of a user completing a
procurement task through the AI AGENT. Marked not delivered.

---

## 7. Receiving assistance

**Screen:** HOVIN mobile (`mobile/app/index.tsx`).

**Status: PARTIAL.** The receiving queue and scanner exist and the session gate
fails closed. No AI receiving assistance is implemented.

---

## 8. Unified notification service

**Screen:** none yet — no inbox component. `GET|POST /api/v2/notifications`
returns the list and unread count.

**Data source:** `Notification` + `NotificationPreference`.

**Status: BUILT.** `lib/notifications/service.ts` persists before delivery,
enforces preferences, refuses cross-tenant recipients, and reports SMS /
WhatsApp honestly as "recorded but not sent" (no provider wired). Wired into
order transitions via `lib/orders/notify.ts`. Acceptance tests:
`tests/p0/notification-service.spec.ts` (10/10),
`tests/p0/order-transition-notifications.spec.ts` (10/10).

**Missing:** inbox UI; SMS/WhatsApp providers; escalation policy.

---

## 9. Firecrawl catalogue ingestion

**Screen:** none — operator tooling.

**Route:** `POST /api/v2/catalog/import`; script `scripts/catalog/firecrawl-pilot.mjs`.

**Status: BUILT.** Extraction, normalization, dedupe by `sourceHash`, price
required for import, records land as `ECOMMERCE` / `INACTIVE` / unverified and
can never reach the buyer catalogue without human verification.

**Acceptance tests:** `tests/p0/firecrawl-catalog-pipeline.spec.ts` (12/12),
`tests/p0/firecrawl-catalog-import.spec.ts` (10/10).

**Live pilot result (honest):** 3 real Egyptian supplier URLs crawled, **0
importable products** — the sites either block direct fetch (403) or render
products client-side. A `FIRECRAWL_API_KEY` is required for real coverage; no
key is configured. No genuine product pages or images have been rendered in HV.

---

## Summary

| Capability | Status |
|---|---|
| AI AGENT chat + tool/field authorization | VERIFIED (live end-to-end) |
| Provider-independent model access | VERIFIED |
| Virtual Ghost engine + API | BUILT-NOT-WIRED |
| Virtual Ghost UI | MISSING |
| Role prompts | VERIFIED |
| Arabic prompts / bilingual onboarding | MISSING |
| Authorized procurement task demo | MISSING |
| Receiving assistance | PARTIAL |
| Unified notification service | BUILT (no inbox UI) |
| Firecrawl ingestion pipeline | BUILT (no key; 0 live products) |
| Four-role order journey | VERIFIED (real order traced) |
