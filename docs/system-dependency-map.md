# HotelsVendors System Dependency Map

**Generated:** 2026-09-15
**Directive §27:** For every capability — upstream deps, downstream consumers, data, APIs, models, indexes, workers, agents, permissions, evidence, UI, tests, ops deps.

---

## 1. Procurement / Orders

| Dimension | Value |
|---|---|
| Upstream | Auth/session, hotel + supplier onboarding, product catalog, credit gate |
| Downstream | Invoicing, ETA, factoring, logistics (GRN), accounting ledger, audit |
| DB Models | Order, OrderItem, OrderApproval, Hotel, Supplier, Product, AuthorityRule |
| APIs | `api/v1/orders/*`, `orders/[id]/approve|reject|evaluate|smart-fix|status` |
| Workers | `lib/orders/queue.ts` |
| Permissions | `requirePermission(ctx, "orders:*")` per RBAC; Authority Matrix gate |
| Evidence | Order approval chain + tamper-proof audit log |
| UI | `(dashboard)/orders/*`, `(dashboard)/hotel/order/`, `(dashboard)/supplier/orders/*` |
| Tests | vitest configured; coverage absent |
| Verdict | CONNECT — authority matrix real; payment-guarantee gate enforced |

## 2. Invoicing / ETA

| Dimension | Value |
|---|---|
| Upstream | Delivered orders (POD), EtaCredential per tenant |
| Downstream | Factoring eligibility (validator gate), supplier payment, audit |
| DB Models | Invoice, EtaCredential, EtaDeadLetterJob, DocumentProcessing |
| Services | `lib/eta/client|signer|xml-generator|canonicalizer|queue|dead-letter|validator|tax-codes` |
| APIs | `api/v1/eta/submit|status|callback`, `invoices/[id]/eta-submit` |
| Workers | `lib/workers/eta-verification.worker.ts` |
| Permissions | `eta:*` role-gated; G4 — zero UI exposure of payloads/keys |
| Evidence | ETA UUID, digital signature, submission log |
| UI | `(dashboard)/eta-compliance`, `(dashboard)/invoices` (status only) |
| Ops | Dead-letter queue + retry; ETA sandbox vs production env flag |
| Verdict | CONNECT + VERIFY — preprod env must never render "verified" badge |

## 3. Factoring / Fintech

| Dimension | Value |
|---|---|
| Upstream | ETA-accepted invoice, risk engine score, Authority Matrix payment gate |
| Downstream | Credit ledger, payments, TCP report, hotel dashboard, admin fees |
| DB Models | FactoringRequest, FactoringCompany, CreditFacility, CreditTransaction, OlivCreditFacility, JournalEntry, LedgerEntry |
| Services | `fintech/factoring-bridge`, `oliv-bridge`, `fee-calculator`, `hub-revenue`, `risk-engine`, `accounting-ledger`, `credit-gate` |
| APIs | `api/v1/factoring/*`, `api/v1/fintech/*`, `api/v1/oliv/*` |
| Workers | `lib/workers/fra-factoring.worker.ts`, `lib/factoring/queue.ts` |
| Permissions | `factoring:*`; dual-auth overrides; non-recourse only |
| Evidence | Anti-bypass layers 1-3 (referral token, webhook listener, CRM attribution) |
| UI | `(dashboard)/factoring/*`, `(dashboard)/hotel/financing`, `(dashboard)/supplier/financing` |
| Verdict | CONNECT — HV never holds cash (legal invariant preserved) |

## 4. Logistics / Shipping

