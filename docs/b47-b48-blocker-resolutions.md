# B47/B48 External Blocker Resolutions

> **Status:** Design-complete, implementation-ready. No production mutation.
> **Date:** 2026-10-31
> **Scope:** Resolve the four external blockers preventing B47/B48 supplier-list and price-comparison production readiness.

---

## 1. Hotel PMS/ERP E-Invoice Source Connector Specification

### Problem
No hotel has provided an e-invoice API/webhook/export specification. B47 ingestion cannot proceed without a controlled, hotel-specific source connector.

### Resolution: Abstraction-First Connector Architecture

Instead of waiting for each hotel to expose a custom API, implement a **connector-agnostic ingestion framework** with three layers:

#### Layer A: Canonical Ingestion Contract
**File:** `lib/integration/connectors/einvoice-contract.ts`

```typescript
export interface EinvoiceConnector {
  readonly id: string;
  readonly name: string;
  readonly hotelId: string;
  readonly tenantId: string;
  status: 'ACTIVE' | 'PAUSED' | 'FAILED';
  config: Json;
  lastSyncAt?: Date;
  lastError?: string;
}

export interface EinvoiceLineItem {
  supplierName: string;
  supplierTaxId?: string;
  productName: string;
  productCategory?: string;
  quantity: number;
  unitPrice: Decimal;
  totalAmount: Decimal;
  currency: string;
  invoiceDate: Date;
  sourceLineItemId: string;
}

export interface EinvoicePayload {
  invoiceId: string;
  invoiceNumber: string;
  issueDate: Date;
  hotelId: string;
  supplierName: string;
  supplierTaxId?: string;
  lineItems: EinvoiceLineItem[];
  raw?: Json; // original payload for audit
}
```

#### Layer B: Adapter Registry
**File:** `lib/integration/connectors/einvoice-registry.ts`

```typescript
type AdapterFactory = (config: Json) => EinvoiceConnectorAdapter;

interface EinvoiceConnectorAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  fetchInvoices(since?: Date): Promise<EinvoicePayload[]>;
  healthCheck(): Promise<boolean>;
}
```

**Built-in adapters (implement now, activate per hotel):**
1. **File-drop adapter** — hotel drops CSV/JSON/XML into SFTP/FTPS/Azure Blob; platform polls and ingests. Zero API integration required.
2. **Webhook adapter** — hotel POSTs to `POST /api/v1/webhooks/einvoice/[hotelId]` with HMAC signature. Stateless, replay-safe.
3. **OPERA PIE adapter** — reads Oracle Opera reports via hotel-provided read-only DB view or CSV export (no direct DB connection).
4. **Generic REST adapter** — hotel provides OpenAPI/Postman collection; platform generates fetch adapter from spec.

#### Layer C: Hotel-Onboarding Flow
**Route:** `POST /api/v2/integrations/einvoice-connectors`

```typescript
const createSchema = z.object({
  hotelId: z.string().min(1),
  adapterType: z.enum(['FILE_DROP', 'WEBHOOK', 'OPERA', 'GENERIC_REST']),
  config: z.record(z.any()),
  consentId: z.string().min(1), // required consent record
});
```

**Onboarding sequence:**
1. Hotel admin uploads consent record (`consent:manage` permission required).
2. Admin selects adapter type and provides config (SFTP creds, webhook secret, etc.).
3. Platform validates connectivity via `healthCheck()`.
4. Connector status set to `ACTIVE`; ingestion job scheduled.

**Implementable now:** Layers A and B (adapter interfaces + file-drop adapter). No hotel-specific integration required.

**External dependency:** Hotel selects adapter type and provides credentials/config.

---

## 2. Supplier Opt-In for Connected Price Feeds

### Problem
Connected supplier prices are private contractual data. A supplier must explicitly opt in per integration agreement.

### Resolution: Tiered Supplier Consent + SLA

#### Model Changes
**File:** `prisma/schema.prisma` (append to `Supplier` model)

```prisma
model Supplier {
  // ... existing fields ...
  priceFeedConsentStatus   SupplierConsentStatus @default(NOT_REQUESTED)
  priceFeedConsentedAt     DateTime?
  priceFeedConsentExpiresAt DateTime?
  priceFeedSlaLevel        String? // 'STANDARD' | 'PRIORITY' | 'REAL_TIME'
}
```

```prisma
enum SupplierConsentStatus {
  NOT_REQUESTED
  REQUESTED
  GRANTED
  REJECTED
  EXPIRED
  REVOKED
}
```

