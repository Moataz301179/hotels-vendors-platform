# HotelsVendors System Intelligence Map

**Generated:** 2026-09-15  
**Status:** Living document — updated with every architectural change  
**Authority:** Master Execution Directive §26

---

## 1. End-to-End Intelligence Flow

```
WORLD (External Sources)
    ↓
ACQUISITION (Source Selection → Retrieval → Raw Evidence)
    ↓
EVIDENCE STORE (Immutable, provenance-tracked)
    ↓
EXTRACTION (Fact Extraction → Normalization)
    ↓
ENTITY RESOLUTION (Cross-source deduplication, confidence-scored)
    ↓
INDEXES (Entity, Evidence, Event, Change, Relationship, Supplier, Procurement, Logistics, Financial, Pain, Opportunity, Risk, Customer-Need, Evidence/Confidence, Temporal, Action)
    ↓
HOTEL INTELLIGENCE GRAPH (Temporal, provenance-backed relationships)
    ↓
REASONING ENGINE (Need Detection → Opportunity Matching)
    ↓
CUSTOMER/PARTICIPANT SELECTION (Role-specific intelligence packaging)
    ↓
TAILORED INTELLIGENCE (Hotel / Supplier / Carrier / Funder / Logistics)
    ↓
CRM / APPROACH (Smart Approach Engine)
    ↓
ACTION (Procurement / Marketplace / Logistics / Financing)
    ↓
MONITORING (Change Detection → Re-evaluation → Graph Update)
    ↓
LEARNING (Feedback → Model Improvement)
```

---

## 2. Source Layer (DISCOVER)

### 2.1 Source Categories

| Category | Examples | Acquisition Method | Priority |
|----------|----------|-------------------|----------|
| Public Hotel Websites | Hotel websites, brand portals | Firecrawl / HTTP | P0 |
| Supplier Websites | Catalogs, pricing, certifications | Firecrawl / HTTP | P0 |
| Business Directories | Egypt hotel directory, Yellow Pages | Firecrawl / API | P0 |
| Regulatory Sources | ETA portal, GAFI, Ministry of Tourism | API / Structured | P0 |
| Public Filings | Commercial registry, tax records | API / Scraper | P1 |
| News/Press | Hospitality news, expansion announcements | RSS / Firecrawl | P1 |
| Social/Business Profiles | LinkedIn, company pages | API / Firecrawl | P2 |
| ERP/External Systems | Opera PMS, SAP, supplier ERPs | Webhook / API | P0 (authorized only) |

### 2.2 Existing Acquisition Capabilities

- **Firecrawl integration**: `lib/sourcing/scraper.ts`, `lib/sourcing/catalog-discovery.ts`
- **Apify integration**: `lib/sourcing/apify.ts` for structured extraction
- **Egypt Hotel Directory**: `lib/scrapers/egypt-hotel-directory.ts`
- **Product Acquisition**: `lib/sourcing/product-acquisition.ts`
- **Phone Enrichment**: `lib/sourcing/phone-enrichment.ts`
- **WC Sources**: `lib/sourcing/wc-sources.ts`

---

## 3. Evidence Layer

### 3.1 Evidence Schema (Mandate §5)

```typescript
interface EvidenceRecord {
  id: string;
  source: string;
  sourceUrl: string;
  retrievedAt: DateTime;
  rawContent: string;           // Immutable raw capture
  contentHash: string;          // SHA-256
  extractedFacts: ExtractedFact[];
  provenance: SourceProvenance;
  classification: 'OBSERVED' | 'USER_PROVIDED' | 'INFERRED' | 'MODEL_PREDICTED' | 'VALIDATED' | 'AUTHORIZED';
}
```

### 3.2 Existing Evidence Infrastructure

- **Adaptive Document Intelligence Pipeline**: `lib/intelligence/adaptive/document-intelligence-pipeline.ts`
- **Entity Resolution**: `lib/intelligence/graph/entity-resolution.ts`
- **Intelligence Core Types**: `lib/intelligence/core/types.ts` — SourceProvenance, ConfidenceScore, IntelligenceAssertion

---

## 4. Extraction & Normalization

### 4.1 Existing Extraction Capabilities

- **Document Intelligence Pipeline**: Multi-stage extraction (OCR → NER → Structured Facts)
- **Catalog Discovery**: Product/supplier catalog parsing
- **Excel Parser**: `lib/parsers/excel-parser.ts` for structured data
- **Catalog Importer**: `lib/ai/catalog-importer.ts`
- **SKU Generator**: `lib/ai/sku-generator.ts`
- **Description Writer**: `lib/ai/description-writer.ts`

