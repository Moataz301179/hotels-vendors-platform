# HOVIN Mobile Workstream — Index

Rebuild of HOVIN around specialist mobile architecture skills, grounded in the existing HotelsVendors platform.

| Doc | Contents |
|---|---|
| [A — Existing-State Assessment](A-existing-state-assessment.md) | Verified mobile/backend reality, workflow and authority, gaps |
| [B — Boundary & Permission Matrix](B-boundary-and-permission-matrix.md) | Mobile vs web-only, user→job→permission→API→evidence→acceptance |
| [C — Architecture, Offline, Security](C-architecture-offline-security.md) | Identity, API layer, state separation, offline per action, visual tokens, i18n |
| [D — Release Scope & Acceptance](D-release-scope-and-acceptance.md) | P0/P1/P2 scope and the acceptance matrix |
| [E — Run Report & Handover](E-run-report.md) | Commits, changed files, real command outcomes, gaps, next approval |

**Status:** prototype implemented on `feat/hovin-mobile-execution` (`ce4789e5`); mobile typecheck clean, 39/39 unit tests pass, root typecheck 0 errors. No device run yet — staging + test auth approval required.

**Constraints honored:** Expo SDK 54, Clerk identity, no client role selector, no production writes, no deploy, no push.
