# HOVIN Product Operating Blueprint

**Purpose:** Define one coherent, revenue-capable operating product for hospitality procurement, delivery, evidence, and consented external financing. This is a target product contract and delivery order, not a claim that the current app already implements it.

**Review basis:** Local source review of `/Users/Moatazi/hotels-vendors-new` and a read-only view of the live registration page on 2026-10-05. The working tree already contains user changes. No source code, database, or production setting was changed.

## 1. Product promise

HOVIN helps hospitality businesses control purchasing from need to verified receipt, gives suppliers and carriers a clear execution workspace, and presents financing only when a real, eligible, documented transaction exists. The Virtual Shadow is a guided assistant and evidence-backed analyst: it explains the next action, prepares work for review, and records what it did. It does not silently approve spend, disclose private account data, or claim a lender paid funds when that has not been confirmed.

Success means an account can complete a transaction with fewer manual handoffs, full traceability, and a measurable commercial outcome. A menu of screens is not success.

## 2. Organizations and roles

“Buyer” and “supplier” describe network roles. The buyer organization profile describes the business: restaurant, restaurant group, café, caterer, hotel, or multi-property operator. Each organization may have multiple locations, cost centers, legal entities, and approval rules.

| Workspace | Primary work | Data boundary |
|---|---|---|
| Buyer hospitality business | Set demand, approve purchasing, receive goods, reconcile invoices, review funding options | Its organization and authorized locations |
| Supplier | Maintain approved catalog/prices, acknowledge and fulfill orders, submit invoices, see its own settlement/funding status | Its organization and its own transactions |
| Carrier | Accept assigned jobs, report milestones, capture delivery proof and exceptions | Assigned shipments and minimum delivery data |
| Funder | Review transactions explicitly shared for a funding decision; return decision and payout status | Only consented, minimized deal-room data |
| Account administrator | Manage members, roles, locations, approval policy, integrations, consent history, audit exports | All authorized records in its tenant |
| HOVIN operations administrator | Resolve platform issues, integration failures, disputes, and abuse | Limited, logged support access; no routine business decision authority |

An organization administrator can delegate location-level purchasing and receiving permissions. Finance approval, user administration, evidence access, and external data-sharing consent must be separately permissioned. No browser-side role switch is an authority source.

## 3. The operating spine

1. **Register and establish the account.** Select a network role; for a buyer, identify organization type and locations. Verify the user and business identity. The Virtual Shadow explains each step, saves progress, and distinguishes required from optional setup.
2. **Set operating controls.** Invite colleagues; assign account, property, procurement, receiving, finance, and audit roles; configure thresholds and approval limits; set currencies, tax details, delivery windows, and purchasing categories.
3. **Choose data connections.** Explain what each connection reads and writes. Offer manual entry and CSV as first-class paths. Keep integrations disconnected until credentials and a live test succeed.
4. **Complete onboarding and consent.** Present terms, privacy/data-security explanation, retention and sharing choices, named external recipients, data categories, purpose, and revocation. The designated authorized user accepts applicable terms. Record version, timestamp, actor, organization, purpose, and scope. Do not treat a self-marked checkbox as verification.
5. **Create demand.** Reorder alerts or a user request create a requisition. Show catalog price, unit, quantity, availability, delivery estimate, substitution rules, taxes, and budget/approval impact. Use fixed supplier offers by default; RFQs are a deliberate buyer action where pricing is genuinely unknown.
6. **Approve and place the order.** Apply the organization’s approval matrix, record each decision and reason, then create a stable purchase order. Supplier acknowledgment, partial acceptance, backorder, cancellation, and change requests become explicit states and tasks.
7. **Track fulfillment.** Assign a carrier or record the agreed delivery method. Show order, shipment, stop, ETA, responsible party, and timestamped milestones. Failed syncs and missed ETAs create visible exceptions with an owner and next action.
8. **Receive goods.** Staff open the expected order on a phone, scan a mapped barcode or select the line, enter received/accepted/rejected quantities, record damage/lot/expiry where relevant, attach delivery-note/photo evidence, and capture recipient sign-off. Support partial deliveries and more than one receipt per order. The server recalculates remaining quantities; the client cannot mark a whole order delivered by assertion.
9. **Match and resolve.** Match PO, accepted GRN, and supplier invoice. Validate quantities, unit conversions, prices, tax metadata, and credits. Route discrepancies to the right buyer/supplier with evidence, owner, due date, resolution, and a complete history. A mismatch blocks automated funding and settlement until resolved or explicitly overridden by an authorized person.
10. **Offer financing only when eligible.** Show provider identity, gross invoice, eligible amount, fees, net proceeds, repayment/maturity, recourse, data shared, and decision owner. Require explicit consent by an authorized user for that provider and purpose. Track submitted, under review, approved, declined, payout pending, paid by provider, partially settled, and settled as separate states. “Request submitted” never means “funded.”
11. **Close and learn.** Reconcile provider remittance and buyer settlement against the invoice and ledger. Show realized savings, fees/revenue, delivery performance, discrepancies, and unresolved actions. The Virtual Shadow explains recommendations with linked evidence and lets an authorized user accept, edit, or dismiss them.

