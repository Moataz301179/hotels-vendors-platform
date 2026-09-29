# TECHNICAL DECISION — Hotel Data Ingestion for Procurement Economic Loop MVP

## A. CANONICAL MVP ECONOMIC LOOP

```
REAL PILOT HOTEL DATA
  → TB / GL structure (account codes, balances, periods)
  → AP / payables + materiality analysis (vendor invoices, payment terms)
  → identify high-value procurement cost pools (category + vendor concentration)
  → selective drill-down into procurement/AP evidence (item-level invoices where needed)
  → supplier/item/price/volume/terms analysis where hotel data supports it
  → external market evidence only where real sourced evidence exists
  → quantified opportunity (VERIFIED SAVING | CALCULATED OPPORTUNITY | SCENARIO | HYPOTHESIS)
  → actionable management report
  → subsequent AP/TB data for outcome verification
```

The loop is TB-first. TB maps economic structure and flags where deeper evidence is needed. It does NOT require SKU-level pricing.

---

## B. REQUIRED DATA AT EACH STAGE

| Stage | Data Required | Minimum Viable |
|---|---|---|
| **TB ingestion** | Account codes, account names, debit/credit balances, period, currency | Account-level TB for one period (Excel/CSV) |
| **GL structure** | Chart of accounts with account types (Asset/Liab/Equity/Income/Expense) | Account type mapping for procurement-relevant accounts |
| **AP/payables** | Vendor name, invoice date, invoice amount, due date, payment date, GL account, PO reference, category | AP detail for flagged high-value categories (Excel/CSV) |
| **Drill-down** | Item description, quantity, unit price, vendor, PO, GL account | Item-level AP for high-materiality cost pools |
| **Market evidence** | External price/benchmark with source, timestamp, provenance | Only where real sourced evidence exists (no assumptions) |
| **Outcome verification** | Subsequent TB/AP showing post-action spend | Follow-up period TB/AP |

---

## C. WHAT TB ALONE CAN ESTABLISH

From a Trial Balance alone (account-level, no item detail):

1. **Total procurement-relevant spend** — sum of expense accounts mapped to procurement categories (F&B, Housekeeping, Engineering, Amenities, etc.)
2. **Category spend distribution** — which categories dominate spend
3. **Cost pool identification** — high-value accounts flagged for drill-down
4. **Materiality thresholds** — accounts above X% of total procurement spend
5. **Vendor concentration signal** — IF AP data is available for those accounts
6. **Cost structure mapping** — how the hotel organizes its procurement economics

**TB cannot establish:**
- Item-level pricing
- Vendor-specific unit prices
- Price variance between vendors for same item
- Volume/mix changes at item level
- Contract compliance at line-item level

These require AP/procurement drill-down data.

---

## D. WHAT ADDITIONAL AP/PROCUREMENT EVIDENCE IS NEEDED AFTER TB

After TB flags high-value cost pools, request:

1. **AP invoice detail** for flagged categories:
   - Vendor name/code
   - Invoice number
   - Invoice date
   - Invoice amount (EGP)
   - Quantity (where available)
   - Unit price (where available)
   - Due date / payment date
   - PO reference
   - GL account code
   - Category / material group
   - Payment terms

2. **Item-level data** where price variance or consolidation analysis is needed:
   - Item description / SKU
   - Unit of measure
   - Price per unit
   - Supplier
   - Contract reference (if applicable)

**The drill-down is selective.** Not every hotel provides every data type. The system requests only what's needed for the flagged cost pools.

---

## E. WHICH FINDINGS CAN BE CALCULATED FROM INTERNAL HOTEL DATA ALONE

From real hotel TB + AP data (no external market evidence needed):

