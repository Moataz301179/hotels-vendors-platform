# HotelsVendors — Working Application Layer: Benchmark-Backed Interface Specification

**Owner:** Hermes (execution) · **Status:** Approved for implementation · **Date:** 2026-11-07
**Scope:** The authenticated workspace (`app/(app)/`) for all five roles — Hotel, Vendor, Carrier, Funder, Admin.
**Non-goal:** No change to the public marketing site, the ETA bridge, or the Authority Matrix rules.

---

## 1. Why this spec exists

The current workspace is a real app shell — sidebar navigation, role-based groups, a dashboard, and ten workflow routes. The complaint is not that the app layer is absent; it is that it reads as **generic and frictional** next to modern procurement platforms. This spec closes that gap with features that are proven in production procurement software, not invented.

Every recommendation below is sourced from a named benchmark (Section 2) and translated into a concrete HotelsVendors screen, control, or workflow (Sections 3–6).

---

## 2. Benchmarks consulted

| Benchmark | What it proves | What HV adopts |
|---|---|---|
| **Zapro** — procurement SaaS dashboard redesign | Modular adaptive layout; Quick Access dock; AI shown only when present; design around user stages | Modular dashboard blocks; a persistent Quick Access rail; the HOVIN assistant as an optional surface |
| **Sight** — procurement analytics dashboard | Sidebar = workflows (Dashboard, Spend, Sourcing, Contracts, Suppliers, POs, Risk); KPI strip; spend-by-category; savings vs target | Workspace sidebar keeps workflow groups; dashboard gains a KPI strip with drill-down |
| **Tally** — PO intelligence dashboard | Approval queue with urgent actions; committed-spend vs budget; PO status log | "Needs Your Action" queue with real counts and one-click routes |
| **Inity** — 7 procurement UX patterns | Progressive disclosure; role-based interfaces; smart defaults; contextual actions; visual workflow status; powerful search; actionable dashboards | Adopted as the interaction contract in Section 5 |
| **Precoro** — dashboard | "Needs Your Action" section at the top; analytics tabs; budget progress bars; AI assistant reachable from any chart | Action queue above the fold; HOVIN reachable from KPI cards |
| **BluePMS Purchase** | Command center: approvals, ready demand, RFQs, suppliers, open orders, shortcuts, reports — one surface | The workspace header's primary action becomes a real command surface |
| **Inn-Flow** | One search across every vendor; real-time budget by GL code; approval workflows by property and spend | Global search across catalog + orders + RFQs; budget/limit visibility in the sourcing flow |
| **Hostly** | Requisition → approve → source → PO → receive → settle, with an approval trail and goods receipts | Already the HV RFQ→quote→order→GRN chain; this spec adds the visual trail |
| **Atrium** | Invoice-first intelligence; price drift; budget pressure; supplier concentration; multi-property rollup; plain-English Q&A | Market Compass + HOVIN as the intelligence layer; price drift surfaced in the catalog |
| **Coupa / Amazon Business** | Spend Pulse; Guided Buying; 3-way match; AI agents | Guided sourcing (the catalog default) and 3-way match at receiving |
| **Veld Systems** — SaaS admin dashboard | Global search in the header is the most-used feature; sidebar = workflows not tables; contextual detail panel; real-time indicators; saved filters; audit log | Global search + ⌘K palette; detail drawer; saved views |
| **OTF / Balaux / Stack-one-logs** | ⌘K palette = fused navigation + lookup + action, with recents and a strict keyboard contract | Command palette spec in Section 6 |
| **SmoothUI** — dashboard recipe | Operator layout: topbar (title · global filter · ⌘K) → status strip → filter row → dominant work queue | The workspace body layout contract |

---

## 3. Information architecture (target)

```
app-shell
├── app-top                     ← global search + ⌘K trigger + role context + primary action + alerts + user
└── side-layout
    ├── side                    ← workflow groups (already role-based)
    └── app-body
        ├── page-header         ← title · breadcrumb · page-level filter · saved views · export
        ├── action-queue        ← "Needs Your Action" — real counts, one click
        ├── kpi-strip           ← 3–5 metrics with drill-down + sparkline
        ├── work-queue          ← the dominant surface (60%+ of viewport)
        ├── detail-drawer       ← slide-over; never loses list context
        └── intelligence        ← HOVIN assistant (optional, tenant-scoped)
```

---

## 4. Role dashboards (target home screens)

Each role gets a **tailored home**, not the same template. The dashboard already selects a model per role; this spec upgrades the *content* of each model.

### 4.1 Hotel — "Today"
- **Action queue:** RFQs awaiting response-window close · quotes ready to decide · orders awaiting approval · GRNs awaiting receipt · exceptions.
- **KPI strip:** Open sourcing requests · Orders in flight · Spend committed this month · Savings vs. baseline · Suppliers at risk.
- **Work queue:** The sourcing list (default), with category chips and a persistent search.
- **Intelligence:** HOVIN — "Find guest-room supplies for 20 rooms", "What is running low?", "Which RFQs are ready to decide?"