### Required event record

Each material state transition records: tenant and organization/location, entity and stable ID, actor and effective role, permission used, action, before/after values, timestamp, source (user, integration, system, test), correlation/idempotency key, related evidence, and result. Audit history is append-only to application roles, exportable by authorized account admins, and tenant-scoped in both list and export operations. Hash-chain verification must run over the exact exported tenant slice and report failures; “tamper-proof” must not be claimed without this verification and protected storage/backup controls.

## 4. Exceptions are part of the workflow

Every background or external action must end in a visible outcome: completed, waiting for a person/provider, retry scheduled, failed, or canceled. Each failure shows a plain-language explanation, owner, safe retry action, and whether data may have been accepted by the external system. Retries must be idempotent. Reconciliation views compare HOVIN state with provider/ERP state instead of silently overwriting either.

Handle at minimum: duplicate event, stale price, unavailable stock, approval timeout, supplier rejection, split shipment, delivery no-show, partial/damaged receipt, missing invoice, tax validation failure, duplicate invoice, lender decline, payout timeout, webhook signature failure, ERP outage, and user consent withdrawal. Never convert these into success-shaped placeholders.

## 5. Dashboards that help each person finish work

Dashboards are task queues first, performance summaries second. Every number must identify its date range, tenant/location scope, data source, and whether it is live, delayed, test, or unavailable.

- **Buyer home:** items needing approval; open orders by delivery state; today’s expected deliveries; receiving discrepancies; invoices awaiting match/payment; funding offers requiring consent; budget and spend by location; savings actually realized.
- **Supplier home:** orders needing acknowledgment/fulfillment; stock or price exceptions; scheduled deliveries; invoices needing correction; provider decision/payout state; performance and dispute history.
- **Carrier home:** assigned jobs, next stop, contact and minimum delivery instructions; ETA/missed-stop tasks; POD capture; incident/claim submission; sync status.
- **Funder workspace:** consent-valid eligible cases only; masked evidence by default; clear document provenance; decision and payout actions; expiry/revocation and access history.
- **Account administration:** members and access review; locations and rules; onboarding completion; integration health and last successful sync; consents and revocations; audit search/export; retention and security events.
- **HOVIN operations:** errors and queue backlog, failed webhooks, unmatched/replayed events, provider outages, pending disputes, release health, and support access log. Support tools never impersonate a tenant silently.

Remove or label sample rows, demo figures, mock provider actions, and simulated dashboards. Empty states must explain the first real action and must not present zero as proof that a system is connected.

## 6. Integrations: useful, staged, and honest

Build one connector contract before building a long provider list. Each connector needs tenant-owned credentials, least-privilege scopes, field mapping, test connection, idempotent inbound/outbound sync, webhook signature validation, retry/dead-letter handling, reconciliation, last-success timestamp, and an audit record. Secrets are never exposed in the UI or logs.

1. **Launch path:** manual entry and reviewed CSV import/export for product catalog, PO, receipt, and invoice data.
2. **First pilot adapters:** select one buyer’s actual accounting/ERP system and one supplier/product data route based on pilot demand. Candidate categories include Oracle OPERA/OPERA Cloud property data, Oracle NetSuite, SAP, and Microsoft Dynamics finance/procurement systems; validate actual APIs, access rights, and customer demand before promising support.
3. **Next:** webhook/API connectors and accounting/POS/inventory systems chosen from real pilot usage. Publish supported object/event coverage and sync direction for every adapter.
4. **Never label a logo as connected** until credentials pass a live non-destructive test and a real sync job is recorded.

Keep procurement, finance, and data-sharing consent independent: connecting an ERP does not consent to sending its data to a lender.

## 7. Mobile operating experience

Prioritize responsive mobile web for receiving staff, drivers, and approvers. The core mobile tasks are: find assigned order/stop; inspect the PO; record quantities; capture discrepancies and images; sign for receipt/delivery; submit; see a durable confirmation and audit reference. Use large controls, low-bandwidth pages, clear Arabic/English directionality, and camera/barcode access only at the moment it is needed.

Start online with safe retry and visible upload status. Add offline capture only after records have client-generated IDs, idempotent sync, conflict resolution, encrypted local storage, and a clear “queued / synced / needs attention” state. An installable manifest alone is not offline capability. Defer a native app until the same workflow is proven on mobile web and a pilot shows a native-only need.

## 8. Revenue and trust model

Revenue must be attributable to a real value event: marketplace transaction fee, paid organization service tier, measurable savings service, or qualified external funding referral where legally and contractually permitted. Show the payer, trigger, calculation, invoice/ledger reference, reversal/refund handling, and whether revenue is test or realized. HOVIN is not presented as a lender and does not imply capital was disbursed by a provider before a verified provider event.

