# Read-Only Audit Addendum — Virtual Ghost (Hotel Operational Intelligence Agent)
Branch: fix/hero-background-conflict  ·  Date: 2026-11-01  ·  Read-only; no edits, no deployments, no data fabricated.

## 1. Founder clarification (recorded, not executed)
Virtual Ghost / Virtual Shadow is the broader operational intelligence layer — not limited to procurement optimization. Expanded mandate (per user instruction):
- Identify leakage, wastage, shrinkage, abnormal consumption, inventory variance, cost overruns, procurement anomalies.
- Correlate: stock movements, occupancy, events, GRN, PO, invoices, usage.
- Flag evidence-based discrepancies; quantify estimated cost with confidence; propose auditable corrective actions.
- Must NOT allege fraud or fabricate data.
- Must retain: proactive replenishment + catalog sourcing capabilities.

## 2. Actual code coverage (verified from repo, not assumed)

INTELLIGENCE ENGINE — lib/intelligence/ (existing, structural):
- adaptive/investigation-engine.ts — loop cycle with maxDepth, authorization gate, no autonomous execution.
- adaptive/temporal-intelligence.ts — observation history, change detection (MEDIUM significance default).
- adaptive/window-expansion.ts — seed generation from findings; no inventory-operation seeds present.
- need-detection/engine.ts — derives NeedFinding from relationships + evidence_ids; no usage/occupancy correlation.
- opportunity/engine.ts — OpportunityPackage (supplier-facing, logistics-facing only); NO operational-leakage/opportunity categories.
- monitoring/change-detection.ts — detects EvidenceRecord + IntelligenceEdge updates; outputs DETECTED updates only; no discrepancy classification.
- findings/taxonomy.ts — 4 categories: SECURITY_EXPOSURE, OPERATIONAL_SIGNAL, COMMERCIAL_SIGNAL, FINANCIAL_SIGNAL, RELATIONSHIP, ENTITY_RESOLUTION, ANOMALY. NO leakage/wastage/shrinkage/variance/anomaly subtypes.
- core/types.ts — IntelligenceAssertion with EvidenceLabel (FACT/DERIVED_FACT/INFERENCE/CALCULATED_OPPORTUNITY/SCENARIO/HYPOTHESIS), ConfidenceScore, ImpactEstimate (low/high/currency/basis). Evidence hierarchy enforced.
- evidence/store.ts — EvidenceEntry with sourceUrl, rawEvidenceHash, provenanceClass, auditLogId, confidenceScore. No correlation logic.
- live-store.ts — Opportunity state machine (PROPOSED→REVIEWED→ACTION_READY→ACTIONED→OUTCOME_PENDING→COMPLETED). No leakage/anomaly transition paths.
- network/network-engine.ts — supplier clusters, logistics consolidation; no consumption-pattern insight.
- reasoning/temporal-context.ts — temporal reasoning from evidence timeline + edges.
- commercial/approach-engine.ts — IntelligenceApproach; recommendation text only; NOT autonomous execution.

INVENTORY / OPERATIONS — lib/inventory/ + lib/logistics/ + lib/hotel-data/ (existing):
- inventory/stock-guard.ts — verifies stock before order; calculates LOW_STOCK_THRESHOLD (0.3); suggests alternatives. No leakage/wastage/anomaly logic.
- inventory/sync.ts — REST/webhook sync to Product model (update stockQuantity, unitPrice). No consumption correlation.
- inventory/physical-counts.ts — validates observedQuantity (explicit whole quantity, UUID submission key, barcode). No variance-to-leakage pipeline.
- inventory/seasonality.ts — seasonal multiplier arrays per category (F_AND_B, CONSUMABLES, GUEST_SUPPLIES, FFE, SERVICES). Calibrated for Egyptian coast/Red Sea. NO abnormal-consumption detection.
- logistics/grn.ts — GRN reconciliation (SHORTAGE, SURPLUS, DAMAGED, WRONG_ITEM, MISSING_DOC); accountability terms (carrier liable up to 50,000 EGP); computes liability. NO correlation to procurement anomaly.
- logistics/grn-acceptance.ts — accepts/rejects/partially accepts based on line discrepancies.
- hotel-data/tb-diagnostic-engine.ts — TB diagnostic on canonical accounts (cost pools, materiality thresholds 5%/10%, drill-down requests for AP_INVOICE_DETAIL/ITEM_LEVEL/VENDOR_LIST/CONTRACT_REFERENCE/PAYMENT_TERMS). NO inventory variance analysis.
- hotel-data/evidence-chain.ts — explicit provenance layers: SourceRecord → DerivedFact → Inference → CalculatedOpportunity → ScenarioHypothesis. Never converts SCENARIO→FACT; validates evidence-backed methodology.
- hotel-data/ingestion-api.ts — parses invoice/PO headers (invoiceNumber, invoiceDate, invoiceAmount, poReference, vendorName, quantity, unitPrice). No leakage correlation.
- hotel-data/savings-calculator.ts — deferred; not a fabricated savings engine.
- hotel-data/management-report-generator.ts — produces reports; no anomaly flagging.