| Finding | Data Required | Confidence |
|---|---|---|
| **Supplier concentration** | AP vendor spend by vendor | High (direct from AP) |
| **Price variance** (same item, different prices across time/vendors) | Item-level AP with unit price | High (direct from AP) |
| **Volume/mix changes** | AP quantity + invoice dates | Medium (requires quantity data) |
| **Contract compliance** | PO + invoice + contract reference | Medium (requires contract data) |
| **Payment-term/cashflow opportunities** | AP due dates + payment dates + terms | High (direct from AP) |
| **Duplicate/anomalous spend** | AP invoice-level with date/amount/vendor | Medium (pattern detection) |
| **Vendor consolidation opportunities** | AP vendor spend ranking + item overlap | Medium (requires item data for consolidation logic) |

All findings are labelled by confidence and evidence type. No finding is presented as VERIFIED SAVING without confirmed outcome data.

---

## F. WHICH FINDINGS REQUIRE EXTERNAL MARKET EVIDENCE

| Finding | Requires External Evidence | MVP Status |
|---|---|---|
| **Market price benchmarking** (is this price above/below market?) | Real sourced supplier prices or published benchmarks | Not required for first pilot — internal analysis suffices |
| **Savings vs. market** (absolute market savings claim) | Real market price data with provenance | Deferred — would be SCENARIO/HYPOTHESIS without real data |
| **Supplier price competitiveness** | Comparative supplier pricing from market | Deferred |

**Rule:** Any figure presented as a SAVING must be either (a) VERIFIED from outcome data, or (b) CALCULATED OPPORTUNITY from internal hotel data with clear methodology, or (c) explicitly labelled SCENARIO/HYPOTHESIS. Never present an assumption as a saving.

---

## G. LOWEST-FRICTION REAL PILOT INGESTION OPTIONS

### Option 1: Structured File Upload (Excel/CSV) — PRIMARY FOR PILOT

**Mechanism:** Hotel exports TB/GL/AP from their financial system as Excel or CSV and uploads to the platform.

**Why lowest-friction for pilot:**
- Every financial system (Opera, SAP, Xero, QuickBooks, local Egyptian systems) can export to Excel/CSV
- No API integration required for first hotel
- Hotel controls the export — they know their data
- Uses existing `exceljs` + `lib/parsers/excel-parser.ts` infrastructure (already handles .xlsx, .xls, .csv with header detection and type coercion)
- Can be enhanced later with direct connectors without changing the ingestion boundary

**Friction points:**
- Hotel must know what to export (mitigated by providing templates)
- Data quality varies by hotel/system (mitigated by validation + diagnostic feedback)
- Not automated for ongoing updates (acceptable for first pilot; automation is future connector work)

**Implementation path:**
1. Define canonical TB/GL/AP schema (what fields the engine needs)
2. Build template Excel files for hotel export (pre-formatted, with header detection)
3. Build ingestion API: accept file → parse with exceljs → validate against schema → normalize → store with provenance
4. Build diagnostic layer: analyze TB → flag cost pools → request drill-down data
5. Build drill-down ingestion: accept AP detail files for flagged categories

**Existing infrastructure leverage:**
- `exceljs` (already a dependency)
- `lib/parsers/excel-parser.ts` (already handles Excel/CSV parsing with header detection)
- `app/api/v1/upload/route.ts` (file upload pattern — can be extended or replaced for structured data)
- Prisma with PostgreSQL (or SQLite for pilot) for storage

---

### Option 2: Direct Financial System API Connector — FUTURE

**Mechanism:** Connect directly to hotel's financial system (Opera, SAP, Xero, etc.) via API.

**Why NOT for first pilot:**
- Requires hotel API access (authentication, permissions, possibly IT approval)
- Integration effort per system type (Opera API ≠ SAP API ≠ Xero API)
- Higher friction for first pilot than file upload
- Higher value long-term (automated, ongoing updates)

**When to pursue:**
- After first pilot validates the economic loop with file upload
- When scaling to multiple hotels
- When a hotel has API access and requests it

