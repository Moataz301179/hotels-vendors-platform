# Required Findings Inventory (§28)

**Status:** Living. Updated with P0 gate results. Not replaced by Integrity Matrix.

## What the system is intended to discover, correlate, validate, quantify and act upon

### A. COMMERCIAL / MARKET FINDINGS
- Supplier price change (new / changed / disappeared) — requires source + timestamp + evidence
- Supplier entry into new category/geography — entity resolution required
- Hotel renovation / expansion / closure — external evidence only (not demo)
- Hotel supplier concentration — correlation across orders + external evidence
- Procurement anomaly (unusual volume, price deviation) — requires historical baseline
- Customer purchase-pattern shift — requires order history (authorized data only)
- Competitor presence / pricing — market intelligence layer (not fabricated)

### B. OPERATIONAL / LOGISTICS FINDINGS
- Delivery delay / risk per route — tracking + weather/corridor data
- Route consolidation opportunity — logistics engine computes density
- Warehouse/cross-dock demand — geographic cluster analysis
- Carrier capacity underutilization — trip data + corridor economics
- Freight cost anomaly — cost matrix comparison over time

### C. SUPPLY / DEMAND / INVENTORY FINDINGS
- Product stock level change — inventory sync only (REST/webhook, per G5)
- Product discontinuation / substitution — catalog intelligence
- Demand forecast change — forecasting model (requires real order history)
- Seasonal demand shift — temporal index (not yet implemented; P3)

### D. FINANCIAL / RISK / COMPLIANCE FINDINGS
- Credit line utilization / exposure — fintech layer + authority matrix
- Payment delay risk — requires invoice + delivery confirmation
- Factoring eligibility — ETA UUID + validator (G10)
- Anti-bypass attempt — compliance layer (token / webhook / CRM check)
- Audit log tampering — hash chain verification
- Regulatory claim verification — TrustClaim model (F in matrix; P1 build)

### E. EXTERNAL INTELLIGENCE / DISCOVERY FINDINGS
- Public renovation announcement — evidence + source URL + timestamp
- Public supplier certification / new listing — evidence-backed only
- Regulatory/public source change — ETA, government filings
- External price benchmark — public source reference required
- Fraud / security exposure — evidence-backed (not simulated)

### F. INTERNAL / OPERATIONAL INTELLIGENCE
- Agent failure / retry / kill — agent-run log
- Queue backlog / worker failure — BullMQ + Redis monitoring
- Approval chain blockage — authority matrix audit
- Notification delivery failure — retry / dead-letter
- Evidence chain break (missing provenance) — integrity failure
- Cross-tenant data access attempt — security incident (G1)

### G. REQUIRED EVIDENCE ATTRIBUTES (MANDATORY §5)
Every important finding must include:
- Source (URL / identifier)
- Retrieval timestamp
- Raw evidence (immutable, hashed)
- Extracted fact (structured, normalized)
- Entity (entity resolution reference)
- Confidence score (0.0-1.0, structured, not free text)
- Classification (OBSERVED / USER_PROVIDED / INFERRED / MODEL_PREDICTED / VALIDATED / AUTHORIZED)
- Provenance chain (retrieval → extraction → normalization → resolution)

## Gaps (from P0 gate)
- EvidenceRecord DB model: F (not implemented)
- IntelligenceEdge / temporal graph model: F
- Change Index / Temporal Index: F
- Pain Index / Opportunity Index / Customer-Need Index: F (not computed; foundational for P1)
- TrustClaim model: F (blocks verified compliance badges)
- Need Detection engine: F (P1 spine priority)
- Opportunity Matching: F (depends on Need Detection)
- Change detection / continuous monitoring: F (P3)

These are not hidden; they are the explicit P1 roadmap. No simulated findings are produced by missing systems.
