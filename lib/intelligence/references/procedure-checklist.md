# Adaptive Intelligence — Procedure Checklist (§27 A-J execution, §25 autonomous)

## Before Any Build (Locked)
1. Confirm strategic direction: PRIMARY = Security/Exposure (C); SECONDARY = Intelligence Subscriptions (A); PROTECTED = Procurement (B). Locked in `DECISION_2026-09-13_MONETIZATION.md`. No strategic simplification (§27, §24).
2. Confirm authorization scope (§11) if assessment goes beyond PASSIVE / PUBLIC_DOCUMENT. `security/authorized-testing.ts`: `scopeId` registered with `authorizedBy`, `permittedActions`, `auditOnly`.

## Per Feature — Ordered Build (Don't Skip Steps)

- A. Capability Map (§27A): Document what external surfaces are observable (§5 — web/app/AI/document/technical/human/third-party) before writing adapter.
- B. Source Map (§27B): Confirm adapter fits `core/adapters/spec.ts` (§13). Source disappearance must not break architecture.
- C. Graph Spec (§27C, §15): Confirm nodes/relationships needed (§12). `relationship-discovery.ts`: only evidence-backed relationships added.
- D. Finding Taxonomy (§27D): Confirm taxonomy covers finding (§4 `findings/taxonomy.ts`). If not, extend taxonomy FIRST — don't add one-off categories.
- E. Value Map (§27E): Confirm impact range shown with `basis` (§10). No fabricated savings (§26).
- F. Acquisition Engine (§27F): Confirm proposition uses evidence + reasoning (§9) — not generic pitch.
- G. Monetization (§27G): Confirm mechanism aligns with locked ranking (§6 docs).
- H. Competitive Moat (§27H): Confirm replication barrier (§22). Security assessment (C) = authorization-controlled; subscriptions (A) = graph density improves over time.
- I. MVP (§27I): Confirm excluded items (§24). Full graph DB, full adapter set, full automation — production architecture only (§27J docs).
- J. Production Architecture (§27J): Confirm G1-G11 compliance (§3 docs master). `tenantId`, RBAC (`requirePermission`), audit log (`AuditLog`), no client-side secrets (§G2), authorization scope (§11), evidence integrity hash (§21).

## Adaptive Loop (§4, §8) — Every Investigation Cycle

Per cycle (not full crawl — §20 cost/freshness/reliability):
1. `AdaptiveInvestigationEngine.runCycle()` (§4 loop): observe → understand → generate hypothesis → collect (with authorization check at depth > 2) → extract (taxonomy match) → resolve entities (§14 strict) → evaluate significance (§14 temporal) → generate new seeds (§8 window-expansion).
2. `WindowExpansionEngine.expandFromFinding()` (§8): finding category → new seeds (max 3) → new windows (§7 exposure windows). Not crawler — graph follower.
3. `EntityResolutionEngine.resolve()` (§14): strict mode (confidence ≥ 0.7, no contradictions, multiple signals). Low-confidence = HYPOTHESIS (§10), not FACT.
4. `TemporalIntelligenceService.recordObservation()` (§14): previous/current state + change significance. Historical signals reveal patterns current-state misses.
5. `RelationshipDiscoveryEngine.discoverRelationship()` (§12): evidence-backed only (hash + confidence ≥ 0.5). No fabricated links (§26).
6. `DocumentIntelligencePipeline.processDocument()` (§10): structural pipeline stages (DISCOVER → ACQUIRE → PARSE → ... → STORE_EVIDENCE). No fabricated extraction (§26).
7. `SecurityIntelligenceController.evaluateFinding()` (§11): authorization scope verified. Non-passive without scope = BLOCKED.

## Anti-Fabrication Check (§26) — Before Any Finding Delivery
- Source provenance present (`core/types.ts` `SourceProvenance`)?
- Evidence hash present?
- InferenceType = `FACT` / `INFERENCE` / `HYPOTHESIS`? (Not `INFERENCE` labeled as `FACT` — mechanism is over-certainty.)
- Impact estimate shows `low`/`high` range + `basis` (§10)? (Not single fabricated number — mechanism is false precision.)
- Authorization scope verified for non-passive? (§11 — mechanism is unauthorized assessment.)
- Entity resolution confidence shown, separate from assertion confidence? (§14 — mechanism is false identity propagation through graph.)

If ANY check fails: document gap / label HYPOTHESIS / request authorization (§26). Never fabricate (§26 absolute).