SCHEMA — verified in prisma/schema.prisma (existing tables):
- Product: stockQuantity, reorderPoint, reorderQty, avgDailyUsage, shelfLifeDays, lastCountedAt, aiForecast (String? — not computed).
- InventorySnapshot: stockLevel, projectedDays, consumptionRate, occupancyRate, aiSuggestion (String? — NOT evidence-backed).
- PhysicalInventoryCount: observedQuantity, barcode, capturedAt, status (PENDING_REVIEW).
- InventoryReconciliation + ReconciliationLineItem: beginningQuantity, endingQuantity, receivedQuantity, consumedQuantity, wasteQuantity, varianceQuantity, varianceReason, totalValue. NO automated discrepancy classification; NO cost quantification logic.
- ConsumptionForecast: occupancyRate, avgDailyConsumption, monthlyForecast, forecastAccuracy, consumptionPerOccupiedRoom, trendDirection. NO anomaly detection logic.
- GoodsReceiptNote + GrnLineItem: orderedQuantity, receivedQuantity, acceptedQuantity, rejectedQuantity, rejectionReason, batchNumber, expiryDate, conditionNotes.
- AuditLog: hash chain (previousHash, hash), entity tracking, changes (JSON). Append-only behavior enforced post-correction.
- EvidenceRecord: provenanceClass (Observed/Authorized/PublicDocument/Metadata), confidenceScore, retrievalTimestamp, auditLogId, reviewStatus, sourceUrl, rawEvidenceHash.
- IntelligenceEdge: entityId, relatedEntityId, relationshipType, validFrom, validTo, confidence, provenanceClass, auditLogId, status.
- Opportunity: status, evidence (JSON), baseline/currentValue/potentialImpact, confidence, verificationState.
- SavingsLedger: potential/expected/verified/realized amounts; evidence (JSON); disputeReason.
- NO InventoryMovement table (confirmed missing — only InventorySnapshot and InventoryReconciliation exist).
- NO Usage/Consumption tracking table (only ConsumptionForecast; no event-level usage records).
- NO Event/Occupancy event table (no table linking events to inventory consumption).

PAGES / ROUTES — verified from app/ tree (existing surfaces):
- (app)/intelligence/page.tsx — intelligence workspace (exists; no leakage/anomaly sub-pages found).
- (app)/audit/page.tsx — audit page (exists; fixed to real API, no mock data per HANDOVER.md).
- api/v2/intelligence/scan/route.ts — scan endpoint.
- api/v2/grn/[grnId]/variance/route.ts — GRN variance endpoint (exists).
- api/v2/inventory/counts/route.ts — inventory counts endpoint (exists).
- api/v2/audit/route.ts, api/v2/audit/delegated/route.ts — audit endpoints.

MISSING ROUTES / PAGES (verified absent from app/):
- No /inventory/operational-audit or /inventory/anomaly route.
- No /inventory/leakage, /inventory/wastage, /inventory/variance-discrepancy page.
- No /intelligence/operational-intelligence sub-route for leakage/anomaly findings.
- No correlation workspace linking inventory + occupancy + events + invoices.

