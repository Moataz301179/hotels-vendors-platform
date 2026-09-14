# HOTELSVENDORS — REAL DATA AUDIT REPORT

**Date:** 2026-09-14  
**Workspace:** `/Users/Moatazi/hotels-vendors-new`  
**Commit:** `fd902a9` (HV CLEAN ISOLATION)

---

## A. EXECUTIVE REALITY CHECK

### What is GENUINELY REAL today

| Item | Status |
|------|--------|
| Frontend application (Next.js 16.3.1) | ✅ Real — runs, builds, responds |
| API route definitions (225 routes) | ✅ Real — code exists, typed, versioned |
| Prisma schema (110 models) | ✅ Real — comprehensive, migrated |
| Authentication system (OTP, sessions, RBAC) | ✅ Real — full implementation |
| Authority Matrix engine | ✅ Real — database-driven rules |
| ETA e-invoicing bridge (signer, canonicalizer, queue) | ✅ Real — implementation complete |
| Factoring/Oliv integration layer | ✅ Real — API routes + bridge code |
| Payment integrations (Fawry, Paymob, Instapay) | ✅ Real — route handlers exist |
| Design system (Tailwind v4, tokens, glassmorphism) | ✅ Real — owner-locked palette |
| Sourcing/scraping modules | ✅ Real — code exists, needs credentials |

### What is UI-ONLY (no backend data)

| Item | Status |
|------|--------|
| Intelligence Overview page | ⚠️ Shows "Backend Not Connected" — honest |
| Intelligence Discovery/Sources/Entities/Graph/Evidence/Findings/Opportunities/Monitoring/Actions | ⚠️ Seed data from `lib/data.ts` |
| Hotel catalog pages | ⚠️ Seed products |
| Supplier directory (marketing) | ⚠️ Seed suppliers |
| Marketplace pages | ⚠️ Seed products |
| Dashboard (role-specific) | ⚠️ Seed data for metrics |
| Admin users/tenants pages | ⚠️ Seed data |

### What is SEEDED (presented as live)

- `lib/data.ts` — 398 lines: CATEGORIES, SUPPLIERS (8 items), HOTELS (6 items), PARTNERS, CARRIERS, PRODUCTS (20+ items)
- `data/*.json` — 5 files: coastal-hotels, red-sea-suppliers, egyptian-market-v2, verified_executive_leads, cms-content
- 25 pages consume this seed data
- Prisma seed files: seed.ts, seed-catalog.ts, seed-extended.ts, seed-coastal.ts, seed-pilot.ts, seed-products.ts

### What is EMPTY

- PostgreSQL database exists in schema but **no running instance locally**
- All 177 Prisma-backed API routes would return empty arrays if called
- No cached sessions, no rate-limit data

### What is UNAVAILABLE

| Capability | Reason |
|------------|--------|
| PostgreSQL database | Not running locally (no `psql` available) |
| Redis | Not installed/running locally |
| Ollama LLM | Not running locally |
| External APIs (Google Maps, Firecrawl, etc.) | No credentials configured |
| Oliv Fintech API | No live credentials |
| Fawry/Paymob/Instapay | Test mode only, no live keys |
| ETA Tax Authority sandbox | No credential configuration |
| Ollama/Vercel AI SDK | Provider version mismatch (V1 vs V7) |

### What is BROKEN

| Item | Issue |
|------|-------|
| `lib/fintech/onboarding-validator.ts` | `MATRIX[role]` can be undefined — needs fallback |
| Intelligence seed data | Pages show static arrays as if live intelligence |

### What is PLANNED (code exists, not wired)

| Item | Status |
|------|--------|
| Black Box Intelligence Layer | Types + structural code only |
| Adaptive Investigation Loop | Simulation, no real external calls |
| Entity Resolution Engine | No real data source |
| Relationship Discovery | No real data source |
| Temporal Intelligence | No real data source |
| Document Intelligence Pipeline | Structural, no OCR/LLM integration |
| Background Workers (BullMQ) | Code exists, no Redis |
| MCP integrations | Code exists, no configured servers |

---

## B. REAL CAPABILITY MATRIX