### 4.2 Normalization Requirements

- Hotel name standardization (aliases, brand vs. property)
- Supplier identity resolution (tax ID, commercial registry)
- Product categorization (Egyptian hospitality taxonomy)
- Currency normalization (EGP primary, USD secondary)
- Address/geographic normalization (governorate, city, coordinates)

---

## 5. Entity Resolution (Mandate §14)

**Engine:** `lib/intelligence/graph/entity-resolution.ts` — EntityResolutionEngine

**Signals Used:**
- Tax ID (primary, unique)
- Commercial Registry Number
- Legal Name + Address fuzzy match
- Brand affiliation
- Geographic co-location
- Temporal overlap
- Relationship graph (supplier↔hotel, hotel↔group)

**Confidence Thresholds:**
- Strict Mode: ≥0.7 with multiple signals
- Contradiction detection: Any contradictory signal blocks resolution

---

## 6. Intelligence Indexes (Mandate §7)

| Index | Purpose | Backing Store | Status |
|-------|---------|---------------|--------|
| Entity Index | Who/what is this? | PostgreSQL + Vector | Partial |
| Evidence Index | What proves it? | PostgreSQL (JSONB) | Partial |
| Event Index | What happened and when? | PostgreSQL + Event Store | Partial |
| Change Index | What changed? | Event Store | Missing |
| Relationship Index | Who is connected to whom? | Graph DB / PostgreSQL | Partial |
| Supplier Index | Who supplies whom and for what? | PostgreSQL | Partial |
| Procurement Index | What is being purchased? | PostgreSQL | Partial |
| Logistics Index | Where are goods moving? | PostgreSQL | Partial |
| Financial Index | Working-capital pressure? | PostgreSQL | Partial |
| Pain Index | Operational problems? | Computed | Missing |
| Opportunity Index | Who benefits from solving? | Computed | Missing |
| Risk Index | What could go wrong? | Risk Engine | Partial |
| Customer-Need Index | Current needs? | Computed | Missing |
| Evidence/Confidence Index | How strong is conclusion? | PostgreSQL | Partial |
| Temporal Index | What changed recently? | Event Store | Missing |
| Action Index | What should happen next? | Computed | Missing |

---

## 7. Hotel Intelligence Graph (Mandate §6)

**Entities:** Hotels, Hotel Groups, Owners, Management Companies, Suppliers, Manufacturers, Products, Services, Carriers, Warehouses, Locations, Procurement Relationships, People/Roles, Public Organizations, Financing Relationships, Contracts, Orders, Invoices, Shipments, Sources, Evidence, Events, Changes, Findings, Risks, Opportunities, Financial Relationships, Operational Relationships

**Relationship Properties:**
- Provenance (source, timestamp, evidence)
- Confidence (0.0-1.0)
- Temporal validity (validFrom, validTo)
- Strength (weak/medium/strong)

**Temporal Support:** Full history via event sourcing pattern

**Current State:** Schema exists in Prisma (Hotel, Supplier, HotelSupplier, Order, Invoice, Trip, LogisticsHub, etc.) — Graph layer needs explicit relationship tables

---

## 8. Reasoning & Intelligence Engine

### 8.1 Need Detection Engine (Mandate §8)

```
ENTITY → CURRENT CONDITION → PAIN → CONSEQUENCE → NEED → SOLUTION → PROVIDER
```

**Implementation:** `lib/intelligence/adaptive/` — InvestigationEngine, TemporalIntelligence, RelationshipDiscovery

### 8.2 Opportunity Matching Engine (Mandate §10)

```
FINDING → AFFECTED ENTITY → ECONOMIC/OPERATIONAL IMPACT → PARTICIPANTS AFFECTED → WHO CAN SOLVE → WHO BENEFITS → WHO RECEIVES INTELLIGENCE → WHAT INFORMATION → WHAT ACTION → WHAT EVIDENCE
```

### 8.3 Smart Approach Engine (Mandate §11)

Generates contextual intelligence packages per participant role.

---

## 9. Commercial/Action Spine

### 9.1 Procurement Layer
- Marketplace: `lib/marketplace/`, `app/api/v1/products/`, `app/api/v1/orders/`
- Cart/Checkout: `lib/storefront/commerce.ts`, `app/(dashboard)/hotel/checkout/`
- RFQ: `app/(marketing)/rfq/`, `app/api/v1/rfq/`

