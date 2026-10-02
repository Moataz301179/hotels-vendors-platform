# Commercial Workflow State Machines

## Opportunity / Virtual Shadow

`PROPOSED → REVIEWED → ACTION_READY → ACTIONED → OUTCOME_PENDING → COMPLETED`

Any non-terminal state may be rejected where business rules allow it. Every transition requires an authorized actor, validation, timestamp and audit event.

## Procurement

`DISCOVERED → QUALIFIED → RFQ_CREATED → SUPPLIERS_MATCHED → QUOTES_RECEIVED → QUOTE_SELECTED → ORDER_CREATED → FULFILLMENT → COMPLETED → OUTCOME_RECORDED`

The existing order state machine remains the transaction authority for orders. The intelligence layer may recommend or prepare an action; it must not bypass order transition gates.

## Supplier opportunity

`DETECTED → QUALIFIED → PRESENTED → ACCEPTED → QUOTED → WON → FULFILLED → COMPLETED`

## Funding referral

`SIGNAL_DETECTED → QUALIFIED → REFERRED → EXTERNAL_REVIEW → APPROVED/DECLINED → CONVERTED → COMMISSION_RECORDED`

Financing approval/decline is always external.