**Connector architecture (boundary definition):**
- Connector interface: `ingest(hotelId, sourceSystem, rawData, provenance) → normalized records`
- Each connector implementation handles one source system type
- Common canonical schema output regardless of source
- Provenance preserved per source (source system, export method, timestamp)

---

### Option 3: Bank Statement / Payment Reconciliation Import — COMPLEMENTARY

**Mechanism:** Import bank statements to reconstruct AP/payment patterns.

**Use case:** When AP detail is unavailable but payment data exists in bank statements.

**Limitations:** Cannot reconstruct vendor/item-level detail from bank data alone. Complements AP data, does not replace it.

**MVP role:** Optional supplementary data source, not primary.

---

### RECOMMENDED PILOT ARCHITECTURE

```
PILOT HOTEL
  │
  ▼
[EXPORT] Hotel exports TB (and optionally AP detail) as Excel/CSV from their system
  │
  ▼
[ACCESS] Hotel uploads file via platform ingestion endpoint
  │         (or platform provides template → hotel fills → hotel uploads)
  │
  ▼
[INGESTION API] POST /api/v1/hotel-data/ingest
  │         - Accepts .xlsx / .xls / .csv
  │         - Parses with exceljs (existing lib/parsers/excel-parser.ts pattern)
  │         - Validates against canonical schema
  │         - Returns validation report (what was parsed, what's missing)
  │
  ▼
[NORMALIZATION] Map parsed data to canonical TB/GL/AP schema
  │         - Account code → account type mapping
  │         - Vendor name normalization
  │         - Category mapping (F&B, Housekeeping, etc.)
  │         - Currency normalization (EGP default)
  │
  ▼
[PROVENANCE STORE] Store with SHA-256 hash, source, timestamp, hotel ID, record count
  │         (p0/evidence-store.ts pattern — isolated, no legacy Prisma dependency)
  │
  ▼
[TB DIAGNOSTIC ENGINE] Analyze TB
  │         - Identify procurement-relevant accounts
  │         - Compute materiality thresholds
  │         - Flag high-value cost pools
  │         - Output: what deeper data is needed
  │
  ▼
[DRILL-DOWN REQUEST] If AP detail needed → request specific categories from hotel
  │         - Hotel provides AP detail file for flagged categories
  │         - Ingest → normalize → analyze
  │
  ▼
[PROCUREMENT ANALYSIS ENGINE] Vendor/category analysis
  │         - Spend by vendor
  │         - Price variance (where unit data exists)
  │         - Payment terms analysis
  │         - Consolidation opportunities
  │
  ▼
[SAVINGS CALCULATOR] Quantified opportunities
  │         - VERIFIED SAVING (from confirmed outcome data — not yet available)
  │         - CALCULATED OPPORTUNITY (from internal hotel data)
  │         - SCENARIO / HYPOTHESIS (labelled, not presented as saving)
  │
  ▼
[MANAGEMENT REPORT] Actionable report with opportunities, confidence, next steps
  │
  ▼
[OUTCOME TRACKING] (future) Hotel provides follow-up TB/AP → verify realized savings
```

---

## H. EXACT PROVENANCE/EVIDENCE REQUIREMENTS

Every data ingestion must preserve:

| Field | Requirement | Purpose |
|---|---|---|
| **Hotel ID** | Tenant-scoped identifier | Tenant isolation (G1) |
| **Source system** | Name of hotel's financial system (Opera, SAP, Xero, "manual export", etc.) | Provenance tracking |
| **Export timestamp** | When the hotel exported the data | Freshness / staleness tracking |
| **Record count** | Number of accounts / rows / invoices ingested | Completeness check |
| **Raw data hash** | SHA-256 of the raw uploaded file content | Integrity verification (detect tampering) |
| **Ingestion ID** | Unique identifier for this ingestion event | Traceability |
| **Ingestion timestamp** | When platform ingested the data | Audit trail |
| **Validation report** | What was parsed successfully, what failed, what's missing | Diagnostic feedback to hotel |
| **Confidence** | Data quality assessment (HIGH/MEDIUM/LOW based on completeness, format, validation) | Determines finding confidence |