### 9.2 Logistics Layer
- Cost Matrix: `lib/logistics/cost-matrix.ts`
- Corridor Engine: `lib/shipping/corridor-engine.ts`
- Dock Scheduler: `lib/shipping/dock-scheduler.ts`
- Shipment Store: `lib/logistics/shipment-store.ts`
- Tracking: `lib/logistics/tracking.ts`
- Providers: `lib/logistics/providers.ts`

### 9.3 Financing Layer
- Fee Calculator: `lib/fintech/fee-calculator.ts`
- Risk Engine: `lib/fintech/risk-engine.ts`
- Factoring Bridge: `lib/fintech/factoring-bridge.ts`
- Oliv Bridge: `lib/fintech/oliv-bridge.ts`
- Credit Gate: `lib/credit-gate.ts`
- Authority Matrix: `lib/auth/authority-matrix.ts`

### 9.4 Compliance Layer
- ETA: `lib/eta/` (client, signer, validator, queue, dead-letter)
- FRA: `lib/compliance/fra-license.ts`
- KYC: `lib/compliance/kyc.ts`

---

## 10. AI Intelligence Layer (Mandate §15)

**Not Hermes.** HotelsVendors-native AI.

**Access Scope (permission-gated):**
- Hotels, Suppliers, Procurement, Orders, Logistics, Financing, CRM, Intelligence, Evidence, Graph Relationships, Alerts, Market Observations

**Distinction Required:**
- Observed Fact vs Inference vs Prediction vs Recommendation
- Evidence citation for important conclusions
- Tenant isolation, RBAC, Authority, Financial Permissions, Privacy, Audit, Approval Requirements

**Existing:** `lib/ai/llm.ts`, `lib/ai/forecast.ts`, `lib/ai/pricing-advisor.ts`, `lib/agents/`

---

## 11. Agent Layer (Mandate §16)

| Agent | Purpose | Status |
|-------|---------|--------|
| Discovery Agent | Find new entities/sources | Partial (scrapers exist) |
| Acquisition Agent | Execute retrieval tasks | Partial |
| Extraction Agent | Parse/normalize evidence | Partial |
| Entity Resolution Agent | Deduplicate entities | Partial (engine exists) |
| Evidence Agent | Manage evidence chain | Missing |
| Intelligence Agent | Reason over graph | Partial (InvestigationEngine) |
| Hotel Agent | Hotel-specific intelligence | Missing |
| Supplier Agent | Supplier-specific intelligence | Missing |
| Procurement Agent | Order optimization | Missing |
| Logistics Agent | Route/consolidation optimization | Partial (corridor-engine) |
| Financing Agent | Credit/factoring matching | Partial (risk-engine) |
| Fraud Agent | Anomaly detection | Partial (compliance-guard) |
| Compliance Agent | ETA/FRA monitoring | Partial (eta queue) |
| Monitoring Agent | Continuous change detection | Missing |
| Notification Agent | Alert delivery | Partial (notifications/) |
| Customer Opportunity Agent | Need→Approach pipeline | Missing |
| Marketing/Growth Agent | Lead gen, outreach | Partial (outreach/, leads/) |
| Admin/System Agent | System health, overrides | Partial (admin APIs) |

---

## 12. Continuous Intelligence (Mandate §17)

**Architecture:** MONITOR → DETECT CHANGE → RE-EVALUATE → UPDATE GRAPH → RE-CALCULATE IMPACT → FIND AFFECTED PARTICIPANTS → GENERATE ACTION

**Triggers:**
- Hotel opens/closes/expands/renovates
- Supplier changes pricing/disappears
- Carrier changes route
- New supplier enters market
- Financing need appears
- Procurement anomaly
- Operational exposure changes
- Public evidence changes

**Current:** Swarm jobs (`lib/swarm/`, `lib/agents/swarm-orchestrator.ts`), BullMQ queues (`lib/queue.ts`, `lib/queues/`)

---

## 13. Notifications (Mandate §20)

**Architecture:** EVENT → RULE → SEVERITY → RECIPIENT → CHANNEL → DELIVERY → RETRY → ACKNOWLEDGEMENT → AUDIT

**Channels:** Web, Email, Mobile Push, WhatsApp/SMS (where integrated)

**Existing:** `lib/notifications/email.ts`, `lib/notifications/whatsapp.ts`, `lib/notifications/queue.ts`, Push tokens API

---

## 14. Admin Control Plane (Mandate §21)