| Capability | Code | Data Source | Persistence | API | UI | Status |
|------------|------|-------------|-------------|-----|-----|--------|
| Authentication (login/register/OTP) | ✅ | Session + DB | ✅ | ✅ | ✅ | REAL |
| RBAC + Authority Matrix | ✅ | DB | ✅ | ✅ | ✅ | REAL |
| Hotel Procurement (catalog/orders) | ✅ | DB | ✅ | ✅ | ⚠️ | EMPTY (no DB) |
| Supplier Management | ✅ | DB | ✅ | ✅ | ⚠️ | EMPTY (no DB) |
| Order Processing | ✅ | DB | ✅ | ✅ | ⚠️ | EMPTY (no DB) |
| Invoicing | ✅ | DB | ✅ | ✅ | ⚠️ | EMPTY (no DB) |
| ETA E-Invoicing Submission | ✅ | External API | ✅ | ✅ | ✅ | UNAVAILABLE |
| Factoring/Oliv Integration | ✅ | External API | ✅ | ✅ | ✅ | UNAVAILABLE |
| Payment Processing (Fawry/Paymob) | ✅ | External API | ✅ | ✅ | ✅ | UNAVAILABLE |
| Shipping/Logistics | ✅ | DB | ✅ | ✅ | ⚠️ | EMPTY (no DB) |
| CRM/Lead Management | ✅ | DB | ✅ | ✅ | ⚠️ | EMPTY (no DB) |
| Marketing Campaigns | ✅ | DB | ✅ | ✅ | ⚠️ | EMPTY (no DB) |
| Intelligence Overview | ✅ | None | ❌ | ⚠️ | ✅ | UNAVAILABLE |
| Intelligence Discovery | ✅ | Seed data | ❌ | ❌ | ⚠️ | SEEDED |
| Intelligence Sources | ✅ | Seed data | ❌ | ❌ | ⚠️ | SEEDED |
| Intelligence Entities | ✅ | Seed data | ❌ | ❌ | ⚠️ | SEEDED |
| Intelligence Graph | ✅ | Seed data | ❌ | ❌ | ⚠️ | SEEDED |
| Intelligence Evidence | ✅ | Seed data | ❌ | ❌ | ⚠️ | SEEDED |
| Intelligence Findings | ✅ | Seed data | ❌ | ❌ | ⚠️ | SEEDED |
| Intelligence Opportunities | ✅ | Seed data | ❌ | ❌ | ⚠️ | SEEDED |
| Intelligence Monitoring | ✅ | Seed data | ❌ | ❌ | ⚠️ | SEEDED |
| Intelligence Actions | ✅ | Seed data | ❌ | ❌ | ⚠️ | SEEDED |
| Sourcing/Discovery | ✅ | External (web) | ✅ | ✅ | ⚠️ | UNAVAILABLE |
| Black Box Intelligence | ✅ | None | ❌ | ❌ | ❌ | PLANNED |
| AI Assistant | ✅ | LLM (Ollama) | ✅ | ✅ | ✅ | UNAVAILABLE |
| Background Workers | ✅ | Redis | ❌ | ❌ | ❌ | UNAVAILABLE |
| MCP Integrations | ✅ | External MCP | ❌ | ❌ | ❌ | PLANNED |

---

## C. DATA FLOW MAP

### AUTHENTICATION (REAL)
```
User → Login Page → POST /api/v1/auth/login
  → lib/auth/otp.ts → prisma.user.findUnique
  → Session creation → Cookie set → Dashboard
```
**Status:** ✅ Fully functional (when DB available)

### HOTEL PROCUREMENT (EMPTY)
```
Hotel Dashboard → GET /api/v1/hotel/catalog
  → prisma.product.findMany({ where: { tenantId } })
  → [] (no database)
```
**Status:** ❌ Returns empty (DB not running)

### INTELLIGENCE (SEEDED / UNAVAILABLE)
```
Intelligence Page → imports { HOTELS, SUPPLIERS } from "@/lib/data"
  → Renders static arrays as "live" intelligence
```
**Status:** ❌ Misleading — seed data presented as live

### AI ASSISTANT (UNAVAILABLE)
```
Chat UI → POST /api/v1/ai/assistant
  → streamText({ model: ollama("llama3.2:3b") })
  → ERROR: Ollama not running → Fallback to executeLLM
  → executeLLM uses Groq/OpenRouter (no API key configured)
```
**Status:** ❌ No LLM provider available

---

## D. INTELLIGENCE / BLACK BOX REALITY

### What EXISTS (code only, no data)