Keep a commercial dashboard for HOVIN operations: active transacting organizations, repeat order rate, gross merchandise value, fulfilled order rate, realized take-rate/revenue, cost to serve, dispute/return rate, partner conversion, and retention. Separate pipeline estimates from recognized revenue.

## 9. Delivery plan: stabilize before expanding

### P0 — Make the existing core truthful and safe
- Reconcile the checked-out repo, deployed release, and active route family; fix authenticated internal-server errors before expanding scope.
- Fix audit API tenant isolation, export verification, and audit-screen/API field contract. Prove account-admin access and cross-tenant denial.
- Remove success-shaped no-ops and sample states from POD, integrations, financing, and dashboards; label remaining simulations.
- Make current order, receipt, invoice, consent, and funding states agree in the database and user interface.
- Add trace IDs and actionable failure messages to every 500/failed background or partner call.

### P1 — Close one real procurement loop
- Account/location/member/approval setup with guided, resumable onboarding and final legal/consent step.
- Buyer requisition → approval → PO → supplier acknowledgment → shipment tracking → partial/full GRN with proof → invoice match → payment/settlement.
- Durable records, evidence attachments, audit events, and tenant-admin visibility at every transition.
- Exception queue and reconciliation for the failure cases above.

### P2 — Deliver trustworthy external finance and integrations
- Eligible invoice → explicit provider-specific consent → lender submission → provider decision → confirmed payout → settlement.
- Use a clearly labeled sandbox provider flow if no live lender connection exists; never create ledger entries that imply real disbursement.
- CSV connector and one customer-validated ERP/PMS adapter with monitored sync and recovery.

### P3 — Make intelligence and mobile productive
- Virtual Shadow guides setup and surfaces recommendations only with evidence, confidence, freshness, and a user action.
- Mobile receiving and delivery workflows; then prove field completion and sync reliability in a pilot.
- Expand adapters and automation based on observed volume, failure rates, and willingness to pay—not a logo list.

## 10. Release acceptance gates

Do not call a workflow complete until all relevant checks pass:

- A new restaurant, café, caterer, hotel, and multi-location buyer can be represented without pretending all buyers are hotels.
- Each role sees only permitted tenant/transaction data; tests prove cross-tenant access is denied for reads and exports.
- Every action can be traced from user/system event to database record, evidence, and audit history.
- A partial receipt cannot mark unreceived quantities delivered; repeat webhook/retry cannot duplicate orders, invoices, ledger entries, or payouts.
- A PO–GRN–invoice discrepancy blocks downstream funding until resolved by an authorized actor.
- Financing tests distinguish simulation, submitted request, provider approval, confirmed payout, and settlement.
- User consent is specific, versioned, revocable, and checked at data-share time.
- Dashboard totals reconcile to source records and clearly state live/test/stale/unavailable.
- Mobile tasks complete at phone width with screen-reader labels, keyboard/focus support where applicable, upload/error recovery, and no hidden horizontal-only action.
- Production error monitoring, database readiness checks, queue health, backups/restore rehearsal, and release/source identity are verified before launch.

## 11. Current source-review signals to resolve first

- Live registration now visually separates buyer/supplier workspaces from invited carrier/funder portals, but buyer onboarding remains labeled “HOTEL” and asks for hotel/property-specific setup. Rename this to a hospitality-business organization and capture business type and locations.
- The onboarding page allows users to mark phone, KYC, and other steps complete themselves; those steps need server/provider verification and a recorded reviewer/outcome.
- The integrations screen includes hard-coded sync jobs, webhooks, three-way matches, and budget figures; its visible “Test,” “Configure,” upload, and sync controls are not evidence of connected integrations.
- Audit work remains split across two identity and shell families: the newer `(dashboard)` layout authenticates with Clerk, while `/admin/audit` is in the legacy `(admin)` AppProvider/RequireAuth shell and calls a custom-session API. A local export fix now filters records by tenant and gives its digest a clearly stated scope; however, the global chain verifier and role-to-screen/API wiring are still unproven. Account-owner audit access is not complete until it is reached through the active account shell and passes tenant/role tests.
- Shipping POD has a concrete UI/API contract failure: the page requests a trip list without `tripId`, but GET requires `tripId` and returns one trip summary. Its submit button previously closed the dialog without calling the API. The existing mutation authenticates but has no shipping permission check; it can mark a stop captured without photo/signature, accepts but does not persist recipient/notes, checks all stops by trip ID without tenant scope, and completes the trip without an audit event. Do not treat POD as operationally complete until secure evidence capture, authorized mutation, tenant-safe completion, durable actor/recipient details, and audit history are implemented and tested.
- The GRN list pages are not a substitute for an itemized receiving workflow. Scan, status changes, discrepancy evidence, and audit writes need to form one durable transaction path.
- Product status docs contradict the current schema and mobile architecture notes. Replace capability labels with release-specific evidence: tested environment, route, role, expected state, and date.

**Working rule:** Stabilize and prove one end-to-end transaction path before implementing more modules. Every new capability must make that path measurably easier, safer, or more profitable.