### 4.2 Vendor — "Today"
- **Action queue:** Allocated RFQs to answer · awarded orders to confirm · fulfilment exceptions · invoice records to prepare.
- **KPI strip:** Assigned RFQs · Active catalogue records · Orders to fulfil · Average fulfilment time · Rejection rate.
- **Work queue:** RFQ inbox with response deadlines and a one-click "Submit terms".

### 4.3 Carrier — "Today"
- **Action queue:** Assigned movements · pickups to confirm · deliveries to record · exceptions to escalate.
- **KPI strip:** Delivery tasks · On-time handoffs · Open exceptions · Distance this week.

### 4.4 Funder — "Today"
- **Action queue:** Referrals to assess · evidence packets to review · decisions to record · reconciliations to close.
- **KPI strip:** Funding records · Authorized orders · Portfolio yield · Overdue referrals.

### 4.5 Admin — "Control overview"
- **Action queue:** Pending users · catalogue reviews · trust & access · policy changes.
- **KPI strip:** Review queue · Audit-ready orders · Active tenants · Open exceptions.

---

## 5. Interaction contract (the 7 patterns, as rules)

1. **Progressive disclosure.** Show only the current step. Optional fields live behind "Add specifications" / "Attach documents". Never a 15-field form on one screen.
2. **Role-based interfaces.** The sidebar groups, the dashboard model, and the action queue are all role-derived. No role sees another role's queue.
3. **Smart defaults.** Repeat purchases pre-fill the last supplier, cost center, and quantity. Every default is visibly editable with one click.
4. **Contextual actions.** Row hover reveals the primary action; a slide-over drawer opens details without losing list context; bulk actions show a preview before execution.
5. **Visual workflow status.** Every order/RFQ shows: the full chain with the current step highlighted, the named assignee ("Waiting on Sarah Chen"), a time indicator ("2 days in this step"), and color-coded urgency (on track / attention / overdue).
6. **Search and filter that works.** Global search in the header; faceted filters (status, category, supplier, amount, date); saved views; natural-language via HOVIN.
7. **Actionable dashboards.** Every metric leads somewhere. No number without a "so what".

---

## 6. Command palette (⌘K)

**Trigger:** `⌘K` (macOS) / `Ctrl+K` (Windows/Linux). Opens a single popover. `Esc` closes. `↑`/`↓` navigate. `Enter` activates. Nothing else is rebound.

**Three fused surfaces, grouped with headers:**
- **Jump** — navigation destinations for the signed-in role.
- **Find** — entity lookup across the tenant: products, RFQs, quotes, orders, suppliers, shipments.
- **Actions** — verbs: "New requirement", "Create RFQ", "Record receipt", "Export orders", "Invite teammate".

**Behavior:**
- Empty state shows search modifiers, the three most recent items (persisted), and quick actions.
- Results are grouped by type, capped per group, with a "View more" link.
- Every result carries an icon and a secondary line.
- Recents persist per user and are cleared only explicitly.

**API:** `GET /api/v2/search?q=&types=products,rfqs,orders,suppliers` — tenant-scoped, RBAC-enforced, read-only.

---

## 7. Visual workflow status (the order/RFQ trail)

Replace the single status pill with a **chain + assignee + time** block:

```
●──────●──────◐──────○──────○
Request  Review  Approve  Order  Receive
                 ↑ current · Waiting on Sarah Chen · 2 days
```

- Chain steps are always visible; the current step is highlighted.
- Below: named assignee, time in step, and an urgency color.
- Clicking a step opens the detail drawer with that stage's evidence.

---

## 8. Delivery plan

| Phase | Deliverable | Value |
|---|---|---|
| **1** | Command palette (⌘K) + global search API + header trigger | The single biggest "this is a real app" signal |
| **2** | "Needs Your Action" queue on every role dashboard | Clicks → decisions, not browsing |
| **3** | Visual workflow status chain on orders/RFQ rows | Status readable in 3 seconds |
| **4** | Detail drawer (slide-over) for orders, RFQs, quotes | No context loss |
| **5** | Saved views + faceted filters on the work queues | Power-user speed |
| **6** | KPI drill-down + sparklines | Every metric leads somewhere |

---

## 9. Guardrails (unchanged, non-negotiable)

- **G1 tenant isolation:** the search API and every new query are tenant-scoped.
- **G2 RBAC server-side only:** the palette renders only what the role may see; the API re-checks.
- **G3 Authority Matrix:** no palette action may bypass an approval step.
- **G6 AI:** HOVIN stays tenant-scoped, read-only, and optional.
- **G8/G9:** new components in `components/v2/`, new routes under `app/api/v2/`.
