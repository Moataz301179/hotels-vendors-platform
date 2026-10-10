# Egyptian hospitality catalog and supplier-register MVP

## Objective

Build the data foundation for two connected purchasing modes:

1. normal procurement from verified fixed-price or RFQ-only listings; and
2. pre-spend procurement, which compares comparable offers, contract baselines,
   delivery, tax, and the buyer's own historical purchases before creating a
   controlled RFQ.

The first commercial catalog target is 5,000 active, normalized SKUs. This is
a target inventory, not a claim that 5,000 records have been collected or
verified.

## Data states

- `RESEARCH_CANDIDATE`: public-source lead only; cannot trade, receive RFQs,
  or appear in a buyer catalog.
- `VERIFICATION_PENDING`: basic legal and commercial evidence submitted.
- `VERIFIED`: legal entity, tax identity, category fit, and commercial contact
  reviewed by an authorized platform operator.
- `ACTIVE`: verified supplier with at least one reviewed product listing.
- `SUSPENDED`: excluded from discovery and transactions.

Public research must never be treated as tax verification, a commercial
relationship, catalog availability, price, stock, or consent to be contacted.

## MVP taxonomy

`data/staging/hospitality-catalog-taxonomy.v1.json` assigns a 5,000-SKU target
across hospitality purchasing categories. Each product record must eventually
contain a supplier-owned SKU, category, unit of measure, procurement mode,
price or RFQ-only flag, delivery terms, tax state, and provenance.

## Supplier register intake

`data/staging/egypt-hospitality-supplier-register.v1.json` is an intake queue,
not a production supplier table. It contains only public source URLs and
category claims observed in the current research run. Importers must:

1. deduplicate by legal entity and website;
2. obtain and validate legal/tax/commercial data outside Git;
3. create tenant-scoped Supplier records in staging only after review;
4. keep non-public data and personal contacts out of version control;
5. add product data only with supplier provenance and a review result.

## Pre-spend evidence requirements

The pre-spend agent may rank a recommendation only when it has comparable
product identity, an observed offer or contract baseline, quantity, currency,
delivery cost/state, tax amount/state, timestamp, and source provenance. It
must show `INSUFFICIENT_EVIDENCE` rather than claim lowest cost when any
required comparable input is missing. It may prepare RFQs but may not bypass
supplier verification, Authority Matrix approval, payment guarantee, delivery,
GRN, invoice, or ETA gates.

## Initial acceptance criteria

- taxonomy targets sum to 5,000 SKUs;
- every supplier candidate has a current public source URL and one or more
  mapped catalog categories;
- no candidate is seeded as verified or active;
- staging import remains separate from production;
- an operator can review source provenance before activation.