**Controls:** Tenants, Users, Roles, Permissions, Authority, Financial Limits, Agents, AI, Acquisition, Integrations, Notifications, Fraud, Compliance, Trust Claims, Evidence, Intelligence, Jobs, Queues, System Health, Failures, Incidents, Overrides, Emergency Controls, Kill Switches

**Observability:** WHAT → WHY → DATA USED → CONCLUSION → ACTION → FAILURES → APPROVALS

**Existing:** `app/(admin)/`, `app/api/v1/admin/`, `lib/admin/override-tools.ts`

---

## 15. Security/Compliance Boundary (Mandate §18, §19)

**Allowed:** Public info, Legitimate APIs, Authorized integrations, Public documents, Publicly accessible evidence, Customer-authorized data, Contracted data sources

**Not Allowed:** Unauthorized intrusion, Credential theft, Bypassing auth, Exploiting systems, Unauthorized exfiltration, Private data without authorization

**Trust Claims Model:** CLAIM → ISSUER → EVIDENCE → SCOPE → ISSUE DATE → EXPIRY → VERIFICATION → STATUS

**ETA States:** Architecture, Sandbox, Simulated, Production, Verified — never conflate

---

## 16. Frontend Surfaces (Mandate §25)

| Surface | Route | Status |
|---------|-------|--------|
| Intelligence Dashboard | `/intelligence` | Partial |
| Hotel Intelligence Profile | `/intelligence/entities/[id]` | Partial |
| Supplier Intelligence Profile | `/intelligence/entities/[id]` | Partial |
| Opportunity Feed | `/intelligence/opportunities` | Partial |
| Evidence View | `/intelligence/evidence` | Partial |
| Relationship Graph | `/intelligence/graph` | Partial |
| Procurement Intelligence | `/hotel/catalog`, `/hotel/orders` | Partial |
| Logistics Intelligence | `/shipping`, `/deliveries` | Partial |
| Financing Opportunities | `/factoring`, `/financing` | Partial |
| Alerts | `/intelligence/monitoring` | Partial |
| AI Assistant | `/jarvis`, role-specific chatbots | Partial |
| Agent Activity | `/agents` | Partial |
| Customer Approach Recommendations | Missing | Missing |
| Admin Intelligence Control Plane | `/admin` | Partial |

---

## 17. Data Flow Summary

```
External Sources
    → Acquisition Adapters (Firecrawl, Apify, Direct API, Webhooks)
    → Raw Evidence Store (immutable, hashed)
    → Extraction Pipeline (AI + rules)
    → Normalized Facts
    → Entity Resolution (graph-based)
    → Intelligence Graph (temporal, provenance)
    → Indexes (15+ specialized)
    → Reasoning Engine (Need Detection + Opportunity Matching)
    → Role-Specific Intelligence Packages
    → Smart Approach Engine (contextual outreach)
    → CRM / Action Systems (Procurement, Logistics, Financing)
    → Monitoring (Change Detection → Re-evaluation)
    → Learning Loop (Feedback → Model Updates)
```

---

## 18. Critical Gaps (P0/P1 from Master Directive)

### P0 — Protect Integrity
- [ ] Remove fake production claims
- [ ] Remove fake intelligence/simulated compliance as real
- [ ] Remove unsupported badges
- [ ] Remove seed data presented as external intelligence
- [ ] Fix compromised controls

### P1 — Wire Core Intelligence Spine
- [ ] Acquisition → Evidence → Extraction → Entity Resolution → Graph → Indexes → Reasoning → Need Detection → Opportunity Matching
- [ ] Evidence chain persistence (immutable, append-only)
- [ ] Change Index / Temporal Index implementation
- [ ] Pain Index / Opportunity Index / Customer-Need Index computation
- [ ] Role-specific intelligence packaging
- [ ] Smart Approach Engine

### P2 — Wire Commercial/Action Spine
- [ ] Finding → Participant → Tailored Intelligence → CRM → Approach → Procurement → Logistics → Financing

### P3 — Wire Continuous Operation
- [ ] Monitoring → Change Detection → Alerts → Agents → Scheduled Acquisition → Re-evaluation

---

## 19. Dependency Map Reference

See `docs/system-dependency-map.md` for upstream/downstream dependencies per capability.

---

## 20. Required Findings Inventory Reference

See `docs/required-findings-inventory.md` for all required findings across domains.

---

## 21. Product Capability Integrity Matrix Reference

See `docs/product-capability-integrity-matrix.md` for A-G classification of every capability.