| Module | Lines | External Calls | DB | Output |
|--------|-------|---------------|-----|--------|
| core/types.ts | 60 | ❌ | ❌ | Type definitions |
| core/adapters/spec.ts | 28 | ❌ | ❌ | Adapter interface |
| adaptive/demo-investigator.ts | 163 | ❌ | ❌ | Simulation loop |
| adaptive/investigation-engine.ts | 89 | ❌ | ❌ | State machine |
| adaptive/procurement-workflow-link.ts | 96 | ❌ | ✅ | Links orders to intel |
| adaptive/supplier-onboarding-pipeline.ts | 76 | ❌ | ✅ | Pipeline stages |
| adaptive/temporal-intelligence.ts | 71 | ❌ | ❌ | Time-based analysis |
| adaptive/relationship-discovery.ts | 61 | ❌ | ❌ | Relationship mapping |
| adaptive/window-expansion.ts | 63 | ❌ | ❌ | Search expansion |
| adaptive/target-qualification.ts | 134 | ❌ | ❌ | Target scoring |
| adaptive/document-intelligence-pipeline.ts | 65 | ❌ | ❌ | Document stages |
| security/authorized-testing.ts | 82 | ❌ | ❌ | Auth-controlled testing |
| graph/entity-resolution.ts | 67 | ❌ | ❌ | Entity dedup |
| findings/taxonomy.ts | 56 | ❌ | ❌ | Finding categories |

### Key Finding

**The intelligence layer is a structural skeleton.** No module makes actual external API calls, performs real web scraping, or processes live data. The "demo-investigator" explicitly states it demonstrates the loop architecture — it does not discover real entities.

---

## E. SEED DATA INVENTORY

### `lib/data.ts` (398 lines)

| Export | Items | Consumed By |
|--------|-------|-------------|
| CATEGORIES | 12 | Hotel catalog, marketplace |
| SUPPLIERS | 8 | 15 pages (marketing, intelligence, dashboard) |
| HOTELS | 6 | 10 pages (intelligence, dashboard, admin) |
| PARTNERS | 4 | Marketing pages |
| CARRIERS | 3 | Logistics pages |
| PRODUCTS | 20+ | Catalog, marketplace, cart |

### `data/*.json` files

| File | Size | Content |
|------|------|---------|
| coastal-hotels.json | 17KB | Hotel data for coastal regions |
| red-sea-suppliers.json | 34KB | Supplier data for Red Sea area |
| egyptian-market-v2.json | 61KB | Market research data |
| verified_executive_leads.json | 2KB | CRM lead data |
| cms-content.json | 8KB | Marketing content |

### Pages Using Seed Data (25 total)

**Marketing:** suppliers, marketplace, marketplace/[product], analytics, login, eta-compliance, financing, invoices

**Dashboard:** dashboard, intelligence (9 pages), cart, receiving, orders, supplier, supplier/catalog, supplier/orders

**Admin:** admin/users

---

## F. EXTERNAL CONNECTOR REALITY

| Connector | Package | Configured | Authenticated | Executable |
|-----------|---------|------------|---------------|------------|
| Ollama | ollama-ai-provider | ✅ URL set | N/A | ❌ Not running |
| Groq | @ai-sdk/groq | ❌ No key | ❌ | ❌ |
| OpenRouter | openrouter | ❌ No key | ❌ | ❌ |
| xAI | xai | ❌ No key | ❌ | ❌ |
| Fawry | fawry | ❌ Test mode | ❌ | ❌ |
| Paymob | paymob | ❌ Test mode | ❌ | ❌ |
| Instapay | instapay | ❌ Test mode | ❌ | ❌ |
| ETA Tax Authority | eta/client | ❌ No sandbox creds | ❌ | ❌ |
| Oliv Fintech | oliv | ❌ No API key | ❌ | ❌ |
| Google Places | lib/sourcing/apify | ❌ No Apify token | ❌ | ❌ |
| Firecrawl | firecrawl | ❌ No API key | ❌ | ❌ |
| Supabase | @supabase/supabase-js | ❌ No URL/key | ❌ | ❌ |

---

## G. DATABASE REALITY

- **Provider:** PostgreSQL 16
- **Connection:** `postgresql://***:***@localhost:5432/hotels_vendors`
- **Status:** ❌ Not running locally
- **Schema:** 110 models, 93 enums, 3,639 lines
- **Migrations:** 12 migrations (2026-05-01 to 2026-08-05)
- **Seed files:** 6 seed scripts
- **Current data:** None accessible (no running DB)

### Models by Category