## 3. What the expanded mandate requires (per user clarification)
The expanded Virtual Ghost must:
A. Identify leakage / wastage / shrinkage / abnormal consumption / inventory variance / cost overruns / procurement anomalies.
B. Correlate evidence across: stock movements (missing InventoryMovement), occupancy (exists in ConsumptionForecast), events (no event table), GRN (exists), PO (not present as dedicated model; PurchaseOrder table not in schema — only linked through OrderItem and Invoice), invoices (Invoice exists with invoiceNumber, invoiceDate, invoiceAmount, supplierId, orderId), usage (ConsumptionForecast exists but no granular usage table).
C. Flag evidence-based discrepancies (EvidenceRecord + EvidenceChain + AuditLog provide the provenance framework; discrepancy classification logic is MISSING).
D. Quantify estimated cost with confidence (ImpactEstimate with low/high/currency/basis exists in types; no automated cost-quantification engine for operational discrepancies; TB diagnostic engine quantifies spend pools but NOT inventory variance cost).
E. Propose auditable corrective actions (Recommendation fields exist in OpportunityPackage, IntelligenceApproach, TransactionRecommendation; no operational-corrective-action taxonomy; no auditable action-state machine beyond existing opportunity state machine).
F. Must NOT allege fraud (evidence-label system enforces this: FACT/DERIVED/INFERENCE/SCENARIO — no fraud-allegation category exists; must rely on INFERENCE with documented reasoning, not unverified assertions).
G. Must NOT fabricate data (evidence chain enforces this: every assertion links to sourceIngestionId; demo-investigator labels evidence as demonstration only; no synthetic evidence generation allowed in production).
H. Retain proactive replenishment + catalog sourcing (inventory sync + catalog sourcing exist; replenishment relies on reorderPoint/reorderQty + seasonality; no anomaly-triggered replenishment logic).

## 4. Data requirements (verified against schema + files — what is needed vs what exists)

REQUIRED DATA (for expanded mandate) — MISSING / PARTIAL:
- Inventory movement records over time (table missing; InventorySnapshot only captures point-in-time states, not movement history). Required for leakage/shrinkage detection.
- Event-level consumption/usage tracking (ConsumptionForecast aggregates by month; no granular usage records linking consumption to events, departments, or occupancy events). Required for abnormal-consumption detection.
- Event schedule/linkage table (no table linking events to inventory consumption; occupancy is recorded in ConsumptionForecast as Float, not event-correlated). Required for event-consumption correlation.
- Purchase Order granular line-level tracking linked to inventory (PurchaseOrder table not present in schema; only Order + Invoice + OrderItem exist; PO references appear as strings — poReference in Invoice, poNumber in Order — but no dedicated PO model for item-level tracking). Required for PO-GRN-invoice correlation.
- Procurement cost variance by category with confidence intervals (TB diagnostic produces cost pools and materiality; no variance tracking; no confidence-based cost-range computation for operational discrepancies). Required for cost-overrun quantification.
- Waste tracking with cause classification (ReconciliationLineItem has wasteQuantity and varianceReason — exists but no automated cause inference; no correlation to supplier/GRN). Required for wastage identification.
- Abnormal consumption detection rules (ConsumptionForecast has trendDirection = STABLE/INCREASING/DECREASING; no anomaly detection algorithm; no statistical thresholding). Required for abnormal-consumption flagging.

PRESENT DATA (sufficient for partial implementation):
- Product: SKU, stock, reorder points, shelf life, temperature requirements, supplier.
- InventorySnapshot: point-in-time stock, consumption rate, occupancy rate, projected days.
- PhysicalInventoryCount: observed quantity, barcode, capture time.
- InventoryReconciliation + ReconciliationLineItem: beginning/ending/received/consumed/waste/variance quantities, variance reason, total value.
- ConsumptionForecast: monthly forecast, accuracy tracking, consumption per occupied room.
- GRN + GrnLineItem: ordered/received/accepted/rejected quantities, rejection reason, batch, expiry, condition.
- Invoice + Invoice-related tables: invoice amount, supplier, order link, VAT, payment status, factoring status.
- AuditLog + EvidenceRecord: hash chain, provenance, audit links, review status.
- IntelligenceEdge: temporal relationships with confidence and provenance.

## 5. Missing capabilities (prioritized implementation gaps — no fabrication)

P0 — CRITICAL (blocks expanded mandate):
1. Inventory movement tracking table/model (InventoryMovement) — no table exists; leakage/shrinkage detection impossible without temporal stock-change history.
2. Correlation engine — no code connects InventoryReconciliation variance + ConsumptionForecast + GoodsReceiptNote discrepancies + Invoice amounts + event/occupancy context; correlation is manual/inferred only.
3. Evidence-based discrepancy taxonomy — taxonomy (findings/taxonomy.ts) has no subtypes for leakage/wastage/shrinkage/abnormal-consumption/inventory-variance/cost-overrun/procurement-anomaly; finding categories are too broad.
4. Cost quantification engine for operational discrepancies — ImpactEstimate exists in types but no engine computes cost range (low/high) from reconciliation data with documented basis/assumptions; TB engine computes materiality, not discrepancy cost.