#### Permission
Already added in seed: `price:compare`. Supplier-facing route requires `price:feed:write`.

#### API Route: Supplier Opt-In/Out
**Route:** `POST /api/v2/supplier/price-feed/consent`

```typescript
const consentSchema = z.object({
  optIn: z.boolean(),
  slaLevel: z.enum(['STANDARD', 'PRIORITY', 'REAL_TIME']).default('STANDARD'),
  scope: z.array(z.string()).default([]), // product IDs or categories
});

export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor || actor.platformRole !== 'SUPPLIER') {
    return NextResponse.json({ error: 'SUPPLIER_ROLE_REQUIRED' }, { status: 403 });
  }
  // ... validation, update supplier record, audit ...
}
```

#### Commercial Terms
- **STANDARD:** Daily batch, 24h delay, included in base subscription.
- **PRIORITY:** Hourly push, 1h delay, +0.5% platform fee on compared orders.
- **REAL_TIME:** Webhook on price change, <5min delay, +1.0% platform fee.

**Implementable now:** Schema change, API route, supplier dashboard UI toggle. No supplier agreements required to build.

**External dependency:** Supplier signs terms; platform admin enables SLA tier per supplier.

---

## 3. ETA CAdES-BES Signing Bridge

### Problem
ETA requires CAdES-BES signature embedded in every invoice document. Current code fails closed for unsigned submissions. No signing bridge exists.

### Resolution: Hardware-First, Software-Fallback Bridge

#### Architecture
```
Invoice Worker → Signing Bridge → ETA Submission
                    ↓
            ┌───────┴───────┐
            ↓               ↓
      Hardware Token    Software HSM
      (ePass2003)       (KMS/Vault)
            ↓               ↓
      PKCS#11 Provider  Signing Service
```

#### Bridge Contract
**File:** `lib/eta/signer-bridge.ts` (new)

```typescript
export interface SigningBridge {
  sign(document: Buffer, digestAlgorithm: 'SHA256'): Promise<CadesBesSignature>;
  healthCheck(): Promise<boolean>;
  rotateKey?(): Promise<void>;
}

export interface CadesBesSignature {
  signedDocument: Buffer; // CAdES-BES detached or attached
  certificateInfo: {
    subject: string;
    issuer: string;
    serialNumber: string;
    validFrom: Date;
    validTo: Date;
  };
  signingTime: Date;
}
```

#### Implementation Path
1. **Phase 1 (local only):** `lib/eta/signer-gateway-contract.ts` already exists. Extend it to expose the `SigningBridge` interface over localhost HMAC. This is non-production.
2. **Phase 2 (hardware):** Integrate PKCS#11 provider for ePass2003. The local gateway accepts signing jobs only from `127.0.0.1`; production VPS runs the gateway as a systemd service with the token attached.
3. **Phase 3 (software fallback):** If hardware token is unavailable, fall back to a cloud HSM or Vault signing service. Requires separate approval and key custody policy.

#### Fail-Closed Enforcement
**File:** `lib/eta/validator.ts` (existing)

```typescript
// Existing guard: do not remove
if (!signingBridge.healthCheck()) {
  throw new Error('ETA_HARDWARE_SIGNING_NOT_CONFIGURED');
}
```

**Implementable now:** Bridge interface, local gateway contract, health checks. No production signing possible until hardware/HSM is provisioned.

**External dependencies:**
- ePass2003 PKCS#11 provider installed on production VPS.
- ETA preproduction acceptance test with signed document.
- Separate approval for software HSM fallback.

---

## 4. Approved Legal Basis for Hotel Data-Processing Consent Records

### Problem
Consent records require an approved legal basis (legitimate interest, contract, explicit consent) per hotel jurisdiction. This is a legal/compliance decision, not a code decision.

### Resolution: Jurisdiction-Aware Consent Framework

#### Model Extension
**File:** `prisma/schema.prisma` (append to `ConsentRecord` model)

```prisma
model ConsentRecord {
  // ... existing fields ...
  legalBasis           ConsentLegalBasis @default(EXPLICIT_CONSENT)
  legalBasisReference  String?           // link to privacy notice / DPA clause
  processingPurposes   Json              // ["supplier_list_ingestion", "price_comparison"]
  retentionPeriodDays  Int?              // override default retention
  hotelJurisdiction    String?           // "EG" | "AE" | "SA" etc.
}
```

