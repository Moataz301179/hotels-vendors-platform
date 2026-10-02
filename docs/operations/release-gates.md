# Production Release Gates

A release is blocked unless all applicable gates pass:

1. **Business** — contributes to procurement intelligence, commercial workflow or measurable revenue.
2. **Product** — real user can complete the workflow.
3. **Data** — persisted, validated and tenant-isolated.
4. **Security** — unauthorized access/action is rejected in execution tests.
5. **Integration** — external provider contract, timeout, retry and failure path verified.
6. **UX** — populated, empty, loading, error and permission states verified.
7. **Operations** — failures observable and recoverable.
8. **Documentation** — actual deployed behavior documented.
9. **Deployment** — exact build artifact/commit verified in production.
10. **Business evidence** — outcome and revenue can be traced to the underlying event.

Do not use `ignoreBuildErrors`, mock business activity or hard-coded metrics as a substitute for a passing gate.