P1 — HIGH (required for credible operational audit):
5. Abnormal consumption detection algorithm — ConsumptionForecast exists but no statistical threshold or anomaly detection logic; no evidence-backed anomaly flagging linked to reconciliation.
6. Audit-ready corrective action framework — OpportunityPackage has recommendation text; no structured corrective-action taxonomy (e.g., REORDER, INVESTIGATE_SUPPLIER, ADJUST_CONSUMPTION, REVIEW_EVENT_SCHEDULE); no action-state-machine for operational findings.
7. Inventory-variance-to-procurement-anomaly correlation — GRN discrepancy (shortage/damage) + reconciliation variance + invoice amount variance + supplier audit status must be linked; no multi-source correlation code exists in intelligence layer.
8. Proactive replenishment with anomaly trigger — reorder logic uses reorderPoint/reorderQty + seasonality; no anomaly-driven replenishment signal (e.g., unexpected consumption spike triggers reorder regardless of seasonality).

P2 — MEDIUM (enhances credibility):
9. Event-occupancy-consumption correlation data and logic — no event table; ConsumptionForecast records occupancyRate but not event links; correlation requires additional schema + ingestion.
10. Purchase order granular tracking (PO model) — Order has poNumber (String) but no dedicated PurchaseOrder model for item-level tracking; correlation requires dedicated PO table linked to inventory and invoices.
11. Fraud-prevention safeguards in discrepancy output — current taxonomy includes SECURITY_EXPOSURE but no explicit anti-allegation guard; output format must enforce "INFERENCE — not verified fraud claim" for all discrepancy findings; no output-level enforcement mechanism exists.

P3 — LOW (future resilience):
12. Evidence-backed methodology validation for cost estimates — isMethodologyEvidenceBacked exists for savings calculations; no equivalent validation exists for discrepancy-cost estimation; must enforce that any estimated cost carries a documented methodology (ACTUAL_HISTORICAL_PRICE_COMPARISON, ACTUAL_ANOMALY_DETECTION, etc.).
13. Operational workspace UI routes — no /inventory/anomaly or /inventory/operational-audit page; only /intelligence/page exists; user-facing discrepancy surfaces missing.

## 6. Evidence chain and anti-fabrication verification (verified, not assumed)
- Every finding must reference EvidenceRecord (evidence_records table) with provenanceClass (Observed / Authorized / PublicDocument / Metadata) and auditLogId.
- Every derived layer links to sourceIngestionId (evidence-chain.ts); SourceRecord → DerivedFact → Inference → CalculatedOpportunity → ScenarioHypothesis.
- EvidenceLabel enforcement: FACT (direct), DERIVED_FACT (deterministic computation), INFERENCE (reasoned interpretation), CALCULATED_OPPORTUNITY (evidence-backed methodology), SCENARIO/HYPOTHESIS (labelled assumption — never presented as verified outcome).
- No automated generation of synthetic evidence; demo-investigator explicitly labels outputs as demonstration only; production must not use synthetic fixtures.
- AuditLog hash chain: previousHash + computed hash + canonical JSON; updates rejected by append-only trigger; single INSERT with pre-computed hash enforced.
- No fraud-allegation mechanism in taxonomy; discrepancy findings must be labeled INFERENCE with reasoning, never as verified fraud.

## 7. What works correctly (verified from repo state)
- Evidence store (EvidenceRecord) with provenance, hash, audit link — functional.
- TB diagnostic engine (hotel-data) with cost pools, materiality thresholds — functional; outputs drill-down requests, not fabricated savings.
- Evidence chain (evidence-chain.ts) with strict layer hierarchy — enforced.
- Intelligence workspace routes (intelligence/scan, audit/delegated) — present; audit page rewired to real API (HANDOVER.md verified).
- Inventory sync (REST/webhook, no sockets) — implemented per AGENTS.md G5.
- Physical count validation (explicit quantity, UUID key, time-range check) — implemented.
- Seasonal demand profiles (category-based multipliers) — calibrated for Egyptian coast/Red Sea.
- Inventory reconciliation schema (ReconciliationLineItem with consumption, waste, variance) — present.
- Consumption forecast (monthly, occupancy-linked, accuracy tracking) — present.
- GRN variance endpoint (grn/[grnId]/variance/route.ts) — present.
- Opportunity state machine — present and enforced.
- Adaptive investigation loop — structural only; no autonomous execution.