| Dimension | Value |
|---|---|
| Upstream | Confirmed orders, hub locations, carrier profiles |
| Downstream | GRN, ETAs to buyer UI, cost matrix, savings calculator |
| DB Models | Trip, TripStop, LogisticsHub, ConsolidatedOrder, GoodsReceiptNote, CarrierProfile |
| Services | `logistics/cost-matrix|providers|assign|grn|tracking`, `shipping/corridor-engine|dock-scheduler` |
| APIs | `api/v1/shipping/*`, `api/v1/logistics/*`, `api/v1/grn/*` |
| Permissions | `shipping:*` carrier-scoped |
| UI | `(dashboard)/shipping`, `(dashboard)/deliveries`, `(dashboard)/carrier` |
| Verdict | CONNECT — consolidation math feeds Storage-to-Revenue narrative |

## 5. Intelligence Layer

| Dimension | Value |
|---|---|
| Upstream | Sourcing/scrapers (`lib/sourcing/*`), lead capture, internal events (orders, invoices, trips) |
| Downstream | Lead scoring, outreach, role-tailored dashboards, admin control plane |
| DB Models | Lead, OutreachLog, MarketInsight, Competitor, AgentRun, SwarmJob, SwarmMemory, SwarmEvent |
| Services | `intelligence/core|adaptive|graph|findings`, `crm/lead-scoring`, `outreach/*` |
| APIs | `api/intelligence/*` (LEGACY FLAT — violates G9), `api/v1/intelligence/*` |
| Permissions | `intelligence:*`; evidence classification OBSERVED→AUTHORIZED |
| UI | `(dashboard)/intelligence/*` (11 pages exist) |
| Verdict | REPAIR — `app/api/intelligence/*` flat routes breach G9; migrate to v1 |

## 6. Agents / Swarm

| Dimension | Value |
|---|---|
| Upstream | BullMQ + Redis, Ollama/Groq model router, tenant context |
| Downstream | SwarmMemory, SwarmEvent, approvals, audit |
| DB Models | AgentRun, SwarmJob, SwarmMemory, SwarmEvent, ModelHealth |
| Services | `lib/agents/*` (11 files), `lib/swarm/*` (4 files) |
| APIs | `api/v1/agents/*`, `api/agos/llm` (legacy flat) |
| Permissions | Agent kill switch, approval gates (`requiresApproval` on SwarmJob) |
| UI | `(dashboard)/agents`, `(dashboard)/jarvis` |
| Verdict | CONNECT — agents must not invent findings without evidence refs (Mandate §5) |

## 7. Identity / Auth / Tenancy

| Dimension | Value |
|---|---|
| Upstream | Registration, OTP, email verification |
| Downstream | EVERY query (tenant scope), RolePermission, sessions |
| DB Models | User, Tenant, Role, Permission, RolePermission, RefreshToken, OtpVerification, ConsentRecord |
| Services | `auth/session|server-auth|rbac|otp|four-eyes`, `tenant/scope` |
| APIs | `api/v1/auth/*`, `api/v1/consent/*` |
| Permissions | Server-side only; middleware-gated route groups |
| Verdict | KEEP — G1/G2 aligned. Confirm no client role-context file remains |

## 8. Marketing / Acquisition

| Dimension | Value |
|---|---|
| Upstream | Lead discovery (intelligence), campaigns |
| Downstream | CRM conversion, outreach logs, marketplace signups |
| DB Models | SocialCampaign, SocialPost, SocialAudience, Lead, LeadCapture, WaitingListEntry |
| APIs | `api/v1/marketing/*`, `api/v1/leads/*`, `api/v1/crm/leads/*` |
| UI | `(dashboard)/marketing/*` |
| Verdict | REPAIR — scheduled posts ≠ published; mark status honestly (§24) |

## 9. Admin Control Plane

| Dimension | Value |
|---|---|
| Upstream | All domains (reads) + override authority |
| Downstream | AuditLog, escalated alerts, freeze/unfreeze credit |
| APIs | `api/v1/admin/*` (30+ endpoints incl. control-center) |
| Permissions | ADMIN platform role; dual-auth for overrides |
| UI | `(admin)/admin/*` (5 pages — thin vs §21 scope) |
| Verdict | EXTEND — surfaces exist; agent/evidence/kill-switch views incomplete |

