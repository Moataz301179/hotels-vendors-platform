<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## HotelsVendors project continuity

This repository is the durable source of project context. Do not rely on Hermes,
Claude memory, chat history, or external agent-memory services for project truth.

- The only official development workspace is `/Users/Moatazi/hotels-vendors-new`
  on `main`. Do not create a competing worktree, branch, repository, or deployment
  path unless the owner explicitly asks for one.
- Preserve existing local work. Never reset, clean, stash, overwrite, or reconcile
  uncommitted changes without explicit owner approval.
- Treat the product as a hospitality sourcing and procurement network. Buyer-facing
  discovery and RFQ flows must not disclose vendor identity, private commercial
  data, source URLs, stock, or binding offers before the authorized execution and
  invoicing stages.
- Before material implementation, release, database, or infrastructure work, read
  this file and the relevant current handover or release evidence in the repository.
  Separate verified facts, assumptions, and unknowns; code presence and a green CI
  job do not prove production behaviour.
- After material work, update the current repository handover with the source
  revision, changed scope, verification evidence, unresolved risks, and exact next
  action. Never record credentials, tokens, or personal data.
- Hermes is out of scope unless the owner explicitly requests a separately verified
  integration, including its access model, controls, and acceptance checks.
- Use `.agents/skills/hv-project-memory/SKILL.md` whenever a request depends on
  prior HotelsVendors decisions, release state, product rules, or pending work.
