# Firecrawl catalog discovery pipeline

## What it does

This is the Option 1 MVP connector for public catalog research. The pipeline
has two separate steps:

1. **Agent Reach** discovers public supplier, marketplace and directory URLs.
2. **Firecrawl Agent** extracts structured product facts from the approved URL
   list. It is constrained to those URLs and is not allowed to invent missing
   prices, images, brands or descriptions.

The implementation is in:

- `lib/sourcing/firecrawl-client.ts`
- `lib/sourcing/firecrawl-catalog-pipeline.ts`

The pipeline does not create supplier accounts or dispatch outreach. It returns
supplier mapping candidates for the outreach/registry workflow to review.

## Fan-out model

`buildExtractionJobs(sources, categories)` creates one Firecrawl job for each
source/category pair. `FirecrawlCatalogPipeline` runs those jobs with bounded
concurrency and a per-source rate limiter. `runDiscoveredCatalog` accepts an
Agent Reach adapter, so source discovery can fan out independently without
putting Agent Reach credentials or a CLI dependency inside the web process.

```ts
const report = await runDiscoveredCatalog({
  tenantId,
  categories: ["Food and Beverage", "Housekeeping"],
  discovery: agentReachSourceAdapter,
  persist: false,
});
```

For production, the adapter must return only public URLs that have been
approved for retrieval. Do not pass login pages, private portals, or URLs that
are not authorized for this use.

## Data rules

- A product must have a real name and an HTTP(S) source URL.
- A missing or non-numeric price becomes `RFQ_REQUIRED`; no price is guessed.
- A public image is retained as a source reference and marked
  `SOURCE_REVIEW_REQUIRED`. The platform does not claim image rights merely
  because a URL is reachable.
- One product identity can have many source observations. Product identity
  deduplication does not discard the source URL, timestamp, price or image.
- Price comparison is `COMPARISON_READY` only when at least two observed prices
  are available for the same identity. One price is `SINGLE_OBSERVATION`.
- `persist: false` is the safe default. Set `persist: true` only from a
  tenant-scoped server job after the catalog migration has been applied and
  the source list has been approved.

## Configuration

The cloud service requires a server-only `FIRECRAWL_API_KEY`. The key must be
provided through the VPS secret manager or process environment; never commit it
to `.env`, source control, browser code or mobile code.

Required for the cloud API:

```bash
FIRECRAWL_API_KEY=fc-...
```

Optional settings:

```bash
FIRECRAWL_API_URL=https://api.firecrawl.dev
FIRECRAWL_MODEL=spark-1-mini
FIRECRAWL_MAX_CREDITS_PER_JOB=100
FIRECRAWL_MAX_RETRIES=3
FIRECRAWL_RETRY_BASE_MS=500
FIRECRAWL_REQUEST_TIMEOUT_MS=120000
FIRECRAWL_POLL_INTERVAL_MS=5000
FIRECRAWL_MAX_WAIT_MS=300000
```

The implementation supports a self-hosted Firecrawl URL without a cloud key,
but the self-hosted endpoint must be explicitly configured and reachable from
the server. A missing cloud key returns a visible
`FIRECRAWL_CONFIGURATION_REQUIRED` result; it does not silently fall back to a
mock extractor.

## Operational sequence

1. Run `agent-reach doctor --json` and use its available web/search backend to
   discover candidate public URLs.
2. Review/approve source URLs and assign source type/category.
3. Pass the approved source list to `runDiscoveredCatalog`.
4. Store the report/job ID and poll completion through the existing job
   orchestration layer if the run is asynchronous.
5. Review `supplierMappings`, image-rights state and RFQ-required rows.
6. Run again with `persist: true` from a tenant-scoped server worker only after
   database migration/readiness checks pass.
7. A separate publication step may activate an item; extraction itself never
   makes a market reference an orderable supplier offer.

## Testing

The unit suite uses an injected Firecrawl client and does not call Firecrawl or
write the database. Run:

```bash
npx vitest run tests/unit/firecrawl-catalog-pipeline.spec.ts
```

The tests cover request fan-out, retry behavior, duplicate observations,
missing prices, image-rights flags, supplier mapping hooks and the Agent Reach
adapter boundary.