## 10. Mobile

| Dimension | Value |
|---|---|
| Current | Push token API only (`api/v1/notifications/push-token`) |
| HOVIN | Marketing showcase only — not a native app |
| Verdict | Classify **D/E** in integrity matrix; do NOT market as live app |

---

## Dependency Reconciliation (Post P0 Gate) — Directive §5

Every dependency from the map above is now classified.

| Domain / Capability | Classification | Justification |
|---|---|---|
| Procurement / Orders | VERIFIED CURRENT | Authority matrix + audit log + DB models active |
| Invoicing / ETA | VERIFIED CURRENT (with VERIFY) | Client/signature exist; sandbox/prod env flag must be enforced |
| Factoring / Fintech | VERIFIED CURRENT | Non-custodial invariant preserved |
| Logistics / Shipping | VERIFIED CURRENT | Consolidation + cost matrix real |
| Intelligence (core) | PARTIAL — REQUIRED FOR NEXT TARGET | Acquisition exists; no EvidenceRecord / graph / index |
| Agents / Swarm | VERIFIED CURRENT (with MONITOR) | BullMQ + model router; agent-evidence link needs enforcement |
| Identity / Auth / Tenancy | VERIFIED CURRENT | RBAC real; client-side role-switch removed |
| Marketing / Acquisition | PARTIAL — VERIFY CLAIMS | Social integration claims must be real |
| Admin Control Plane | PARTIAL — VERIFIED CURRENT for freeze/resolve; NEXT TARGET: agent/evidence dashboards | Surfaces exist; kill-switch / agent-state / evidence views incomplete |
| Mobile | DEFERRED / NOT JUSTIFIED (P4) | HOVIN showcase only; no native app |
| Intelligence Spine (P1) | NEXT TARGET (not P0) | Evidence model → graph → indexes → need detect → opportunity match |

---

## P1 Candidate Categories (Post P0 Gate) — NOW / NEXT / LATER / DEFER / REJECT

| Candidate / Subsystem | Category | Evidence / Blocker |
|---|---|---|
| EvidenceRecord DB model + migration | **NEXT** | Required for graph, need detection, audit; no simulated evidence |
| IntelligenceEdge / temporal graph | **NEXT** | Depends on EvidenceRecord; graph temporal validity |
| Change Index / Temporal Index | **LATER** | Depends on event sourcing; continuous monitoring |
| Pain Index / Need Detection | **NEXT (after Evidence)** | Depends on evidence chain + graph |
| Opportunity Matching / Smart Approach | **LATER** | Depends on Need Detection |
| TrustClaim model / verified badges | **NEXT** | Only mechanism needed for P0 claim audit; not full subsystem |
| Change detection / continuous monitoring | **DEFER** | Not needed for MVP; requires temporal index |
| Full vector / search index layer | **REJECT** | Not needed for current intelligence pipeline |
| Native mobile app | **DEFER** | Showcase only |
| Marketing automation (scheduled=real) | **NEXT** | Verify real integrations first |

---

## Final Gate Status — Read-Only Confirmation

- P0 integrity audit completed: claims audited, contradiction documented, routes mapped, matrix reconciled.
- §28 `docs/required-findings-inventory.md` created as standalone artifact.
- §27 dependency map reconciled (VERIFIED CURRENT / NEXT / LATER / DEFER / NOT JUSTIFIED / REJECT).
- No P1 implementation started.
- No deployment or architecture change made.

### Blocked (must resolve before P1 authorization):
1. `logistics-service/page.tsx` lines 33/45: "Paid in 4 Hours" contradiction with 48h locked truth.
2. Trust bar lines 121/143 (`suppliers/join`, `hotels`): "FRA Licensed" needs explicit Oliv attribution; EGP 30M Facility is partner-specific.
3. `docs/required-findings-inventory.md` must not be treated as complete — it is a living document updated with every finding.
