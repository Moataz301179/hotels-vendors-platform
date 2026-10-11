# Risk and control matrix — current release candidate

| Process | What could go wrong | Preventive control | Evidence / current result | State |
| --- | --- | --- | --- | --- |
| Clerk identity | Unverified email creates an account | Verified primary email required before database authorization | `tests/p0/verified-identity.spec.ts` | Tested in isolation |
| Tenant scope | Caller supplies another tenant ID | Actor-derived tenant filters in v2 routes | `tenant-isolation`, audit and procurement tests | Tested in isolation |
| Supplier quote | Unassigned supplier views or submits an RFQ quote | Supplier grant, tenant and permission checks | `pre-spend-quotes-route` tests | Tested in isolation |
| Cost total | PO conversion invents VAT | Quote tax is supplier-provided; incomplete cost blocks conversion | `pre-spend-costs`, procurement tests | Tested in isolation |
| Duplicate conversion | Quote converts twice | Status claim inside transaction | procurement regression test | Tested in isolation |
| Approval | Buyer bypasses authority/payment guarantee | DB authority rule + guarantee gate | `authority-policy` test | Tested in isolation |
| Receiving | Over-receipt or direct delivery completion | Serialized GRN, line validation, cumulative quantities | `grn-acceptance` test | Tested in isolation |
| Audit | Tenant reads foreign audit records | Actor tenant scope and cursor ownership check | `audit-access` test | Tested in isolation |
| Savings claim | Browser submits invented saving amount | Receipt-derived calculation and financial-controller role | `outcome-verification` test | Tested in isolation |
| Live release | Wrong artifact is deployed | SHA/release ID health evidence required | Production returns null identity | Failed / blocker |
| Schema | Candidate code runs against incompatible DB | Backup/branch + migration rehearsal required | Divergent live history found | Failed / blocker |
| Mobile session | Clerk identity lacks provisioned tenant user | `/api/v2/me` contract is validated and fails closed | Typecheck/exports pass; device flow untested | Partial |

The matrix is a test and design control inventory, not a production security certification.