| Category | Count | Examples |
|----------|-------|----------|
| Auth/RBAC | 8 | User, Role, Permission, Session, OtpVerification |
| Procurement | 12 | Order, OrderItem, Product, Cart, CartItem |
| Finance | 14 | Invoice, Payment, CreditFacility, FactoringRequest |
| Intelligence | 8 | Lead, Competitor, MarketInsight, Document |
| Logistics | 10 | Shipment, Trip, TripStop, LogisticsHub |
| CRM/Marketing | 8 | LeadCapture, MarketingCampaign, SocialPost |
| ETA Compliance | 6 | EtaCredential, EtaDeadLetterJob |
| Platform | 10 | Tenant, AuditLog, PlatformSettings |

---

## H. API REALITY

**Total API routes:** 225

### By Status

| Status | Count |
|--------|-------|
| Fully implemented (DB-backed, ready) | 177 |
| Static/mock responses | 18 |
| Missing route files | ~30 (dynamic routes with missing implementations) |

### Key API Routes

| Method | Path | Auth | Status |
|--------|------|------|--------|
| POST | /api/v1/auth/login | Public | REAL |
| POST | /api/v1/auth/register | Public | REAL |
| GET | /api/v1/auth/me | Authenticated | REAL |
| GET | /api/v1/orders | Authenticated | EMPTY |
| POST | /api/v1/orders | Authenticated | EMPTY |
| GET | /api/v1/hotel/catalog | Authenticated | EMPTY |
| GET | /api/v1/supplier/products | Authenticated | EMPTY |
| GET | /api/v1/intelligence/trust-score/[entityId] | Authenticated | REAL (computes score) |
| GET | /api/v1/sourcing/discovery | Authenticated | UNAVAILABLE |
| POST | /api/v1/sourcing/acquire | Authenticated | UNAVAILABLE |
| GET | /api/v1/crm/leads | Authenticated | EMPTY |
| POST | /api/v1/crm/leads/[id]/outreach | Authenticated | EMPTY |

---

## I. CRITICAL GAPS (Ranked)

### 1. BLOCKS REAL PRODUCT OPERATION
- **No running PostgreSQL database** — all data operations are impossible
- **No Redis** — rate limiting, session caching, background queues non-functional

### 2. BLOCKS REAL INTELLIGENCE
- **No external data source connected** — intelligence is all seed/simulation
- **No LLM provider available** — AI assistant non-functional

### 3. BLOCKS COMMERCIAL OPERATION
- **Payment gateways in test mode only** — no real transactions possible
- **Factoring/Oliv integration unconfigured** — no liquidity injection

### 4. BLOCKS USER TRUST
- **Seed data presented as live** — misleading intelligence pages
- **No real supplier/hotel data** — marketplace is fiction

### 5. TECHNICAL DEBT
- **Provider version mismatch** — ollama-ai-provider (V1) vs ai (V7)
- **Middleware deprecated** — `middleware.ts` should become `proxy.ts`
- **TypeScript any usage** — several files use `any` for seed data typing

---

## J. RECOMMENDED NEXT EXECUTATION UNIT

### Bounded Implementation: **Honest Intelligence States**

**Why this first:**
- Highest user-trust risk (seed data presented as live intelligence)
- Smallest scope (UI changes only, no new infrastructure)
- Unblocks future work (clear separation of real vs unavailable)

**Scope:**
1. Replace `import { HOTELS, SUPPLIERS } from "@/lib/data"` with honest empty states on all 9 intelligence pages
2. Show clear "No intelligence data available" / "Connect a data source" messaging
3. Keep seed data files for development reference but don't render them as live
4. Add `data-source-indicator` component showing real vs seed vs empty

**Out of scope (future units):**
- Database provisioning
- External API integrations
- LLM provider configuration
- Real data pipeline implementation

**Estimated effort:** 2-4 hours

---

## VERIFICATION

```bash
cd /Users/Moatazi/hotels-vendors-new
echo "=== Build ===" && npm run build > /tmp/build.log 2>&1; echo "BUILD_EXIT=$?"
echo "=== Routes ===" && find app/api -name "route.ts" | wc -l
echo "=== Pages ===" && find app -name "page.tsx" | wc -l
echo "=== Seed imports ===" && grep -rl "from \"@/lib/data\"" app | wc -l
echo "=== Prisma models ===" && grep "^model " prisma/schema.prisma | wc -l
echo "=== DB status ===" && pg_isready -h localhost -p 5432 2>&1 || echo "DB not running"
```
