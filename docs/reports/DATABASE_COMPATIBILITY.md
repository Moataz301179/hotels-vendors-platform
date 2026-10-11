# Database compatibility — 2026-10-11

## Verified production migration state

The live database has applied migrations through:

- `20261009010000_add_reconciliation_layer`
- `20261009020000_add_sourcing_requests`
- `20261009030000_add_order_tracking_magic_links`

The candidate contains five newer pre-spend migrations plus a supplier research candidate migration:

- `20261010103000_add_procurement_quote_tax_amount`
- `20261010104000_add_contract_rate_baselines`
- `20261010105000_link_rfq_contract_baseline`
- `20261010111000_bootstrap_procurement_rbac`
- `20261010112000_add_rfq_supplier_access`
- `20261010113000_add_supplier_quote_submit_permission`
- `20261011003000_add_supplier_research_candidates`

The live database also records a migration order/history which must be treated as authoritative operational data until recovered and compared against the source SQL.

## Release decision

**Blocked.** No `prisma migrate deploy`, `db push`, reset, seed, backfill, or direct production write is authorized by this report.

## Required next evidence

1. Restorable Neon branch or backup from the current production point.
2. Read-only schema/migration comparison against the candidate.
3. Migration rehearsal on the isolated branch using a direct, non-pooled connection.
4. Rollback assessment showing whether each candidate migration is additive and compatible with the active runtime.
