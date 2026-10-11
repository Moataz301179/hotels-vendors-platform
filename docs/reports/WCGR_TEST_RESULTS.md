# WCGR test results — 2026-10-11

| Test activity | Result | Boundary |
| --- | --- | --- |
| Candidate unit/API suite | 19 files, 89 tests passed | Mocked or isolated test database boundaries; not live production. |
| Candidate TypeScript/build | Previously passed for candidate staging package | Build proof only. |
| Staging public/auth smoke | Health carries SHA; assets load; protected admin API returns 401 without credentials | Does not prove a signed-in role transaction. |
| Mobile typecheck | Passed | Static compilation only. |
| Mobile Expo exports | iOS and Android exports passed | JavaScript bundles only, not signed native releases. |
| Production public health | HTTP 200 | Failed provenance requirement: release ID and commit absent. |
| Production PM2/Nginx inspection | Listener, cwd and upstream captured | Confirms a live process; source commit still unknown. |
| Production database read-only migration inventory | Completed | Candidate migration application not attempted. |

## Required follow-up tests

1. Staging authenticated Hotel → RFQ → assigned supplier quote → authority approval → guaranteed PO → GRN → invoice/ETA outcome using isolated test tenants.
2. Cross-tenant negative checks for each mutation in that flow.
3. Mobile real-device sign-up/sign-in, API profile provisioning and restart persistence for iOS and Android.
4. Candidate migration rehearsal against a Neon clone and rollback/compatibility verification.
5. Production smoke only after release identity and rollback gates pass.
