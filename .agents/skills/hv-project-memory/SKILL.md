---
name: hv-project-memory
description: Recover and maintain repository-owned HotelsVendors context for any request involving prior decisions, release state, product rules, or pending work.
---

# HotelsVendors project memory

Use this skill when a request depends on prior project context. It replaces no
runtime application memory; it is the continuity procedure for agents working on
this repository.

## Read before acting

1. Read `AGENTS.md`.
2. Identify the current source state with `git status --short --branch` and the
   current commit. Do not change it during this check.
3. Read the relevant current handover, release evidence, and task-specific docs
   only when they exist and directly relate to the request. Prefer the newest
   evidence over old summaries.
4. State which facts are verified now, which are inherited context, and which
   still need verification.

## Operating invariants

- Work only from the official workspace and branch named in `AGENTS.md`.
- Do not turn an old handover into proof of current production state.
- Preserve uncommitted work and avoid duplicate workspaces or parallel edits.
- Never place secrets, raw customer data, vendor-private terms, or production
  credentials in handovers or agent instructions.
- Maintain anonymous procurement boundaries: research data and market references
  are not live offers; vendor identity and private commercial information remain
  restricted until the authorized workflow stage.

## Record material outcomes

When an authorized change or investigation is complete, update the repository's
current handover or operational record with: revision, scope, commands or checks
run, observable result, unresolved risk, and next owner action. If no suitable
record exists, ask before inventing a new documentation structure.

## Exclusions

Do not use Hermes as memory or project control. Use it only when the owner has
explicitly asked for a verified Hermes integration.