```prisma
enum ConsentLegalBasis {
  EXPLICIT_CONSENT
  CONTRACT
  LEGITIMATE_INTEREST
  LEGAL_OBLIGATION
  VITAL_INTERESTS
  PUBLIC_TASK
}
```

#### UI Flow
1. Hotel admin sees consent screen during first e-invoice ingestion: "We will process your e-invoice data to extract supplier lists and compare prices. Legal basis: [pre-selected based on jurisdiction]."
2. Admin must accept or select alternative basis.
3. `ConsentRecord` created with `legalBasis`, `processingPurposes`, `hotelJurisdiction`.
4. Ingestion blocked until `ConsentRecord.status === 'GRANTED'`.

#### Default Legal Basis by Jurisdiction
| Jurisdiction | Default Basis | Notes |
|---|---|---|
| Egypt (EG) | EXPLICIT_CONSENT | ETA data is sensitive; explicit consent required |
| UAE (AE) | CONTRACT | Procurement contract includes processing clause |
| KSA (SA) | LEGITIMATE_INTEREST | Requires DPIA and opt-out mechanism |

**Implementable now:** Schema extension, consent UI component, jurisdiction detection from `Hotel.governorate` or explicit field.

**External dependency:** Legal team approves basis per jurisdiction; privacy notice updated.

---

## Implementation Sequence

| Week | Item | Owner | External Input Required |
|---|---|---|---|
| 1 | File-drop adapter + connector registry | Engineering | None |
| 1 | Supplier opt-in schema + API | Engineering + Product | None |
| 2 | Consent legal-basis schema + UI | Engineering + Legal | Legal basis approval |
| 2 | Signing bridge interface + local gateway | Engineering | None (local only) |
| 3 | First hotel onboarded via file-drop | BD + Engineering | Hotel signs DPA, provides SFTP creds |
| 3 | First supplier opt-in (tier: STANDARD) | BD + Product | Supplier agreement |
| 4 | ETA preprod signing test | Engineering + ETA | ePass2003 on VPS, ETA preprod creds |
| 4 | Production release with consent gating | Engineering | Legal sign-off on consent UI |

---

## Files to Create/Modify

### Create
- `lib/integration/connectors/einvoice-contract.ts`
- `lib/integration/connectors/einvoice-registry.ts`
- `lib/integration/connectors/adapters/file-drop.ts`
- `lib/integration/connectors/adapters/webhook.ts`
- `lib/eta/signer-bridge.ts`
- `app/api/v2/supplier/price-feed/consent/route.ts`
- `app/api/v2/integrations/einvoice-connectors/route.ts`
- `tests/p0/einvoice-connectors.spec.ts`
- `tests/p0/supplier-price-feed-consent.spec.ts`
- `tests/p0/eta-signing-bridge.spec.ts`

### Modify
- `prisma/schema.prisma` — add `SupplierConsentStatus`, `ConsentLegalBasis`, reverse relations
- `prisma/seed.ts` — add `price:feed:write`, `integration:manage` permissions
- `lib/eta/validator.ts` — wire `SigningBridge` health check (interface only)
- `lib/compliance/data-retention.ts` — respect `retentionPeriodDays` override

---

## Verification Commands

```bash
# Unit tests for new adapters and consent flow
npx vitest run tests/p0/einvoice-connectors.spec.ts \
                tests/p0/supplier-price-feed-consent.spec.ts \
                tests/p0/eta-signing-bridge.spec.ts

# Type check
npx tsc --noEmit

# Build
SESSION_SECRET=build-validation-only-not-a-runtime-secret NODE_ENV=production npm run build
```

---

## Risk Register

| Risk | Mitigation |
|---|---|
| Hotel refuses file-drop adapter | Offer webhook or OPERA CSV export as fallback |
| Supplier rejects price-feed terms | Feature still works without supplier opt-in; comparison returns `SUPPLIER_NOT_CONNECTED` |
| ePass2003 unavailable on VPS | Software HSM fallback requires separate approval; local gateway stays fail-closed until then |
| Legal basis disputed | Jurisdiction table defaults to most restrictive; legal team overrides per contract |

---

## Bottom Line

All four blockers have implementation paths that **do not require external input to start coding**. The only external gates are:
1. A hotel signing a DPA and providing an adapter config (Week 3).
2. A supplier agreement (Week 3).
3. ETA preprod credentials + hardware token on VPS (Week 4).
4. Legal approval of consent UI wording (Week 2).

The code scaffolding, interfaces, tests, and migration files can be completed immediately.