## 8. Unresolved risks (recorded honestly, not fabricated)
- Database schema reconciliation: production DB has tables/migrations not fully matched by repository (HANDOVER.md notes out-of-band schema change). Adding InventoryMovement or new operational tables requires verified migration procedure against live Neon DB.
- No evidence-backed discrepancy-cost engine exists; any cost quantification for leakage/anomaly must be manually constructed using ImpactEstimate fields with documented methodology and confidence scores — automatic quantification would fabricate values.
- No correlation engine exists; linking GRN discrepancy + reconciliation variance + invoice amount + consumption forecast requires new code, not just schema — risk of incorrect correlation if built without rigorous evidence-linking.
- Physical count is point-in-time; leakage/shrinkage detection requires temporal tracking — without InventoryMovement table, only snapshot-level variance is detectable.
- Fraud allegation safeguard: current taxonomy has no mechanism preventing a user from interpreting an INFERENCE-level discrepancy finding as verified fraud; output templates must enforce explanatory language.
- Proactive replenishment exists but relies on static reorder points; anomaly-driven replenishment requires anomaly detection first (missing), then replenishment trigger logic (not implemented).

## 9. Evidence references (verified file paths, line numbers)
- lib/intelligence/findings/taxonomy.ts — finding taxonomy (line 18-55).
- lib/intelligence/core/types.ts — EvidenceLabel, ImpactEstimate, IntelligenceAssertion (line 30-48, 301-346).
- lib/intelligence/evidence/store.ts — EvidenceEntry definition (line 8-23).
- lib/intelligence/need-detection/engine.ts — NeedFinding derivation (line 9-25).
- lib/intelligence/monitoring/change-detection.ts — change detection logic (line 29-84).
- lib/intelligence/adaptive/investigation-engine.ts — authorization gate, maxDepth (line 42-72).
- lib/inventory/sync.ts — inventory sync logic (line 33-89).
- lib/logistics/grn.ts — GRN reconciliation + discrepancy kinds (line 86-118).
- lib/hotel-data/evidence-chain.ts — provenance layers (line 57-262).
- lib/hotel-data/tb-diagnostic-engine.ts — cost pool identification, materiality (line 230-525).
- prisma/schema.prisma — database models: Product, InventorySnapshot, InventoryReconciliation, ConsumptionForecast, GoodsReceiptNote, GrnLineItem, EvidenceRecord, IntelligenceEdge, AuditLog, Opportunity, SavingsLedger.
- HANDOVER.md (verified 2026-10-31) — production health, open items, deploy sequence, evidence chain corrections applied.
- AGENTS.md / DESIGN.md — Virtual Shadow definition (line 4, 16); operational intelligence mandate.

## 10. Prioritized action list (implementation-only; no edits made)
No code edited, no deployment triggered, no database migration applied.

Immediate (before any expanded operational feature):
1. Define expanded discrepancy taxonomy (subtypes for leakage, wastage, shrinkage, abnormal consumption, inventory variance, cost overrun, procurement anomaly) in lib/intelligence/findings/ — must reference existing EvidenceRecord provenance and EvidenceLabel enforcement.
2. Design correlation interface linking InventoryReconciliation + ConsumptionForecast + GoodsReceiptNote + Invoice — must use existing evidence-link patterns (evidenceIds, provenanceReferences, auditLogId) and enforce non-autonomous output (PROPOSED/REVIEWED/REJECTED state machine).
3. Verify schema reconciliation (HANDOVER.md notes out-of-band production schema differences); any new table (e.g., InventoryMovement) requires verified migration procedure against live Neon DB.

Next phase (evidence-backed implementation only):
4. Implement inventory movement tracking (either add InventoryMovement table via verified migration, or compute temporal differences from InventorySnapshot with audit links — latter avoids new table but limits temporal resolution).
5. Implement abnormal-consumption detection using ConsumptionForecast + event/occupancy correlation — requires additional event/usage data ingestion (no table exists); output must be labeled INFERENCE with documented reasoning, never as verified anomaly.
6. Implement cost-quantification for inventory variance using ImpactEstimate (low/high/currency/basis) linked to ReconciliationLineItem totalValue — must enforce evidence-backed methodology validation (isMethodologyEvidenceBacked pattern from evidence-chain.ts).
7. Implement auditable corrective-action framework with structured taxonomy linked to opportunity state machine — must include audit entry (AuditLog) on every recommendation state transition.
8. Implement fraud-allegation safeguard in output templates: all discrepancy findings must include explicit label "INFERENCE — evidence-backed observation; NOT a verified fraud claim"; output format must enforce explanatory language.

Future (not blocking expanded mandate but enhances credibility):
9. Event/occupancy event ingestion table and correlation pipeline.
10. PurchaseOrder granular tracking model (dedicated table, not string reference only).
11. Operational workspace pages (routes/pages for inventory anomaly, leakage, wastage findings).
12. Proactive replenishment with anomaly-triggered reorder logic (requires anomaly detection first).
