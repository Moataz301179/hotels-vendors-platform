# Product Capability Integrity Matrix

**Directive §29** | Classes: A=Production operational, B=Implemented-not-e2e-verified, C=Partial, D=Demo/simulated, E=Planned, F=Missing, G=Compromised

| # | Capability | Class | Evidence | Blocker / Next Action |
|---|---|---|---|---|
| **IDENTITY & SECURITY** |
| 1 | Multi-tenant DB isolation (tenantId on all models) | A | schema.prisma uniform tenantId; `lib/tenant/scope.ts` | Keep enforcing in every new query |
| 2 | Server-side RBAC (Role/Permission/RBAC matrix) | B | `lib/auth/rbac.ts`, middleware | Add e2e test proving client can't escalate |
| 3 | Authority Matrix order gating | A | `lib/auth/authority-matrix.ts`; paymentEtaGate always-on | Built-in rules OK; seed tenant rules |
| 4 | Four-eyes / dual-auth admin override | A | `authority-matrix.ts adminOverride` dual signature + audit | Alert dispatch TODO (line ~581) |
| 5 | Tamper-proof audit log | B | `lib/audit/tamper-proof.ts` hash chain | Verify chain validation job exists |
| 6 | OTP/2FA auth | B | `lib/auth/otp.ts`, totpSecret on User | E2E login test |
| 7 | CSRF + rate limiting + idempotency | B | `lib/security/*` (csrf, rate-limiter, idempotency) | Confirm middleware order applies to all v1 routes |
| 8 | Client-side role switching removed | ? | Directive says deprecated role-context must be gone | **AUDIT: grep for role-context/localStorage role** |
| **COMPLIANCE (ETA/FRA)** |
| 9 | ETA e-invoice client + signer | B | `lib/eta/*` (client, signer, xml-generator) | Confirm env flag — sandbox vs prod |
| 10 | ETA dead-letter queue + retry worker | A | `eta/dead-letter.ts`, `workers/eta-verification.worker.ts` | Monitor failure volume |
| 11 | ETA factoring eligibility gate | A | `lib/eta/validator.ts` consumed by authority-matrix | — |
| 12 | FRA license modeling | C | `lib/compliance/fra-license.ts` | Must render as "referral/internal", not "licensed" unless evidence |
| 13 | Trust claim evidence model (§19) | F | No CLAIM→ISSUER→EVIDENCE→EXPIRY schema yet | **P0 build: TrustClaim model** |
| 14 | Simulated badges on marketing | ? | Marketing pages: fra-shield, compliance, vat-invoicing | **AUDIT P0: scan for implied-verified UI copy** |
| **FINTECH** |
| 15 | Fee calculator (tiered 2.5→1.5%, fee-before-factor) | A | `fintech/fee-calculator.ts` + `hub-revenue.ts` | — |
| 16 | Risk engine + Smart Fix autonomy | A | `risk-engine.ts` (5 fix types) | Bias check hook present |
| 17 | Factoring bridge (non-custodial) | A | `factoring-bridge.ts` — HV never holds cash | — |
| 18 | Oliv bridge (real + mock fallback) | B | `oliv-bridge.ts` | Mock must be labeled in non-prod only |
| 19 | Anti-bypass layers (token/webhook/CRM) | B | `fintech/anti-bypass/*` | Integration test per layer |
| 20 | Accounting ledger / journal entries | B | `fintech/accounting-ledger.ts`, JournalEntry model | Reconciliation report |
| **INTELLIGENCE (P1 SPINE)** |
| 21 | Acquisition adapters (Firecrawl/Apify/direct) | C | `lib/sourcing/*` — scraper, apify, wc-sources | No task-driven "question→evidence" router (§4) |
| 22 | Evidence store w/ hash + provenance | C | `IntelligenceAssertion` types exist; no Evidence DB model | **P1 build: EvidenceRecord model + migration** |
| 23 | Entity resolution engine | C | `graph/entity-resolution.ts` (structural, in-memory) | **P1: persist resolution decisions** |
| 24 | Hotel Intelligence Graph | C | Relational models exist; no explicit graph edges w/ temporal validity | **P1: IntelligenceEdge/Node tables** |
| 25 | 15 intelligence indexes (§7) | F | Only partial relational indexes | **P1: implement computable subset first (pain/opportunity/need)** |
| 26 | Need Detection engine (§8) | F | No ENTITY→PAIN→NEED→SOLUTION pipeline | **P1 build** |
| 27 | Opportunity Matching engine (§10) | F | — | **P1 build (depends on 26)** |
| 28 | Role-tailored intelligence packaging (§9) | F | — | **P1 build** |
| 29 | Smart Approach Engine (§11) | C | `outreach/os.ts`, lead-scoring exist; no WHY-NOW evidence package | **P2 build** |
| **AGENTS** |
| 30 | Swarm orchestrator + BullMQ queues | B | `agents/swarm-orchestrator.ts`, `lib/queues/*` | Redis required in prod env |
| 31 | Model router (Ollama→Groq→OR) | B | `swarm/model-router.ts`, ModelHealth | Confirm Ollama reachable on VPS |
| 32 | Agent evidence/backing on findings | C | AgentRun stores output | Enforce: no finding without evidence ref |
| 33 | Continuous monitoring/change detection (§17) | F | No scheduler diffing entity state | **P3 build** |
| **COMMERCIAL SPINE** |
| 34 | Marketplace/catalog/cart/checkout | A | storefront + cart + checkout APIs | — |
| 35 | Logistics consolidation (hubs/trips/stops) | B | `logistics/*`, `shipping/*` + models | Verify GRN closes order loop |
| 36 | CRM leads + outreach | B | Lead, OutreachLog, `crm/lead-scoring.ts` | dataClassification field exists (SEED_DEMO) — **use it honestly in UI** |
| 37 | Notifications pipeline (§20) | C | email/whatsapp/queue + push tokens | No RULE→SEVERITY router |
| 38 | Marketing social publishing | C | SocialCampaign/Post models + APIs | Scheduled ≠ published; verify real integrations before claims |
| **ADMIN & OPS** |
| 39 | Admin control center (freeze/resolve/retry) | B | `api/v1/admin/control-center/*` | UI extend: agent/evidence/kill-switch views |
| 40 | Observability (Sentry, pino) | B | `lib/sentry.ts`, `lib/logger.ts` | Dashboards on VPS |
| 41 | Mobile app | D | HOVIN showcase only | Label as showcase; native roadmap P4 |
| 42 | Tests | C | vitest + playwright configured | Coverage near zero — add gate in CI |

---

## P0 Blockers (fix before any new feature)
1. **§14 audit**: grep marketing/dashboard copy for compliance badges implying verified production state; wrap behind claim-evidence check.
2. **TrustClaim model** (row 13) so badges render ONLY from data.
3. **Role-context purge** (row 8) — confirm zero client-side role switching.
4. **Lead.dataClassification** must be visible in UI (SEED_DEMO vs LIVE) wherever leads render.

## P1 Spine (build order)
EvidenceRecord model → entity resolution persistence → graph edges → pain/opportunity computable indexes → need detection → opportunity matching → role-tailored packaging.
