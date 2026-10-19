# HotelsVendors commercial disclosure vocabulary

## Anonymous catalog product

A product discovery record for hotel teams. It may show the item name,
category, specification, image, and request-for-quote action. It is not a
supplier listing, stock promise, or binding price.

## Market reference

An internally traceable observation used for sourcing research. It is not a
live offer and is never represented as verified stock or a commercial promise.

## Anonymous RFQ comparison

A hotel-facing comparison of recorded commercial terms without supplier
identity. It may show comparable price, tax treatment, pack, delivery charge,
ETA, validity, and delivery conditions when those fields were supplied in a
real response.

## Supplier disclosure gate

Supplier identity stays protected from the hotel catalogue and RFQ comparison.
It becomes available to the hotel only after the approval is complete and an
invoice or e-invoice exists for the approved commercial record.

## Audit evidence

The protected internal record linking products, quotes, source observations,
suppliers, approvals, invoices, and actions. It remains available to properly
authorized operational and audit roles.

## Network transaction

The single procurement lifecycle rooted in one RFQ and connected to its
commercial response, order, receipt, invoice and permitted settlement evidence.
_Avoid_: sale, marketplace order, lead

## Network transaction event

An immutable, hash-linked evidence record for a material lifecycle change. A
correction appends a later event; it does not rewrite the earlier event.
_Avoid_: activity log, editable history

## Transaction archive

The retained, tenant-scoped evidence package for a finalized network
transaction. It is not a public catalogue record, a Vendor offer, or a funder
decision.
