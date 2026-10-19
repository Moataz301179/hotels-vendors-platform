# Keep immutable transaction evidence beside mutable procurement projections

HotelsVendors will retain one internal Network Transaction for each RFQ-led
procurement lifecycle and append hash-linked Network Transaction Events for
material RFQ, quote, order, receipt, invoice, payment and authorized financing
changes. Operational tables remain mutable projections for current work;
corrections append superseding evidence rather than rewriting history. This is
deliberately separate from buyer-facing discovery and Vendor disclosure, and it
does not set a legal retention period: retention schedules and tenant deletion
handling require approved legal and contractual policy before activation.

## Consequences

- A transaction cannot be treated as archived merely because its order or
  invoice has a `deletedAt` value.
- Tenant deletion must be blocked or converted to an approved archival and
  privacy-remediation procedure while retained transaction evidence exists.
- The ledger is internal. Funder access, if approved later, receives a
  field-whitelisted, consented snapshot rather than direct database access.