**Evidence labeling (p0/evidence-store.ts + core/types.ts):**
- FACT = directly observed in supplied data, hash-verified
- INFERENCE = derived from data with documented reasoning
- HYPOTHESIS = labelled assumption, not from data

**Never:**
- Fabricate hash values
- Label an assumption as FACT
- Present a SCENARIO as a VERIFIED SAVING

---

## I. ACCEPTANCE GATES FOR FIRST REAL PILOT

### Gate 1: Ingestion
- [ ] Real hotel TB data uploaded (not fabricated, not test fixture)
- [ ] File parsed successfully (validation report shows parsed accounts/rows)
- [ ] Provenance stored (hotel ID, source, timestamp, hash, record count)
- [ ] TB diagnostic runs and produces output (cost pools, materiality, flagged categories)

### Gate 2: Diagnostic
- [ ] TB diagnostic identifies procurement-relevant accounts
- [ ] Materiality thresholds computed
- [ ] High-value cost pools flagged
- [ ] Diagnostic output is actionable (tells hotel what deeper data is needed, if any)

### Gate 3: Drill-down (if applicable)
- [ ] AP detail requested for flagged categories (if TB alone insufficient)
- [ ] Hotel provides AP detail (real data, not fabricated)
- [ ] AP data ingested, normalized, stored with provenance
- [ ] Drill-down analysis runs on AP data

### Gate 4: Analysis
- [ ] Procurement analysis produces findings from real data
- [ ] Each finding labelled with evidence type (FACT/INFERENCE/HYPOTHESIS) and confidence
- [ ] No finding presented as VERIFIED SAVING without outcome data
- [ ] CALCULATED OPPORTUNITYs have clear methodology (not assumptions)

### Gate 5: Report
- [ ] Management report generated from analysis
- [ ] Report is actionable (specific recommendations, not generic)
- [ ] Report distinguishes VERIFIED SAVING / CALCULATED OPPORTUNITY / SCENARIO / HYPOTHESIS
- [ ] Report shows baseline, proposed, savings, confidence, implementation effort

### Gate 6: Integrity
- [ ] No fabricated data anywhere in the pipeline
- [ ] No illustrative numbers presented as real evidence
- [ ] No "industry-standard assumptions" presented as market evidence
- [ ] All savings figures traceable to either real data or explicitly labelled scenario

---

## NOT DECIDED YET (future decisions, not blocking pilot)

1. **Direct API connector priority** — which hotel system to connect first after file-upload pilot validates the loop
2. **Multi-property hotel group handling** — how to aggregate TB across properties in a group
3. **Automated outcome tracking** — connector for follow-up AP data vs. manual upload
4. **Market evidence sourcing** — which external price sources to integrate (if any) for benchmarking
5. **Template design** — exact Excel template fields for hotel export (to be designed with pilot hotel input)

---

## SUMMARY

**Recommended lowest-friction path for first pilot:** Structured file upload (Excel/CSV) using existing `exceljs` + `lib/parsers/excel-parser.ts` infrastructure, with template-guided export from the hotel's financial system. This is real data ingestion, not manual entry. It leverages existing dependencies and parsing infrastructure. Manual upload is the first adapter, not the locked architecture — the connector boundary accepts multiple input modalities and normalizes to a canonical schema, enabling future direct API connectors without changing the diagnostic/analysis layers.

**The connector boundary is defined.** What's not built yet: the ingestion API for structured TB/GL/AP data, the TB diagnostic engine, the drill-down request mechanism, the procurement analysis engine, the savings calculator with evidence labeling, and the management report generator. These are implementation tasks, not architecture decisions.

**Stop.** This is the technical decision. No code changes. No implementation. Review required before proceeding.
